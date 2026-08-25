import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

// CARD-027: structural regression guards. sync-market.ts requires a real
// DATABASE_URL and network access to run end-to-end (verified manually
// against production during CARD-027 -- see docs/architecture), so this
// checks wiring at the source level rather than executing it in CI.

const scriptSource = readFileSync(join(import.meta.dirname, 'sync-market.ts'), 'utf-8')

test('sync-market.ts wires the promoted knowledge set, not a bare pack', () => {
  assert.match(scriptSource, /composeKnowledge\(\.\.\.PROMOTED_OPERATIONAL_KNOWLEDGE\)/)
})

test('sync-market.ts raises maxSizeBytes above the 2MB default (regression for the CARD-026 size-limit failure)', () => {
  assert.match(scriptSource, /new GreenhousePublicSource\([^)]*maxSizeBytes/)
})

test('sync-market.ts exits non-zero on failure so GitHub Actions surfaces it', () => {
  assert.match(scriptSource, /process\.exit\(1\)/)
})

test('the GitHub Actions workflow exists and runs sync-market.ts on the same 6-hour cadence the Worker Cron used', () => {
  const workflowPath = join(import.meta.dirname, '../../../.github/workflows/market-sync.yml')
  assert.ok(existsSync(workflowPath), 'market-sync.yml workflow not found')
  const workflow = readFileSync(workflowPath, 'utf-8')
  assert.match(workflow, /0 \*\/6 \* \* \*/, 'cron schedule must match the removed Worker trigger')
  assert.match(workflow, /sync-market\.ts/)
  assert.match(workflow, /secrets\.DATABASE_URL/)
})

test('wrangler.jsonc no longer declares a cron trigger (regression for CARD-027 duplicate scheduling)', () => {
  const wranglerPath = join(import.meta.dirname, '../../provena-web/wrangler.jsonc')
  const wrangler = readFileSync(wranglerPath, 'utf-8')
  assert.ok(!/"crons"/.test(wrangler), 'wrangler.jsonc must not declare a crons trigger -- GitHub Actions owns scheduling now')
})
