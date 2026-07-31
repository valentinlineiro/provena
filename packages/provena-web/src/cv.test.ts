import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector } from '@provena/core'
import profile from './profile.js'

test('cvProjector on the embedded profile: explicit summary wins unless generateSummary', () => {
  const { model, metadata } = cvProjector(profile, { targetRole: 'Staff Software Engineer' })
  assert.equal(metadata.generatedSummary, false)
  assert.match(model.summary, /^Staff Software Engineer focused on software architecture/)
  const generated = cvProjector(profile, { targetRole: 'Staff Software Engineer', generateSummary: true })
  assert.match(generated.model.summary, /Staff Software Engineer with proven strengths/)
  assert.equal(generated.metadata.generatedSummary, true)
})

test('cvProjector on the embedded profile with recruiter audience omits projects', () => {
  const { model } = cvProjector(profile, { audience: 'recruiter' })
  assert.equal(model.projects.length, 0)
})

test('cvProjector on the embedded profile without context matches resumeProjector', async () => {
  const { resumeProjector } = await import('@provena/core')
  assert.deepEqual(cvProjector(profile).model, resumeProjector.project(profile))
})
