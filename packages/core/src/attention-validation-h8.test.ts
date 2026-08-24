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

test('H8 Generalization Falsification Benchmark: measures frozen Decision Engine baseline gap under Corpus v2 border-case stress', () => {
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

  // Verify scale (55 items)
  assert.ok(v2.totalEvaluated >= 50, `Corpus v2 must contain >= 50 items, got ${v2.totalEvaluated}`)

  // Baseline gap assertion under Corpus v2 border-case stress
  assert.equal(v2.attentionReduction, 0.18, `Expected 18.0% attention reduction baseline gap, got ${v2.attentionReduction}`)

  // Border-case failures audit
  assert.ok(
    result.borderCaseFailures.length > 0,
    `Expected border-case failure items to be captured, got ${result.borderCaseFailures.length}`
  )
})
