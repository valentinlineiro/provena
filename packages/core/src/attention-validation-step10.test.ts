import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runOutOfSampleValidationBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
} from './index.js'

test('Step 10 Out-of-Sample Validation: frozen Decision Engine evaluates generalizability on unseen Corpus v3 data', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE,
    OCCUPATIONAL_CONTEXT_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )

  const oos = result.outOfSampleCorpusMetrics

  // Scale Check
  assert.ok(oos.totalEvaluated >= 50, `Corpus v3 size must be >= 50, got ${oos.totalEvaluated}`)

  // STRICT SAFETY GUARDRAIL: MOR <= 5% (0% preferred)
  assert.ok(
    oos.missedOpportunityRate <= 0.05,
    `STRICT MOR GUARDRAIL VIOLATED on OOS: got ${(oos.missedOpportunityRate * 100).toFixed(1)}%`
  )

  // Transportability Targets
  assert.ok(
    oos.attentionReduction >= 0.50,
    `OOS Attention Reduction target >= 50%, got ${(oos.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    oos.attentionPrecision >= 0.75,
    `OOS Attention Precision target >= 75%, got ${(oos.attentionPrecision * 100).toFixed(1)}%`
  )
})
