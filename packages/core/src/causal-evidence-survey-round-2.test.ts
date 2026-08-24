import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runCausalContributionBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  getEmbeddedProfile,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

// Structural sanity for round-2 sources: a second real corpus (V2) and a
// pairwise/removal interaction on v3 OOS. No thresholds asserted -- none
// exist yet, per CARD-012's explicit prohibition.
test('Causal evidence round 2: instrument produces consistent results on a second real corpus (V2)', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE]
  )
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)
  const directionSum = Object.values(result.causal.verdictTransitionDirection).reduce((a, b) => a + b, 0)
  assert.equal(directionSum, result.causal.verdictTransitionCount)
})

test('Causal evidence round 2: pairwise interaction (B+SYSTEMS_INFRA vs +FINTECH) is internally consistent', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE]
  )
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)
})

test('Causal evidence round 2: removal-audit shape (removing SYSTEMS_INFRA from a composite) runs cleanly', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE]
  )
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)
})
