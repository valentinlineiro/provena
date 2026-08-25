// CARD-027: runs the periodic market ingestion sync outside Cloudflare
// Workers, whose Free-tier 10ms CPU budget the recognition+HTML-cleanup
// workload exceeds by ~200x (observed: ~2020ms median, 100% error rate).
// Invoked by .github/workflows/market-sync.yml on the same 6-hour cadence
// the Worker's Cron trigger used, and via workflow_dispatch for a manual
// run. The Worker keeps serving HTTP/API; this owns ingestion exclusively
// so the two runtimes never run the same sync twice (CARD-027's invariant).
import postgres from 'postgres'
import {
  GreenhousePublicSource,
  MarketIngestionEngine,
  MarketFeedService,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  PROMOTED_OPERATIONAL_KNOWLEDGE,
} from '@provena/core'
import {
  PostgresMarketOpportunityRepository,
  PostgresMarketPostingRepository,
  PostgresMarketModelStore,
} from './index.js'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const sql = postgres(databaseUrl, { max: 1 })
  try {
    const oppRepo = new PostgresMarketOpportunityRepository(sql)
    const postRepo = new PostgresMarketPostingRepository(sql)
    const modelStore = new PostgresMarketModelStore(sql)
    const composedK = composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)
    const recognizer = new DeclarativeMarketRecognizer(composedK)

    const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
    const feedService = new MarketFeedService(postRepo, engine)

    const source = new GreenhousePublicSource('stripe', { maxSizeBytes: 10 * 1024 * 1024 })
    const registration = {
      id: 'stripe-board',
      sourceType: 'greenhouse' as const,
      source,
      sourceBoardId: 'stripe',
    }

    const result = await feedService.syncSource(registration, {
      now: new Date().toISOString(),
      marketKnowledgeVersion: composedK.version,
      recognitionOrder: 100,
    })

    console.log(JSON.stringify(result.ingestResult, null, 2))
  } finally {
    await sql.end()
  }
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : String(err))
  process.exit(1)
})
