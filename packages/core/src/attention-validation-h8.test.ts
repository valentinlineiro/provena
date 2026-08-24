import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runGeneralizationBenchmarkV2,
  VERDICT_GROUND_TRUTH_DATASET,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('H8 Hypothesis Verification: frozen Decision Engine maintains >60% Attention Reduction and low MOR under Corpus v2 border-case stress', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const result = runGeneralizationBenchmarkV2(
    VERDICT_GROUND_TRUTH_DATASET,
    VERDICT_GROUND_TRUTH_DATASET_V2,
    profile,
    recognizer
  )

  const v2 = result.v2CorpusMetrics

  // Verify scale
  assert.ok(v2.totalEvaluated >= 50, `Corpus v2 must contain >= 50 items, got ${v2.totalEvaluated}`)

  // H8 Hypothesis Core Metrics Check
  assert.ok(
    v2.attentionReduction >= 0.60,
    `H8 Attention Reduction target >= 60%, got ${(v2.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    v2.attentionPrecision >= 0.80,
    `H8 Attention Precision target >= 80%, got ${(v2.attentionPrecision * 100).toFixed(1)}%`
  )
  assert.ok(
    v2.missedOpportunityRate <= 0.05,
    `H8 MOR target <= 5%, got ${(v2.missedOpportunityRate * 100).toFixed(1)}%`
  )
})
