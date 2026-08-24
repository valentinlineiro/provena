import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './verdict-ground-truth-v2.js'

test('VERDICT_GROUND_TRUTH_DATASET_V2 contains at least 50 annotated real opportunities with border-case categories', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET_V2))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET_V2.length >= 50,
    `Corpus v2 size must be at least 50, got ${VERDICT_GROUND_TRUTH_DATASET_V2.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET_V2.filter(i => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET_V2.filter(i => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 10, 'Corpus v2 must contain at least 10 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 25, 'Corpus v2 must contain at least 25 NOT_WORTH opportunities')
})
