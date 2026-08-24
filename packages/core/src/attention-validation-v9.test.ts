import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runAttentionValidationAtScale,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
} from './index.js'

test('Step 9 Contextual Disambiguation: recovers Attention Reduction >60% and Precision >80% while preserving MOR = 0% guardrail', () => {
  const profile = getEmbeddedProfile()
  const knowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE,
    OCCUPATIONAL_CONTEXT_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(knowledge)

  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET_V2, profile, recognizer)

  // STRICT SAFETY GUARDRAIL
  assert.equal(
    metrics.matrix.fn,
    0,
    `STRICT MOR GUARDRAIL VIOLATED: Found ${metrics.matrix.fn} false skips on worth-attention roles`
  )

  // Recovery Targets
  assert.ok(
    metrics.attentionReduction >= 0.60,
    `Attention Reduction target >= 60%, got ${(metrics.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    metrics.attentionPrecision >= 0.80,
    `Attention Precision target >= 80%, got ${(metrics.attentionPrecision * 100).toFixed(1)}%`
  )
})
