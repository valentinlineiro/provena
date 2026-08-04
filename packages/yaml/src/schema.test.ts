import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseExperiences, parsePerson, parseCapabilities } from './schema.js'

test('parseExperiences rejects a numeric start date with a descriptive error', () => {
  const raw = [
    {
      id: 'exp-1',
      organization: 'Acme',
      title: 'Engineer',
      start: 2023,
      achievements: [],
      technologies: [],
      capabilityIds: [],
      evidenceIds: [],
    },
  ]
  assert.throws(() => parseExperiences(raw), /experience\.yaml\[0\]: invalid or missing field\(s\): start/)
})

test('parseExperiences accepts a well-formed array', () => {
  const raw = [
    {
      id: 'exp-1',
      organization: 'Acme',
      title: 'Engineer',
      start: '2023-01',
      achievements: [],
      technologies: [],
      capabilityIds: [],
      evidenceIds: [],
    },
  ]
  assert.equal(parseExperiences(raw).length, 1)
})

test('parsePerson rejects a missing name', () => {
  assert.throws(() => parsePerson({ urls: {} }), /person\.yaml: invalid or missing field\(s\): name/)
})

test('parseCapabilities accepts an optional signals array', () => {
  const raw = [{
    id: 'cap-1',
    name: 'Technical Leadership',
    evidenceIds: [],
    signals: ['technical leadership', 'mentor engineers'],
  }]
  const parsed = parseCapabilities(raw)
  assert.equal(parsed.length, 1)
  assert.deepEqual(parsed[0]!.signals, ['technical leadership', 'mentor engineers'])
})

test('parseCapabilities rejects a non-string signals array', () => {
  const raw = [{ id: 'cap-1', name: 'X', evidenceIds: [], signals: [42] }]
  assert.throws(() => parseCapabilities(raw), /capabilities\.yaml\[0\]: invalid or missing field\(s\): signals/)
})
