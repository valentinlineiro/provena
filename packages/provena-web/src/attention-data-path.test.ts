import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// CARD-026: regression guards for the production data-path restoration.
// The Worker requires Env (KV/Postgres bindings) to invoke directly, so
// this validates at the source level, same as knowledge-consistency.test.ts.

const __dirname = dirname(fileURLToPath(import.meta.url))
const indexSource = readFileSync(join(__dirname, 'index.ts'), 'utf-8')

test('every GreenhousePublicSource construction raises maxSizeBytes above the 2MB default (regression for CARD-026 sync failure)', () => {
  // The default fetchSafeContent cap (2MB) is too small for a full
  // Greenhouse board listing with content=true -- Stripe's board alone is
  // ~4.5MB. Only /api/opportunities/ingest (on-demand, single-board) still
  // constructs this in the Worker after CARD-027 moved the periodic sync
  // out to packages/market-postgres/src/sync-market.ts.
  const constructions = indexSource.match(/new GreenhousePublicSource\([^)]*\)/g) ?? []
  assert.equal(constructions.length, 1, `expected exactly the /api/opportunities/ingest construction site, found ${constructions.length}`)
  for (const call of constructions) {
    assert.match(call, /maxSizeBytes/, `${call} does not raise maxSizeBytes above the 2MB default`)
  }
})

test('the Worker no longer runs periodic ingestion itself (regression for CARD-027 duplicate-ingestion-model)', () => {
  // CARD-027: periodic ingestion moved to GitHub Actions
  // (.github/workflows/market-sync.yml) because the Worker's Free-tier
  // 10ms CPU budget can't fit the recognition+HTML-cleanup workload
  // (observed ~2020ms median, 100% error rate). Running the same
  // MarketIngestionEngine on a schedule inside the Worker too would
  // reintroduce the duplicate ingestion model CARD-027 forbids.
  assert.ok(!/async scheduled\(/.test(indexSource), 'a scheduled() Cron handler must not reappear in the Worker')
  assert.ok(!/new MarketFeedService\(/.test(indexSource), 'MarketFeedService must not be constructed in the Worker -- that is sync-market.ts\'s job now')
})

test('a backend failure in GET /api/opportunities returns a non-200 status (regression for CARD-025 silent-empty-inbox finding)', () => {
  const handlerStart = indexSource.indexOf("url.pathname === '/api/opportunities'")
  assert.ok(handlerStart > -1, 'GET /api/opportunities handler not found')
  const catchStart = indexSource.indexOf('} catch (e) {', handlerStart)
  assert.ok(catchStart > -1, 'catch block not found in the /api/opportunities handler')
  const catchBlock = indexSource.slice(catchStart, catchStart + 600)
  assert.match(catchBlock, /status:\s*500/, 'the catch block must not return status: 200 on a real backend failure')
})
