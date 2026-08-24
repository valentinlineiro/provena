import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET } from './verdict-ground-truth.js'

test('VERDICT_GROUND_TRUTH_DATASET contains annotated real opportunities with ground truth labels', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET.length >= 30,
    `Dataset size must be at least 30, got ${VERDICT_GROUND_TRUTH_DATASET.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET.filter((i) => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET.filter((i) => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 5, 'Dataset must contain at least 5 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 15, 'Dataset must contain at least 15 NOT_WORTH opportunities')

  for (const item of VERDICT_GROUND_TRUTH_DATASET) {
    assert.ok(item.id)
    assert.ok(item.jd)
    assert.ok(['WORTH_ATTENTION', 'NOT_WORTH', 'UNRESOLVED'].includes(item.groundTruth))
  }
})
