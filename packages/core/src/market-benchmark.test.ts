import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runMarketRequirementBenchmark } from './market-benchmark.js'

test('runMarketRequirementBenchmark computes reproducible triad metrics over frozen corpus', () => {
  const sampleCorpus = [
    'Requirements: 5+ years experience with production Kubernetes at scale. Deep proficiency in Go required.',
    'Looking for a Staff Engineer with distributed systems background. Terraform experience preferred.',
  ]

  const result = runMarketRequirementBenchmark(sampleCorpus)

  assert.equal(result.corpusCount, 2)
  assert.ok(typeof result.recognitionCoverage === 'number' && result.recognitionCoverage >= 0)
  assert.ok(typeof result.falsePositiveRate === 'number' && result.falsePositiveRate >= 0)
  assert.ok(typeof result.qualifierPreservation === 'number' && result.qualifierPreservation >= 0)
  assert.ok(Array.isArray(result.unparsedFragments))
})
