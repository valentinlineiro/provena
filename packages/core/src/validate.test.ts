import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validate, formatValidationErrors } from './validate.js'
import type { ValidationError } from './validate.js'
import type { Identity, Experience, Capability } from './types.js'

function identity(overrides: Partial<Identity> = {}): Identity {
  return {
    person: { name: 'Alex Chen', urls: {} },
    experienceIds: [],
    projectIds: [],
    educationIds: [],
    publicationIds: [],
    certificationIds: [],
    recommendationIds: [],
    capabilityIds: [],
    ...overrides,
  }
}

test('a workspace with no cross-references is valid', () => {
  const errors = validate({ identity: identity() })
  assert.deepEqual(errors, [])
})

test('a dangling reference is an error', () => {
  const errors = validate({ identity: identity({ capabilityIds: ['missing'] }) })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /missing/)
})

test('a duplicate id is an error', () => {
  const capabilities: Capability[] = [
    { id: 'dup', name: 'A', evidenceIds: [] },
    { id: 'dup', name: 'B', evidenceIds: [] },
  ]
  const errors = validate({ identity: identity(), capabilities })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /Duplicate id "dup"/)
})

test('an experience referencing an unknown capability is an error', () => {
  const experiences: Experience[] = [
    {
      id: 'exp-1',
      organization: 'Acme',
      title: 'Engineer',
      start: '2022-01',
      achievements: [],
      technologies: [],
      capabilityIds: ['missing-capability'],
      evidenceIds: [],
    },
  ]
  const errors = validate({ identity: identity({ experienceIds: ['exp-1'] }), experiences })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.path, /experience\.exp-1\.capabilityIds/)
})

test('a missing person name is an error', () => {
  const errors = validate({ identity: identity({ person: { name: '', urls: {} } }) })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /"name" is required/)
  assert.equal(errors[0]!.source, 'person.yaml')
})

test('validation errors include source file hint', () => {
  const errors = validate({ identity: identity({ capabilityIds: ['missing'] }) })
  assert.equal(errors.length, 1)
  assert.equal(errors[0]!.source, 'provena.yaml')
})

test('formatValidationErrors includes file hints', () => {
  const errors: ValidationError[] = [
    { path: 'identity.experienceIds', message: 'Reference to unknown id "x"', source: 'provena.yaml' },
  ]
  const formatted = formatValidationErrors(errors)
  assert.match(formatted, /provena\.yaml/)
})
