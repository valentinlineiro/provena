import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runGeneralizationBenchmarkV2 } from './attention-validation-v2.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './fixtures/verdict-ground-truth-v2.js'
import { getEmbeddedProfile } from './profile.js'

test('runGeneralizationBenchmarkV2 compares Corpus v1 vs Corpus v2 and audits border-case failures', () => {
  const profile = getEmbeddedProfile()
  const result = runGeneralizationBenchmarkV2(
    VERDICT_GROUND_TRUTH_DATASET,
    VERDICT_GROUND_TRUTH_DATASET_V2,
    profile
  )

  assert.ok(result.v1CorpusMetrics.totalEvaluated >= 30)
  assert.ok(result.v2CorpusMetrics.totalEvaluated >= 50)
  assert.ok(typeof result.delta.attentionReductionDelta === 'number')
  assert.ok(Array.isArray(result.borderCaseFailures))
})
