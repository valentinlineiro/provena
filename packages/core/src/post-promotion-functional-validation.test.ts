import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runCausalContributionBenchmark } from './causal-contribution-benchmark.js'
import { VERDICT_GROUND_TRUTH_DATASET_OOS } from './fixtures/verdict-ground-truth-oos.js'
import { getEmbeddedProfile } from './profile.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'
import { PROMOTED_OPERATIONAL_KNOWLEDGE } from './promoted-knowledge.js'
import { DeclarativeMarketRecognizer, composeKnowledge, type MarketKnowledge } from './market-knowledge.js'

// CARD-024: PRE is DEFAULT_SOFTWARE_KNOWLEDGE alone -- this is the exact
// composition the prior functional baseline (attention-validation-oos.test.ts)
// used, since evaluateOpportunity falls back to it when no recognizer is
// passed. POST is PROMOTED_OPERATIONAL_KNOWLEDGE (DEFAULT_SOFTWARE_KNOWLEDGE +
// FINTECH_PLATFORM_KNOWLEDGE), isolating exactly the FINTECH delta on the
// same 52-item OOS corpus ("Corpus v3") used to establish that baseline.

function qualifierDensity(packs: readonly MarketKnowledge[]): number {
  const recognizer = new DeclarativeMarketRecognizer(composeKnowledge(...packs))
  let total = 0
  let withQualifier = 0
  for (const item of VERDICT_GROUND_TRUTH_DATASET_OOS) {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    for (const req of recognizer.extractMarketRequirements(fullJd).requirements) {
      total++
      if (req.qualifiers && req.qualifiers.length > 0) withQualifier++
    }
  }
  return total > 0 ? withQualifier / total : 0
}

test('post-promotion functional validation: PROMOTED_OPERATIONAL_KNOWLEDGE vs pre-CARD-022 baseline on the OOS corpus', () => {
  const profile = getEmbeddedProfile()
  const result = runCausalContributionBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    [DEFAULT_SOFTWARE_KNOWLEDGE],
    [...PROMOTED_OPERATIONAL_KNOWLEDGE]
  )

  // No regression in any guardrail metric -- FP, FN, attention reduction/precision
  // are identical between PRE and POST.
  assert.equal(result.guardrails.candidate.matrix.fp, result.guardrails.baseline.matrix.fp)
  assert.equal(result.guardrails.candidate.matrix.fn, result.guardrails.baseline.matrix.fn)
  assert.equal(result.guardrails.candidate.attentionReduction, result.guardrails.baseline.attentionReduction)
  assert.equal(result.guardrails.candidate.attentionPrecision, result.guardrails.baseline.attentionPrecision)
  assert.equal(result.guardrails.candidate.missedOpportunityRate, result.guardrails.baseline.missedOpportunityRate)

  // Exactly one verdict transition, localized to the one item whose JD
  // matches a FINTECH_PLATFORM_KNOWLEDGE concept ("double-entry ledger
  // architecture" -> Financial Ledgers & Double-Entry Accounting), and it
  // moves toward the item's own ground truth rather than away from it.
  assert.equal(result.transitions.length, 1)
  assert.equal(result.transitions[0]?.itemId, 'oos-10')
  assert.equal(result.transitions[0]?.alignedWithGroundTruth, true)
  assert.equal(result.causal.coincidentGroundTruthAlignment, 1)

  // Qualifier density (proxy: fraction of extracted requirements carrying a
  // qualifier) does not collapse -- the small dilution from one additional
  // matched requirement at oos-10 is consistent with the single expected
  // FINTECH-attributable change, not a broad extraction regression.
  const preDensity = qualifierDensity([DEFAULT_SOFTWARE_KNOWLEDGE])
  const postDensity = qualifierDensity(PROMOTED_OPERATIONAL_KNOWLEDGE)
  assert.ok(postDensity > 0.5, `qualifier density collapsed post-promotion: ${postDensity}`)
  assert.ok(Math.abs(postDensity - preDensity) < 0.1, `qualifier density moved more than expected: pre=${preDensity} post=${postDensity}`)
})
