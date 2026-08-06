// ── O2.5A: Global Market Ingestion Engine ─────────────────────────────────────
//
// Ingests raw market observations (RawOpportunity) into the shared catalog.
// Pure global pipeline — strictly decoupled from candidate Profile, PreferenceSet, or User identity.
//
//   IngestionEngine ⊥ K_market ⊥ User
//
// Ingestion Flow:
// 1. Canonicalization: RawOpportunity → Opportunity + OpportunityPosting
// 2. Content Revisioning: sha256(rawDescription) tracks observation content state
// 3. Persistence: Deduplicates posting on (sourceType, externalId)
// 4. Market Recognition: If posting is new OR rawDescription contentHash changed,
//    extracts market requirements using the injected recognizer and appends a MarketModelRecord.
// 5. Inactive reconcile: Postings for the source not present in the current sync are marked active=false.

import { createHash } from 'node:crypto'
import type {
  MarketOpportunityRepository,
  MarketPostingRepository,
  MarketModelStore,
} from './market-catalog-ports.js'
import type {
  OpportunityPosting,
  MarketModelRecord,
  SourceType,
} from './market-catalog.js'
import {
  makeOpportunityId,
  makeOpportunityPostingId,
  normalizeOpportunityTitle,
} from './market-catalog.js'
import type { RawOpportunity } from './opportunity-source.js'
import type { MarketModel } from './market.js'
import type { RoleFamily, RoleLevel } from './preference-set.js'
import { parseRoleRequirement } from './opportunity.js'

export function computeContentHash(text: string): string {
  return createHash('sha256').update(text.trim()).digest('hex')
}

export interface MarketRecognizer {
  extractMarketRequirements(jd: string): MarketModel
}

export interface IngestionContext {
  /** ISO 8601 string for current sync execution time */
  readonly now: string
  /** Version tag of the MarketRecognizer being used (e.g. "1.7.0") */
  readonly marketKnowledgeVersion: string
  /** Monotonic integer for current recognition execution order */
  readonly recognitionOrder: number
  /** Source system being synced (e.g. 'greenhouse', 'lever', 'url-fetch') */
  readonly sourceType: SourceType
  /** Optional source-specific identifier (e.g. board token 'stripe' for greenhouse) */
  readonly sourceBoardId?: string
}

export interface IngestResult {
  readonly totalIngested: number
  readonly newlyAddedPostings: number
  readonly updatedPostings: number
  readonly unchangedPostings: number
  readonly deactivatedPostings: number
  readonly newMarketModelsGenerated: number
}

export class MarketIngestionEngine {
  constructor(
    private readonly opportunities: MarketOpportunityRepository,
    private readonly postings: MarketPostingRepository,
    private readonly models: MarketModelStore,
    private readonly recognizer: MarketRecognizer,
  ) {}

  async ingest(
    rawOpportunities: readonly RawOpportunity[],
    context: IngestionContext,
  ): Promise<IngestResult> {
    let newlyAddedPostings = 0
    let updatedPostings = 0
    let unchangedPostings = 0
    let newMarketModelsGenerated = 0

    const seenPostingIdsInCurrentSync = new Set<string>()

    for (const raw of rawOpportunities) {
      const sourceType = (raw.source ?? context.sourceType) as SourceType
      const externalId = raw.externalId ?? raw.url
      const postingDedupeId = makeOpportunityPostingId(`${sourceType}:${externalId}`)
      seenPostingIdsInCurrentSync.add(postingDedupeId)

      // Derive or resolve canonical Opportunity
      const companyName = raw.company ?? context.sourceBoardId ?? 'Unknown'
      const normalizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const oppDedupeKey = makeOpportunityId(`opp-${normalizedCompany}-${externalId}`)

      let opportunity = await this.opportunities.findById(oppDedupeKey)
      const parsedRole = parseRoleRequirement(raw.description)

      if (!opportunity) {
        opportunity = {
          id: oppDedupeKey,
          company: { name: companyName },
          title: raw.title,
          normalizedTitle: normalizeOpportunityTitle(raw.title),
          ...(parsedRole.family !== 'unknown' ? { roleFamily: parsedRole.family as RoleFamily } : {}),
          ...(parsedRole.level !== 'unknown' ? { roleLevel: parsedRole.level as RoleLevel } : {}),
        }
        await this.opportunities.save(opportunity)
      }

      // Check existing posting
      const existingPosting = await this.postings.findById(postingDedupeId)
      const newHash = computeContentHash(raw.description)
      let needsRecognition = false

      if (!existingPosting) {
        const newPosting: OpportunityPosting = {
          id: postingDedupeId,
          opportunityId: opportunity.id,
          sourceType,
          externalId,
          url: raw.url,
          ...(raw.location ? { location: raw.location } : {}),
          ...(raw.publishedAt ? { publishedAt: raw.publishedAt } : {}),
          firstSeenAt: context.now,
          lastSeenAt: context.now,
          active: true,
          rawDescription: raw.description,
        }
        await this.postings.save(newPosting)
        newlyAddedPostings++
        needsRecognition = true
      } else {
        const oldHash = computeContentHash(existingPosting.rawDescription)
        const contentChanged = oldHash !== newHash

        const updatedPosting: OpportunityPosting = {
          ...existingPosting,
          url: raw.url,
          lastSeenAt: context.now,
          active: true,
          rawDescription: raw.description,
          ...(raw.location ? { location: raw.location } : {}),
          ...(raw.publishedAt ? { publishedAt: raw.publishedAt } : {}),
        }

        await this.postings.save(updatedPosting)

        if (contentChanged) {
          updatedPostings++
          needsRecognition = true
        } else {
          unchangedPostings++
        }
      }

      // Extract & record MarketModel if posting is new or description changed
      if (needsRecognition) {
        const marketModel = this.recognizer.extractMarketRequirements(raw.description)
        const record: MarketModelRecord = {
          opportunityId: opportunity.id,
          marketKnowledgeVersion: context.marketKnowledgeVersion,
          recognitionOrder: context.recognitionOrder,
          marketModelJson: marketModel,
          recognitionCoverage: marketModel.recognitionCoverage,
          recognizedAt: context.now,
        }

        // Save/Replace MarketModelRecord for the updated posting content
        const existingModel = await this.models.findByVersion(
          opportunity.id,
          context.marketKnowledgeVersion,
        )
        if (!existingModel) {
          await this.models.save(record)
          newMarketModelsGenerated++
        }
      }
    }

    // Reconcile inactive postings for the current source
    let deactivatedPostings = 0
    const allOpportunities = await this.opportunities.list()
    for (const opp of allOpportunities) {
      const oppPostings = await this.postings.listByOpportunity(opp.id)
      for (const p of oppPostings) {
        if (p.sourceType === context.sourceType && p.active && !seenPostingIdsInCurrentSync.has(p.id)) {
          await this.postings.markInactive(p.id, context.now)
          deactivatedPostings++
        }
      }
    }

    return {
      totalIngested: rawOpportunities.length,
      newlyAddedPostings,
      updatedPostings,
      unchangedPostings,
      deactivatedPostings,
      newMarketModelsGenerated,
    }
  }
}
