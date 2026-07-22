import { test } from 'node:test'
import assert from 'node:assert/strict'
import { toResumeProjection, toLinkedInProjection } from './projections.js'
import type { Profile } from './profile.js'

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
      person: { name: 'Alex Chen', title: 'Technical Lead', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [
      {
        id: 'exp-1',
        organization: 'Acme Corp',
        title: 'Technical Lead',
        start: '2022-03',
        achievements: ['Reduced p99 latency by 40%'],
        technologies: ['TypeScript'],
        capabilityIds: ['cap-1'],
        evidenceIds: [],
      },
    ],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Distributed Systems', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Shipped it' }],
  })
}

test('a projection never mutates the identity it was derived from', () => {
  const profile = makeProfile()
  toResumeProjection(profile)
  toLinkedInProjection(profile)
  // deepFreeze makes any accidental write throw before this point;
  // reaching here means both projections only read.
  assert.equal(profile.identity.person.name, 'Alex Chen')
})

test('the same identity produces different, independent projections', () => {
  const profile = makeProfile()
  const resume = toResumeProjection(profile)
  const linkedin = toLinkedInProjection(profile)

  assert.equal(resume.name, 'Alex Chen')
  assert.equal(resume.experiences[0]?.organization, 'Acme Corp')

  assert.equal(linkedin.headline, 'Technical Lead')
  assert.equal(linkedin.experiences[0]?.organization, 'Acme Corp')

  // same source, different shapes
  assert.notEqual(Object.keys(resume).join(','), Object.keys(linkedin).join(','))
})

test('a capability carries its evidence count, not a free-form claim', () => {
  const profile = makeProfile()
  const resume = toResumeProjection(profile)
  assert.equal(resume.capabilities[0]?.evidenceCount, 1)
})
