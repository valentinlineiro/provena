import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runVerdictQualityBenchmark } from './verdict-benchmark.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'
import {
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('Causal A/B Verdict Quality Experiment: Market Recognition v1 maintains decision precision and zero missed opportunity rate', () => {
  const profile = getEmbeddedProfile()

  // 1. Baseline Evaluation
  const baselineRecognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const baselineMetrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile, baselineRecognizer)

  // 2. Expanded Evaluation (Market Recognition v1)
  const expandedKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const expandedRecognizer = new DeclarativeMarketRecognizer(expandedKnowledge)
  const expandedMetrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile, expandedRecognizer)

  // 3. Assert Causal Improvements & Invariants
  assert.ok(
    expandedMetrics.precision >= baselineMetrics.precision,
    `Precision must increase or stay equal: ${expandedMetrics.precision} >= ${baselineMetrics.precision}`
  )
  assert.ok(
    expandedMetrics.missedOpportunityRate <= baselineMetrics.missedOpportunityRate,
    `Missed Opportunity Rate must decrease or stay equal: ${expandedMetrics.missedOpportunityRate} <= ${baselineMetrics.missedOpportunityRate}`
  )
  assert.equal(
    expandedMetrics.counts.fn,
    0,
    'Provena must have 0 false negatives on ground-truth worth attention opportunities'
  )
})
