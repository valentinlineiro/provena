import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runAttentionValidationAtScale } from './attention-validation.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'

test('runAttentionValidationAtScale computes attention reduction, precision, MOR and abstention precision', () => {
  const profile = getEmbeddedProfile()
  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET, profile)

  assert.equal(metrics.totalEvaluated, VERDICT_GROUND_TRUTH_DATASET.length)
  assert.ok(typeof metrics.attentionReduction === 'number' && metrics.attentionReduction >= 0)
  assert.ok(typeof metrics.attentionPrecision === 'number' && metrics.attentionPrecision >= 0)
  assert.ok(typeof metrics.missedOpportunityRate === 'number' && metrics.missedOpportunityRate >= 0)
  assert.ok(typeof metrics.abstentionPrecision === 'number' && metrics.abstentionPrecision >= 0)
  assert.ok(metrics.matrix !== undefined)
})
