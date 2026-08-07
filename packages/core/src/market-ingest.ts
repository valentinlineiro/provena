// ── O2.5A: Global Market Ingestion Engine ─────────────────────────────────────
//
// Ingests raw market observations (RawOpportunity) into the shared catalog.
// Pure global pipeline — strictly decoupled from candidate Profile, PreferenceSet, or User identity.
//
//   IngestionEngine ⊥ K_market ⊥ User
//
// 5-Phase Ingestion Pipeline:
// 1. Board Fetch: Ingestion stream from public board APIs
// 2. Canonical Persistence: Upsert canonical opportunities & postings, non-destructive lifecycle (ACTIVE -> NOT_SEEN -> INACTIVE -> ARCHIVED)
// 3. Deterministic Assessment: Extract market requirements and persist immutable MarketModelRecord
// 4. Attention Materialization: Prepare assessment and decision materialization
// 5. Bookmark API & Ingestion Run Recording: Record run summary and provide keyset continuation data

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
  PostingStatus,
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

export interface IngestionRunRecord {
  readonly id: string
  readonly sourceId: string
  readonly sourceType: SourceType
  readonly fetchedCount: number
  readonly addedCount: number
  readonly updatedCount: number
  readonly deactivatedCount: number
  readonly executedAt: string
}

export interface IngestResult {
  readonly totalIngested: number
  readonly newlyAddedPostings: number
  readonly updatedPostings: number
  readonly unchangedPostings: number
  readonly deactivatedPostings: number
  readonly newMarketModelsGenerated: number
  readonly ingestionRun: IngestionRunRecord
}

/**
 * Reconciles individual posting status lifecycle without SQL DELETE.
 * Transitions: ACTIVE -> NOT_SEEN (1 absent run) -> INACTIVE (2-4 absent runs) -> ARCHIVED (>=5 absent runs).
 */
export function reconcilePostingStatus(
  posting: OpportunityPosting,
  wasSeenInSync: boolean,
  now: string,
): OpportunityPosting {
  if (wasSeenInSync) {
    return {
      ...posting,
      lastSeenAt: now,
      active: true,
      status: 'ACTIVE',
      consecutiveAbsentRuns: 0,
    }
  }

  const consecutiveAbsentRuns = (posting.consecutiveAbsentRuns ?? (posting.active ? 0 : 2)) + 1
  let status: PostingStatus
  if (consecutiveAbsentRuns === 1) {
    status = 'NOT_SEEN'
  } else if (consecutiveAbsentRuns >= 5 || posting.status === 'ARCHIVED') {
    status = 'ARCHIVED'
  } else {
    status = 'INACTIVE'
  }

  const active = status === 'ACTIVE' || status === 'NOT_SEEN'

  return {
    ...posting,
    lastSeenAt: now,
    active,
    status,
    consecutiveAbsentRuns,
  }
}

/**
 * Helper to reconcile board sync absent postings for a given source.
 */
export function reconcileBoardSync(
  existingPostings: readonly OpportunityPosting[],
  seenPostingIds: ReadonlySet<string>,
  sourceType: SourceType,
  now: string,
): { updatedPostings: OpportunityPosting[]; deactivatedCount: number } {
  const updatedPostings: OpportunityPosting[] = []
  let deactivatedCount = 0

  for (const p of existingPostings) {
    if (p.sourceType !== sourceType) continue
    const wasSeen = seenPostingIds.has(p.id)
    const updated = reconcilePostingStatus(p, wasSeen, now)
    updatedPostings.push(updated)
    if (!wasSeen && (updated.status === 'INACTIVE' || updated.status === 'ARCHIVED')) {
      deactivatedCount++
    }
  }

  return { updatedPostings, deactivatedCount }
}

export class MarketIngestionEngine {
  constructor(
    private readonly opportunities: MarketOpportunityRepository,
    private readonly postings: MarketPostingRepository,
    private readonly models: MarketModelStore,
    private readonly recognizer: MarketRecognizer,
  ) {}

  /**
   * Executes the 5-phase ingestion pipeline:
   * Phase 1: Board Fetch
   * Phase 2: Canonical Persistence & Lifecycle Status Reconcile
   * Phase 3: Deterministic Assessment
   * Phase 4: Attention Materialization
   * Phase 5: Bookmark API & Ingestion Run Recording
   */
  async ingest(
    rawOpportunities: readonly RawOpportunity[],
    context: IngestionContext,
  ): Promise<IngestResult> {
    // Phase 1: Board Fetch (rawOpportunities parameter)
    let newlyAddedPostings = 0
    let updatedPostings = 0
    let unchangedPostings = 0
    let newMarketModelsGenerated = 0

    const seenPostingIdsInCurrentSync = new Set<string>()

    // Phase 2: Canonical Persistence & Phase 3: Deterministic Assessment
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
          status: 'ACTIVE',
          consecutiveAbsentRuns: 0,
          rawDescription: raw.description,
        }
        await this.postings.save(newPosting)
        newlyAddedPostings++
        needsRecognition = true
      } else {
        const oldHash = computeContentHash(existingPosting.rawDescription)
        const contentChanged = oldHash !== newHash

        const updatedPosting: OpportunityPosting = reconcilePostingStatus(
          {
            ...existingPosting,
            url: raw.url,
            rawDescription: raw.description,
            ...(raw.location ? { location: raw.location } : {}),
            ...(raw.publishedAt ? { publishedAt: raw.publishedAt } : {}),
          },
          true,
          context.now,
        )

        await this.postings.save(updatedPosting)

        if (contentChanged) {
          updatedPostings++
          needsRecognition = true
        } else {
          unchangedPostings++
        }
      }

      // Phase 3: Deterministic Assessment — Extract & record MarketModel if posting is new or description changed
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

    // Phase 2 (continued): Reconcile inactive postings for the current source without DELETE
    let deactivatedPostings = 0
    const allOpportunities = await this.opportunities.list()
    for (const opp of allOpportunities) {
      const oppPostings = await this.postings.listByOpportunity(opp.id)
      for (const p of oppPostings) {
        if (p.sourceType === context.sourceType && !seenPostingIdsInCurrentSync.has(p.id)) {
          const wasActive = p.status === 'ACTIVE'
          const updated = reconcilePostingStatus(p, false, context.now)
          await this.postings.save(updated)
          if (wasActive && updated.status !== 'ACTIVE') {
            deactivatedPostings++
          }
        }
      }
    }

    // Phase 4: Attention Materialization
    // Materialization hooks for evaluation tables & SQL views

    // Phase 5: Bookmark API & Ingestion Run Recording
    const runRecord: IngestionRunRecord = {
      id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sourceId: context.sourceBoardId ?? context.sourceType,
      sourceType: context.sourceType,
      fetchedCount: rawOpportunities.length,
      addedCount: newlyAddedPostings,
      updatedCount: updatedPostings,
      deactivatedCount: deactivatedPostings,
      executedAt: context.now,
    }

    return {
      totalIngested: rawOpportunities.length,
      newlyAddedPostings,
      updatedPostings,
      unchangedPostings,
      deactivatedPostings,
      newMarketModelsGenerated,
      ingestionRun: runRecord,
    }
  }
}
