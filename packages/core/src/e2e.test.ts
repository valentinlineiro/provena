import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate } from './validate.js'
import type { Person, Experience, Capability, Identity } from './types.js'

function validProfile() {
  const person: Person = { name: 'Test User', title: 'Engineer', urls: {} }
  const capabilities: Capability[] = [
    { id: 'cap-1', name: 'Testing', evidenceIds: [] },
  ]
  const experiences: Experience[] = [{
    id: 'exp-1',
    organization: 'Test Corp',
    title: 'Engineer',
    start: '2023-01',
    achievements: ['Did a thing'],
    technologies: ['TypeScript'],
    capabilityIds: ['cap-1'],
    evidenceIds: [],
  }]
  const identity: Identity = {
    person,
    experienceIds: ['exp-1'],
    projectIds: [],
    educationIds: [],
    publicationIds: [],
    certificationIds: [],
    recommendationIds: [],
    capabilityIds: ['cap-1'],
  }
  return { identity, experiences, projects: [], education: [], publications: [], certifications: [], recommendations: [], capabilities, evidence: [] }
}

test('E2E: valid profile passes validation', () => {
  const errors = validate(validProfile())
  assert.deepEqual(errors, [])
})

test('E2E: broken reference fails validation', () => {
  const base = validProfile()
  const errors = validate({
    ...base,
    identity: { ...base.identity, capabilityIds: ['nonexistent'] },
  })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /nonexistent/)
})

test('E2E: duplicate capability id fails validation', () => {
  const base = validProfile()
  const errors = validate({
    ...base,
    identity: { ...base.identity, capabilityIds: ['dup'], experienceIds: [] },
    capabilities: [
      { id: 'dup', name: 'A', evidenceIds: [] },
      { id: 'dup', name: 'B', evidenceIds: [] },
    ],
    experiences: [],
  })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /Duplicate/)
})
