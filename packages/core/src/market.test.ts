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
  assert.ok(concepts.includes('RAG & Retrieval'))
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

test('extractMarketRequirements preserves constraint_type (required vs preferred) and scale qualifiers', () => {
  const jd = 'Must have 5+ years experience in Kubernetes for cloud systems. Deep proficiency required. Python preferred.'
  const model = extractMarketRequirements(jd)

  const reqK8s = model.requirements.find(r => r.concept.toLowerCase().includes('kubernetes'))
  assert.ok(reqK8s, 'Should extract Kubernetes requirement')
  assert.ok(reqK8s.qualifiers, 'Kubernetes requirement must carry qualifiers')

  const constraintQual = reqK8s.qualifiers.find(q => q.kind === 'constraint_type')
  assert.ok(constraintQual, 'Must preserve constraint_type qualifier (required vs preferred)')
  assert.equal(constraintQual.value, 'required')

  const reqPython = model.requirements.find(r => r.concept.toLowerCase().includes('python'))
  assert.ok(reqPython, 'Should extract Python requirement')
  assert.ok(reqPython.qualifiers, 'Python requirement must carry qualifiers')
  const prefQual = reqPython.qualifiers.find(q => q.kind === 'constraint_type')
  assert.ok(prefQual, 'Must preserve constraint_type qualifier for Python')
  assert.equal(prefQual.value, 'preferred')
})

