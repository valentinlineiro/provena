import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector } from '@provena/core'
import profile from './profile.js'
import worker from './index.js'

const env = {} as never

test('cvProjector on the embedded profile: explicit summary wins unless generateSummary', () => {
  const cv = cvProjector(profile, { targetRole: 'Staff Software Engineer' })
  assert.equal(cv.summary, profile.identity.person.summary)
  const generated = cvProjector(profile, { targetRole: 'Staff Software Engineer', generateSummary: true })
  assert.match(generated.summary, /Staff Software Engineer with proven strengths/)
})

test('cvProjector on the embedded profile with recruiter audience omits projects', () => {
  const cv = cvProjector(profile, { audience: 'recruiter' })
  assert.equal(cv.projects.length, 0)
})

test('embedded profile CV surfaces realistic expertise and technologies', () => {
  const cv = cvProjector(profile, { targetRole: 'Staff Software Engineer' })
  assert.equal(cv.headline, 'Staff Software Engineer')
  assert.ok(cv.expertise.includes('Software Architecture'))
  assert.ok(cv.expertise.includes('AI-Assisted Engineering'))
  assert.ok(cv.technologies.includes('Java'))
  assert.ok(!cv.technologies.some(t => cv.expertise.includes(t)))
  assert.ok(cv.experiences.length > 0)
})

test('GET /cv renders within app-shell with bottom-sheet overlay and customization functions', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'), 'GET /cv must render within app-shell')
  assert.ok(html.includes('class="bottom-sheet"'), 'GET /cv must include .bottom-sheet')
  assert.ok(html.includes('class="bottom-sheet-overlay"'), 'GET /cv must include .bottom-sheet-overlay')
  assert.ok(html.includes('openCustomize'), 'GET /cv must provide openCustomize()')
  assert.ok(html.includes('closeCustomize'), 'GET /cv must provide closeCustomize()')
})