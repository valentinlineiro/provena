import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runCausalContributionBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
} from './index.js'

test('Causal-contribution benchmark: Composite vs Composite+X (SYSTEMS_INFRA_KNOWLEDGE added) on Corpus v3 OOS', () => {
  const profile = getEmbeddedProfile()

  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE]
  )

  assert.equal(result.baselineResults.length, 52)
  assert.equal(result.candidateResults.length, 52)

  // Causal metrics must be real numbers, not NaN/undefined -- the engine
  // must actually complete the per-item diff over the full corpus.
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.ok(Number.isFinite(result.causal.verdictTransitionCount))
  assert.ok(Number.isFinite(result.causal.coincidentGroundTruthAlignment))
  assert.ok(typeof result.causal.verdictTransitionDirection === 'object')

  // transitions[] and verdictTransitionCount must agree -- internal
  // consistency of the diff, not a promotion-threshold assertion (CARD-009
  // explicitly leaves thresholds uncalibrated).
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)

  // Every transition's direction key must be accounted for in the
  // direction breakdown, and the breakdown must sum to the total count.
  const directionSum = Object.values(result.causal.verdictTransitionDirection).reduce((a, b) => a + b, 0)
  assert.equal(directionSum, result.causal.verdictTransitionCount)

  // Guardrails (MOR/reduction/precision) are still computed on both
  // composites -- present, finite, but explicitly not asserted as a
  // promotion gate here (that stays TBD per CARD-008's design).
  assert.equal(result.guardrails.baseline.totalEvaluated, 52)
  assert.equal(result.guardrails.candidate.totalEvaluated, 52)
  assert.ok(Number.isFinite(result.guardrails.baseline.missedOpportunityRate))
  assert.ok(Number.isFinite(result.guardrails.candidate.missedOpportunityRate))
})

test('Causal-contribution benchmark: Composite-X vs Composite (re-audit shape) is the mirror of the add shape', () => {
  const profile = getEmbeddedProfile()

  // Re-auditing an already-promoted pack: baseline is the full composite
  // (including X), candidate is that composite with X removed. Same
  // function, arguments swapped relative to the add-shape test above.
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE]
  )

  assert.equal(result.baselineResults.length, 52)
  assert.equal(result.candidateResults.length, 52)
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)
})
