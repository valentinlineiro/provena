import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runAttentionValidationAtScale,
  VERDICT_GROUND_TRUTH_DATASET,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('Scaled Attention Validation Product Hypothesis: Provena achieves high Attention Reduction with 0% Missed Opportunity Rate', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET, profile, recognizer)

  // Verify dataset scale
  assert.ok(
    metrics.totalEvaluated >= 30,
    `Must evaluate at least 30 ground-truth opportunities, got ${metrics.totalEvaluated}`
  )

  // Verify Attention Reduction hypothesis (silencing 60%+ of total market noise)
  assert.ok(
    metrics.attentionReduction >= 0.6,
    `Attention Reduction must be >= 60%, got ${(metrics.attentionReduction * 100).toFixed(1)}%`
  )

  // Verify Missed Opportunity Rate invariant (0 false skips on worth-attention roles)
  assert.equal(
    metrics.matrix.fn,
    0,
    `Strict invariant broken: found ${metrics.matrix.fn} false skips on worth-attention roles!`
  )
})
