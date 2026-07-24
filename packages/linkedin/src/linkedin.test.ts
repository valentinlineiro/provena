import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { linkedInProjector, linkedInRenderer } from './index.js'

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze)
    Object.freeze(value)
  }
  return value
}

function makeProfile(): Profile {
  return deepFreeze({
    identity: {
      person: { name: 'Alex Chen', title: 'Technical Lead', summary: 'Builds distributed systems.', urls: {} },
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
      title: 'Technical Lead',
      start: '2022-03',
      summary: 'Led platform reliability.',
      achievements: ['Reduced p99 latency by 40%'],
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Distributed Systems', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Shipped it' }],
  })
}

test('a projector never mutates the identity it was derived from', () => {
  const profile = makeProfile()
  linkedInProjector.project(profile)
  assert.equal(profile.identity.person.name, 'Alex Chen')
})

test('the same identity produces different, independent projections', () => {
  const profile = makeProfile()
  const resume = resumeProjector.project(profile)
  const linkedin = linkedInProjector.project(profile)

  assert.equal(resume.name, 'Alex Chen')
  assert.equal(linkedin.headline, 'Technical Lead')
  assert.equal(linkedin.experiences[0]?.organization, 'Acme Corp')
  assert.notEqual(Object.keys(resume).join(','), Object.keys(linkedin).join(','))
})

test('renderer truncates fields to LinkedIn platform limits', () => {
  const profile = makeProfile()
  const model = linkedInProjector.project(profile)
  const longAbout = { ...model, about: 'x'.repeat(3000), headline: 'y'.repeat(300) }
  const output = linkedInRenderer.render(longAbout)

  const about = output.split('## About\n\n')[1]?.split('\n\n##')[0] ?? ''
  const headline = output.split('## Headline\n\n')[1]?.split('\n\n##')[0] ?? ''
  assert.ok(about.length <= 2600)
  assert.ok(headline.length <= 220)
})

test('renderer output includes headline and experience sections', () => {
  const profile = makeProfile()
  const model = linkedInProjector.project(profile)
  const output = linkedInRenderer.render(model)

  assert.match(output, /## Headline/)
  assert.match(output, /Technical Lead/)
  assert.match(output, /## Experience/)
  assert.match(output, /Acme Corp/)
})
