import test from 'node:test'
import assert from 'node:assert/strict'
import { extractMarketRequirements } from './market.js'

test('extractMarketRequirements is purely deterministic and depends only on JD text', () => {
  const jd = `
We are seeking a Staff Engineer with strong Python and Kubernetes experience.
Must have deep experience with LLM, RAG and distributed systems in AWS.
Fully remote position.
  `.trim()

  const m1 = extractMarketRequirements(jd)
  const m2 = extractMarketRequirements(jd)

  assert.deepStrictEqual(m1, m2)
  assert.ok(m1.requirements.length >= 4)
  const concepts = m1.requirements.map(r => r.concept)
  assert.ok(concepts.includes('Python'))
  assert.ok(concepts.includes('Kubernetes'))
  assert.ok(concepts.includes('LLM & GenAI Systems'))
  assert.ok(concepts.includes('Distributed Systems'))
  assert.ok(concepts.includes('Remote Work'))
})

test('extractMarketRequirements preserves rawText provenance', () => {
  const jd = 'Must know k8s and python in production.'
  const m = extractMarketRequirements(jd)
  const k8sReq = m.requirements.find(r => r.concept === 'Kubernetes')
  assert.ok(k8sReq)
  assert.equal(k8sReq.rawText, 'k8s')
})
