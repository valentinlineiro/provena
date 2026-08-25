import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runCausalContributionBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  DATA_AGENTIC_KNOWLEDGE,
} from './index.js'

// CARD-015 §9.2 new-evidence stress test: this exact pairwise combination
// (B+SYSTEMS_INFRA -> +DATA_AGENTIC on OOS) was never run in CARD-010 or
// CARD-012 -- it is genuinely new evidence relative to the 19 points the
// candidate policy (CARD-014) was designed against. Structural sanity
// only, matching the CARD-010/012 test pattern -- no thresholds, since
// the policy itself is ordinal, not numeric (see the validation doc for
// the actual classification and verdict).
test('CARD-015 stress test: B+SYSTEMS_INFRA -> +DATA_AGENTIC (OOS) is new evidence and runs cleanly', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE],
    [DEFAULT_SOFTWARE_KNOWLEDGE, SYSTEMS_INFRA_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE]
  )
  assert.ok(Number.isFinite(result.causal.coverageDelta))
  assert.equal(result.transitions.length, result.causal.verdictTransitionCount)
  const directionSum = Object.values(result.causal.verdictTransitionDirection).reduce((a, b) => a + b, 0)
  assert.equal(directionSum, result.causal.verdictTransitionCount)
})
