import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runCausalContributionBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
  MLOPS_KNOWLEDGE,
  DATA_AGENTIC_KNOWLEDGE,
  ADMIN_KNOWLEDGE,
  type MarketKnowledge,
} from './index.js'

const EMPTY_KNOWLEDGE: MarketKnowledge = { name: 'empty-control', version: '0.0.0', patterns: [] }
const B = [DEFAULT_SOFTWARE_KNOWLEDGE]

const CANDIDATES: readonly [string, MarketKnowledge][] = [
  ['SYSTEMS_INFRA_KNOWLEDGE', SYSTEMS_INFRA_KNOWLEDGE],
  ['FINTECH_PLATFORM_KNOWLEDGE', FINTECH_PLATFORM_KNOWLEDGE],
  ['OCCUPATIONAL_CONTEXT_KNOWLEDGE', OCCUPATIONAL_CONTEXT_KNOWLEDGE],
  ['MLOPS_KNOWLEDGE', MLOPS_KNOWLEDGE],
  ['DATA_AGENTIC_KNOWLEDGE', DATA_AGENTIC_KNOWLEDGE],
  ['ADMIN_KNOWLEDGE', ADMIN_KNOWLEDGE],
  ['EMPTY', EMPTY_KNOWLEDGE],
]

// Structural sanity across all 7 comparisons -- not a promotion gate (no
// thresholds exist yet, per CARD-010's explicit prohibition). This is a
// regression check on the instrument itself: it must produce finite,
// internally consistent metrics for every pack, and must NOT repeat the
// CARD-005 bug where EMPTY was indistinguishable from real packs.
test('Causal evidence survey: all 7 comparisons produce structurally sound results', () => {
  const profile = getEmbeddedProfile()

  for (const [label, pack] of CANDIDATES) {
    const result = runCausalContributionBenchmark(
      VERDICT_GROUND_TRUTH_DATASET_OOS,
      profile,
      B,
      [DEFAULT_SOFTWARE_KNOWLEDGE, pack]
    )
    const c = result.causal

    assert.ok(Number.isFinite(c.coverageDelta), `${label}: coverageDelta not finite`)
    assert.ok(Number.isFinite(c.coverageIncrease), `${label}: coverageIncrease not finite`)
    assert.ok(Number.isFinite(c.coverageDecrease), `${label}: coverageDecrease not finite`)
    assert.equal(result.transitions.length, c.verdictTransitionCount, `${label}: transition count mismatch`)

    const directionSum = Object.values(c.verdictTransitionDirection).reduce((a, b) => a + b, 0)
    assert.equal(directionSum, c.verdictTransitionCount, `${label}: direction breakdown doesn't sum to count`)
  }
})

test('Causal evidence survey: EMPTY produces zero causal signal (the CARD-005 regression this instrument must not repeat)', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    B,
    [DEFAULT_SOFTWARE_KNOWLEDGE, EMPTY_KNOWLEDGE]
  )

  assert.equal(result.causal.coverageDelta, 0)
  assert.equal(result.causal.verdictTransitionCount, 0)
  assert.equal(result.causal.coincidentGroundTruthAlignment, 0)
})
