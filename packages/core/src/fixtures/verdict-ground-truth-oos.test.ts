import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET_OOS } from './verdict-ground-truth-oos.js'

test('VERDICT_GROUND_TRUTH_DATASET_OOS contains at least 50 annotated real out-of-sample opportunities', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET_OOS))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET_OOS.length >= 50,
    `Corpus v3 size must be at least 50, got ${VERDICT_GROUND_TRUTH_DATASET_OOS.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET_OOS.filter(i => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET_OOS.filter(i => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 10, 'Corpus v3 must contain at least 10 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 25, 'Corpus v3 must contain at least 25 NOT_WORTH opportunities')
})
