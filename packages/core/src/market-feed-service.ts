// ── O2.8: Market Feed Service (Autonomous Delta Sync Engine) ───────────────────
//
// Coordinates continuous, autonomous feed ingestion without polling by candidate/user.
// Invariant: Work_{t+1} ∝ ΔMarket
//
// Invalidates & reassesses ONLY candidates whose MarketModel or posting revision changed.

import type {
  MarketPostingRepository,
} from './market-catalog-ports.js'
import type {
  MarketIngestionEngine,
  IngestionContext,
  IngestResult,
} from './market-ingest.js'
import type { RawOpportunity } from './opportunity-source.js'

export interface FeedSourceRegistration {
  readonly id: string
  readonly sourceType: import('./market-catalog.js').SourceType
  readonly source: { fetchAllBoardJobs(): Promise<RawOpportunity[]> }
  readonly sourceBoardId?: string
}

export interface DeltaSyncResult {
  readonly sourceId: string
  readonly ingestResult: IngestResult
  readonly affectedOpportunityIds: readonly string[]
  readonly executedAt: string
}

export class MarketFeedService {
  constructor(
    private readonly postings: MarketPostingRepository,
    private readonly ingestionEngine: MarketIngestionEngine,
  ) {}

  async syncSource(
    registration: FeedSourceRegistration,
    context: Omit<IngestionContext, 'sourceType' | 'sourceBoardId'>,
  ): Promise<DeltaSyncResult> {
    const rawOpportunities = await registration.source.fetchAllBoardJobs()

    const fullContext: IngestionContext = {
      ...context,
      sourceType: registration.sourceType,
      ...(registration.sourceBoardId ? { sourceBoardId: registration.sourceBoardId } : {}),
    }

    const ingestResult = await this.ingestionEngine.ingest(rawOpportunities, fullContext)

    // Collect affected opportunity IDs (new or updated postings)
    const affectedOpportunityIds: string[] = []
    for (const raw of rawOpportunities) {
      const externalId = raw.externalId ?? raw.url
      const companyName = raw.company ?? registration.sourceBoardId ?? 'Unknown'
      const normalizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
      const oppId = `opp-${normalizedCompany}-${externalId}`

      const postingId = `${registration.sourceType}:${externalId}`
      const posting = await this.postings.findById(postingId as any)

      if (posting && (posting.firstSeenAt === context.now || posting.lastSeenAt === context.now)) {
        affectedOpportunityIds.push(oppId)
      }
    }

    return {
      sourceId: registration.id,
      ingestResult,
      affectedOpportunityIds: [...new Set(affectedOpportunityIds)],
      executedAt: context.now,
    }
  }
}
