import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector } from '@provena/core'
import profile from './profile.js'

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