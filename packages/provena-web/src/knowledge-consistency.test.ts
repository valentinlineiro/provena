import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  composeKnowledge,
  PROMOTED_OPERATIONAL_KNOWLEDGE,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from '@provena/core'

// CARD-023: validates the governance-to-runtime invariant from CARD-021 --
// "runtime composition == promoted set" -- across the 6 production
// knowledge-consumption points CARD-022 wired (both /api/opportunities/ingest
// branches, /api/evaluate-url, /api/evaluate, /api/market/sync, and the Cron
// scheduled handler). The Worker's fetch/scheduled handlers require Env
// (KV/Postgres) to invoke directly, so this validates at the source level --
// every DeclarativeMarketRecognizer construction site must route through
// composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE), with no non-promoted
// pack literal reachable anywhere in the file -- plus a genuine runtime check
// that the composition itself produces exactly the promoted patterns.

const __dirname = dirname(fileURLToPath(import.meta.url))
const indexSource = readFileSync(join(__dirname, 'index.ts'), 'utf-8')

test('every DeclarativeMarketRecognizer construction routes through composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)', () => {
  const recognizerCount = (indexSource.match(/new DeclarativeMarketRecognizer\(/g) ?? []).length
  const promotedComposeCount = (indexSource.match(/composeKnowledge\(\.\.\.PROMOTED_OPERATIONAL_KNOWLEDGE\)/g) ?? []).length
  assert.ok(recognizerCount >= 6, `expected at least the 6 known production call sites, found ${recognizerCount}`)
  assert.equal(
    recognizerCount,
    promotedComposeCount,
    `${recognizerCount} DeclarativeMarketRecognizer construction(s) but only ${promotedComposeCount} composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE) call(s) -- a call site is bypassing the promoted set (this is exactly the CARD-022 /api/market/sync/scheduled-handler regression: a direct DeclarativeMarketRecognizer(SOME_PACK) call not routed through the promoted-set constant)`
  )
})

test('no VETOED or INCONCLUSIVE pack (CARD-018) is reachable anywhere in the production file', () => {
  const forbidden = [
    'SYSTEMS_INFRA_KNOWLEDGE', // VETOED
    'OCCUPATIONAL_CONTEXT_KNOWLEDGE', // INCONCLUSIVE
    'MLOPS_KNOWLEDGE', // INCONCLUSIVE
    'DATA_AGENTIC_KNOWLEDGE', // INCONCLUSIVE
    'ADMIN_KNOWLEDGE', // INCONCLUSIVE
  ]
  for (const name of forbidden) {
    assert.ok(!indexSource.includes(name), `${name} must not be reachable in packages/provena-web/src/index.ts -- it is not promoted`)
  }
})

test('no bare, unpromoted-set knowledge literal is reachable -- only PROMOTED_OPERATIONAL_KNOWLEDGE reaches DeclarativeMarketRecognizer', () => {
  // DEFAULT_SOFTWARE_KNOWLEDGE and FINTECH_PLATFORM_KNOWLEDGE ARE promoted,
  // but the only legitimate route to production knowledge is via
  // PROMOTED_OPERATIONAL_KNOWLEDGE -- importing them directly here would
  // reopen the same class of gap CARD-022 closed (a call site that happens
  // to be correct today but drifts silently the next time the promoted set
  // changes, since it isn't reading from the single source of truth).
  assert.ok(!indexSource.includes('DEFAULT_SOFTWARE_KNOWLEDGE'), 'DEFAULT_SOFTWARE_KNOWLEDGE must not be imported/used directly -- go through PROMOTED_OPERATIONAL_KNOWLEDGE')
  assert.ok(!indexSource.includes('FINTECH_PLATFORM_KNOWLEDGE'), 'FINTECH_PLATFORM_KNOWLEDGE must not be imported/used directly -- go through PROMOTED_OPERATIONAL_KNOWLEDGE')
})

test('no knowledgeMode override mechanism exists in the operational path (regression for CARD-022 removal)', () => {
  // Tests the override *mechanism* specifically -- a request field read to
  // select knowledge, or a UI control that sets one -- not the bare word.
  // A fixed literal label on a persisted record (see CARD-023's validation
  // doc for the one that remains, `knowledgeMode: 'composed'`) does not
  // select what knowledge gets composed, so it does not violate the
  // "runtime composition == promoted set" invariant this test guards.
  const overridePatterns = [
    /body\.knowledgeMode/,
    /getElementById\('knowledgeMode'\)/,
    /:\s*\{\s*[^}]*knowledgeMode\?:\s*string/, // a request-body type accepting it as input
  ]
  for (const pattern of overridePatterns) {
    assert.ok(!pattern.test(indexSource), `found a knowledgeMode override mechanism matching ${pattern} -- an override capable of diverging from the promoted set must not reappear`)
  }
})

test('composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE) produces exactly the promoted patterns, no more, no less', () => {
  const composed = composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)
  const expectedConcepts = new Set([
    ...DEFAULT_SOFTWARE_KNOWLEDGE.patterns.map(p => p.concept),
    ...FINTECH_PLATFORM_KNOWLEDGE.patterns.map(p => p.concept),
  ])
  const actualConcepts = new Set(composed.patterns.map(p => p.concept))
  assert.deepEqual(actualConcepts, expectedConcepts)
  assert.equal(PROMOTED_OPERATIONAL_KNOWLEDGE.length, 2, 'this test assumes exactly 2 promoted packs -- update it if a future promotion changes the count')
})
