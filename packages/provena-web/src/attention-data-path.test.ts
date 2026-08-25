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
  // ~4.5MB. /api/opportunities/ingest already carried this fix; /api/market/sync
  // and the Cron scheduled handler did not, which is why sync silently
  // failed after the schema fix was applied.
  const constructions = indexSource.match(/new GreenhousePublicSource\([^)]*\)/g) ?? []
  assert.ok(constructions.length >= 3, `expected at least the 3 known construction sites, found ${constructions.length}`)
  for (const call of constructions) {
    assert.match(call, /maxSizeBytes/, `${call} does not raise maxSizeBytes above the 2MB default`)
  }
})

test('a backend failure in GET /api/opportunities returns a non-200 status (regression for CARD-025 silent-empty-inbox finding)', () => {
  const handlerStart = indexSource.indexOf("url.pathname === '/api/opportunities'")
  assert.ok(handlerStart > -1, 'GET /api/opportunities handler not found')
  const catchStart = indexSource.indexOf('} catch (e) {', handlerStart)
  assert.ok(catchStart > -1, 'catch block not found in the /api/opportunities handler')
  const catchBlock = indexSource.slice(catchStart, catchStart + 600)
  assert.match(catchBlock, /status:\s*500/, 'the catch block must not return status: 200 on a real backend failure')
})
