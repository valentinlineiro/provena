import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { HtmlResumeRenderer } from './html-resume-renderer.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Alex Chen', title: 'Engineer', summary: 'Test.', urls: {} },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{
      id: 'exp-1',
      organization: 'Acme Corp',
      title: 'Engineer',
      start: '2023-01',
      end: '2024-06',
      achievements: ['Shipped it'],
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Testing', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Did a thing' }],
  }
}

test('HTML renderer produces valid document structure', () => {
  const profile = makeProfile()
  const model = resumeProjector.project(profile)
  const renderer = new HtmlResumeRenderer()
  const html = renderer.render(model)

  assert.match(html, /<!DOCTYPE html>/)
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<title>Alex Chen<\/title>/)
  assert.match(html, /<h1>Alex Chen<\/h1>/)
  assert.match(html, /<h2>Experience<\/h2>/)
  assert.match(html, /<h3>Acme Corp<\/h3>/)
  assert.match(html, /<section>/)
  assert.match(html, /<article>/)
  assert.match(html, /<time>/)
  assert.match(html, /<\/html>/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/)
  assert.match(html, /<style>[\s\S]*body\s*\{[\s\S]*<\/style>/)
})

test('HTML renderer escapes special characters', () => {
  const profile = makeProfile()
  const profile2: Profile = { ...profile, identity: { ...profile.identity, person: { ...profile.identity.person, name: 'Alex & <Co>' } } }
  const model = resumeProjector.project(profile2)
  const renderer = new HtmlResumeRenderer()
  const html = renderer.render(model)

  assert.match(html, /Alex &amp; &lt;Co&gt;/)
  assert.doesNotMatch(html, /<Co>/)
})