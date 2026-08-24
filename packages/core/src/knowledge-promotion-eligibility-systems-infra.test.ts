import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runOutOfSampleValidationBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  SYSTEMS_INFRA_KNOWLEDGE,
} from './index.js'

test('Operational Knowledge v1 promotion contract §3: SYSTEMS_INFRA_KNOWLEDGE evaluated in isolation on Corpus v3 OOS', () => {
  const profile = getEmbeddedProfile()
  const recognizer = new DeclarativeMarketRecognizer(SYSTEMS_INFRA_KNOWLEDGE)

  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )

  const oos = result.outOfSampleCorpusMetrics

  // Contract §3 gate — SYSTEMS_INFRA_KNOWLEDGE evaluated in isolation
  // (never run alone in the frozen H8/Step 10 suites, only composed with
  // DEFAULT_SOFTWARE/Fintech/Occupational). Hard gate: a regression below
  // any threshold must fail this test, not just show up in a log.
  assert.ok(oos.totalEvaluated >= 50, `Corpus v3 size must be >= 50, got ${oos.totalEvaluated}`)
  assert.ok(
    oos.missedOpportunityRate <= 0.05,
    `§3 MOR guardrail: expected <= 5%, got ${(oos.missedOpportunityRate * 100).toFixed(1)}%`
  )
  assert.ok(
    oos.attentionReduction >= 0.50,
    `§3 Attention Reduction: expected >= 50%, got ${(oos.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    oos.attentionPrecision >= 0.75,
    `§3 Attention Precision: expected >= 75%, got ${(oos.attentionPrecision * 100).toFixed(1)}%`
  )
})
