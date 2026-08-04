import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { HtmlCvRenderer } from './html-cv.js'

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
    preferences: { interests: ['Software Architecture'] },
  }
}

test('HTML renderer produces valid document structure', () => {
  const profile = makeProfile()
  const cv = cvProjector(profile, { targetRole: 'Engineer' })
  const renderer = new HtmlCvRenderer()
  const html = renderer.render(cv)

  assert.match(html, /<!DOCTYPE html>/)
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<title>Alex Chen<\/title>/)
  assert.match(html, /<h1>Alex Chen<\/h1>/)
  assert.match(html, /<h2>Experience<\/h2>/)
  assert.match(html, /<h3>Acme Corp<\/h3>/)
  assert.match(html, /<section>/)
  assert.match(html, /<article class="cv-document">/)
  assert.match(html, /<time>/)
  assert.match(html, /<\/html>/)
  assert.match(html, /<meta name="viewport" content="width=device-width, initial-scale=1">/)
  assert.match(html, /<style>[\s\S]*\.cv-document[\s\S]*<\/style>/)
})

test('HTML renderer escapes special characters', () => {
  const profile = makeProfile()
  const profile2: Profile = { ...profile, identity: { ...profile.identity, person: { ...profile.identity.person, name: 'Alex & <Co>' } } }
  const cv = cvProjector(profile2, { targetRole: 'Engineer' })
  const renderer = new HtmlCvRenderer()
  const html = renderer.render(cv)

  assert.match(html, /Alex &amp; &lt;Co&gt;/)
  assert.doesNotMatch(html, /<Co>/)
})

test('HTML renderer renders expertise and technologies sections, not a snapshot or skills block', () => {
  const profile = makeProfile()
  const cv = cvProjector(profile, { targetRole: 'Staff Software Engineer' })
  const html = new HtmlCvRenderer().render(cv)
  assert.match(html, /Core expertise/)
  assert.match(html, /Primary technologies/)
  assert.match(html, /Staff Software Engineer/)
  assert.doesNotMatch(html, /Career Snapshot/)
  assert.doesNotMatch(html, /<h2>Skills<\/h2>/)
  assert.doesNotMatch(html, /pieces of evidence/)
})

test('HtmlCvRenderer provides renderDocument and renderStyles methods', () => {
  const profile = makeProfile()
  const cv = cvProjector(profile, { targetRole: 'Engineer' })
  const renderer = new HtmlCvRenderer()
  const docHtml = renderer.renderDocument(cv)
  const css = renderer.renderStyles()

  assert.ok(docHtml.startsWith('<article class="cv-document">'))
  assert.ok(docHtml.includes('</article>'))
  assert.ok(!docHtml.includes('<!DOCTYPE html>'))

  assert.ok(css.includes('.cv-document {'))
  assert.ok(css.includes('.cv-document h1 {'))
  assert.ok(css.includes('210mm'))
})