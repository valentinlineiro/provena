import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runOutOfSampleValidationBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  ADMIN_KNOWLEDGE,
  type MarketKnowledge,
} from './index.js'

const EMPTY_KNOWLEDGE: MarketKnowledge = { name: 'empty-control', version: '0.0.0', patterns: [] }

// This test does not assert a §3 promotion gate (there is nothing to promote
// here). It is a discriminability probe: does the isolated-OOS-evaluation
// methodology used by CARD-002/CARD-004 actually respond to *which* knowledge
// pack is used? The hard assertions below pin the exact empirical result
// found on 2026-08-24 so a future change to the benchmark/corpus/engine that
// silently alters this is caught, rather than pinning what we'd *want* to be
// true.
test('Benchmark Discriminability Check: ADMIN_KNOWLEDGE (unrelated domain) in isolation on Corpus v3 OOS', () => {
  const profile = getEmbeddedProfile()
  const recognizer = new DeclarativeMarketRecognizer(ADMIN_KNOWLEDGE)
  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )
  const oos = result.outOfSampleCorpusMetrics

  assert.equal(oos.totalEvaluated, 52)
  assert.equal(oos.missedOpportunityRate, 0)
  assert.equal(oos.attentionReduction, 0.69)
  assert.equal(oos.attentionPrecision, 1)
  assert.deepEqual(oos.matrix, { tp: 16, fp: 0, tn: 36, fn: 0, abstain: 0 })
})

test('Benchmark Discriminability Check: EMPTY pack (patterns: []) as negative control on Corpus v3 OOS', () => {
  const profile = getEmbeddedProfile()
  const recognizer = new DeclarativeMarketRecognizer(EMPTY_KNOWLEDGE)
  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )
  const oos = result.outOfSampleCorpusMetrics

  // Same exact result as every isolated pack evaluated so far (CARD-002,
  // CARD-004, and ADMIN_KNOWLEDGE above) despite having zero patterns.
  // This is the finding this card exists to surface: the benchmark does
  // not discriminate on the knowledge pack at all.
  assert.equal(oos.totalEvaluated, 52)
  assert.equal(oos.missedOpportunityRate, 0)
  assert.equal(oos.attentionReduction, 0.69)
  assert.equal(oos.attentionPrecision, 1)
  assert.deepEqual(oos.matrix, { tp: 16, fp: 0, tn: 36, fn: 0, abstain: 0 })
})
