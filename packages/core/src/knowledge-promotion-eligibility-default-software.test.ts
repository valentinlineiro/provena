import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runOutOfSampleValidationBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  DEFAULT_SOFTWARE_KNOWLEDGE,
} from './index.js'

test('Operational Knowledge v1 promotion contract §3: DEFAULT_SOFTWARE_KNOWLEDGE evaluated in isolation on Corpus v3 OOS', () => {
  const profile = getEmbeddedProfile()
  const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)

  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )

  const oos = result.outOfSampleCorpusMetrics

  // Scale (contract §3)
  assert.ok(oos.totalEvaluated >= 50, `Corpus v3 size must be >= 50, got ${oos.totalEvaluated}`)

  // This test intentionally does not assert pass/fail on the remaining §3
  // thresholds: DEFAULT_SOFTWARE_KNOWLEDGE in isolation (never run alone in
  // the frozen H8/Step 10 suites, only composed with Systems/Fintech/
  // Occupational packs) is exactly the unknown this card exists to resolve.
  // The eligibility verdict is recorded in
  // docs/architecture/knowledge-promotion-eligibility-default-software.md.
  const meetsMOR = oos.missedOpportunityRate <= 0.05
  const meetsReduction = oos.attentionReduction >= 0.50
  const meetsPrecision = oos.attentionPrecision >= 0.75

  console.log('DEFAULT_SOFTWARE_KNOWLEDGE isolated OOS metrics:', {
    totalEvaluated: oos.totalEvaluated,
    missedOpportunityRate: oos.missedOpportunityRate,
    attentionReduction: oos.attentionReduction,
    attentionPrecision: oos.attentionPrecision,
    meetsMOR,
    meetsReduction,
    meetsPrecision,
  })

  // The only hard assertion: metrics must be computable and finite, so this
  // test fails loudly (not silently) if the benchmark engine breaks —
  // eligibility itself is a documented verdict, not a CI gate, per the
  // contract's explicit "this card does not promote" scope.
  assert.ok(Number.isFinite(oos.missedOpportunityRate))
  assert.ok(Number.isFinite(oos.attentionReduction))
  assert.ok(Number.isFinite(oos.attentionPrecision))
})
