import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { OpportunityEvaluation } from '@provena/core'
import worker from './index.js'

const env = {} as never

test('Evaluate page renders the nav, title and paste box', async () => {
  const res = await worker.fetch(new Request('https://provena.example/evaluate'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<div class="split-view" style="--split-threshold: 54rem;">'))
  assert.ok(html.includes('<div class="action-bar">'))
  assert.ok(html.includes('<a class="active" href="/evaluate">Evaluate</a>'))
  assert.ok(html.includes('<h1>Evaluate an opportunity</h1>'))
  assert.ok(html.includes('<textarea id="jd"'))
  assert.ok(html.includes('onclick="evaluateJD()"'))
})

test('POST /api/evaluate returns a traceable evaluation', async () => {
  const jd = 'Staff Software Engineer. Own architectural decisions for backend systems. Fully remote. €100,000 - €120,000.'
  const res = await worker.fetch(new Request('https://provena.example/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd }),
  }), env)
  assert.equal(res.status, 200)
  const ev = (await res.json()) as OpportunityEvaluation
  assert.ok(['apply', 'consider', 'skip'].includes(ev.verdict))
  assert.ok(Array.isArray(ev.criteria))
  assert.ok(ev.demonstrated.some(m => m.capabilityName === 'Software Architecture'))
})

test('embedded profile carries capability signals for evaluation', async () => {
  const profile = (await import('./profile.js')).default
  assert.ok(profile.capabilities.some(c => (c.signals ?? []).length > 0))
})

test('Prepare page reads role/emphasize query params for the evaluate handoff', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('new URLSearchParams(location.search)'))
  assert.ok(html.includes("params.get('role')"))
  assert.ok(html.includes("params.get('emphasize')"))
  assert.ok(html.includes('prefillEmphasize.includes'))
})
