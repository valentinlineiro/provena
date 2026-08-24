import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runVerdictQualityBenchmark } from './verdict-benchmark.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'

test('runVerdictQualityBenchmark calculates precision, recall, missed opportunity rate and confusion matrix', () => {
  const profile = getEmbeddedProfile()
  const metrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile)

  assert.ok(typeof metrics.precision === 'number')
  assert.ok(typeof metrics.recall === 'number')
  assert.ok(typeof metrics.missedOpportunityRate === 'number')
  assert.ok(typeof metrics.abstentionRate === 'number')
  assert.ok(metrics.counts.tp >= 0)
  assert.ok(metrics.counts.fp >= 0)
  assert.ok(metrics.counts.tn >= 0)
  assert.ok(metrics.counts.fn >= 0)
})
