import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runOutOfSampleValidationBenchmark } from './attention-validation-oos.js'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './fixtures/verdict-ground-truth-v2.js'
import { VERDICT_GROUND_TRUTH_DATASET_OOS } from './fixtures/verdict-ground-truth-oos.js'
import { getEmbeddedProfile } from './profile.js'

test('runOutOfSampleValidationBenchmark evaluates in-sample vs out-of-sample performance and audits failures', () => {
  const profile = getEmbeddedProfile()
  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile
  )

  assert.ok(result.inSampleCorpusMetrics.totalEvaluated >= 50)
  assert.ok(result.outOfSampleCorpusMetrics.totalEvaluated >= 50)
  assert.ok(typeof result.transportability.reductionRetention === 'number')
  assert.ok(Array.isArray(result.oosFailures))
})
