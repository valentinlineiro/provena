import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET } from './verdict-ground-truth.js'

test('VERDICT_GROUND_TRUTH_DATASET contains annotated real opportunities with ground truth labels', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET))
  assert.ok(VERDICT_GROUND_TRUTH_DATASET.length >= 5)

  for (const item of VERDICT_GROUND_TRUTH_DATASET) {
    assert.ok(item.id)
    assert.ok(item.jd)
    assert.ok(['WORTH_ATTENTION', 'NOT_WORTH', 'UNRESOLVED'].includes(item.groundTruth))
  }
})
