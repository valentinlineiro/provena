import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { jsonResumeProjector } from './index.js'

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

test('I1+I2: projector never mutates the identity it was derived from', () => {
  const profile = makeProfile()
  jsonResumeProjector.project(profile)
  assert.equal(profile.identity.person.name, 'Alex Chen')
})

test('I4: projector is deterministic — same input, same output', () => {
  const profile = makeProfile()
  const a = jsonResumeProjector.project(profile)
  const b = jsonResumeProjector.project(profile)
  assert.deepEqual(a, b)
})

test('I5: two distinct representations preserve the same meaning', () => {
  const profile = makeProfile()
  const resume = resumeProjector.project(profile)
  const jsonResume = jsonResumeProjector.project(profile)

  assert.equal(resume.name, profile.identity.person.name)
  assert.equal(jsonResume.basics.name, profile.identity.person.name)
})
