import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveStrengths, deriveEvidenceCount, findEvidenceGaps, profileToTimeline } from './career.js'
import type { Profile } from './profile.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Valentín Liñeiro Barea', title: 'Staff Software Engineer | Software Architecture', urls: {} },
      experienceIds: ['exp-1', 'exp-2'],
      projectIds: [], educationIds: [], publicationIds: [], certificationIds: [],
      recommendationIds: [], capabilityIds: [],
    },
    experiences: [
      {
        id: 'exp-1', organization: 'Summa Networks', title: 'Senior Software Engineer',
        start: '2025-10', achievements: ['a', 'b', 'c'],
        technologies: ['Java', 'Spring'], capabilityIds: [], evidenceIds: [],
      },
      {
        id: 'exp-2', organization: 'VINCLE', title: 'Software Engineer',
        start: '2017-01', end: '2021-06', achievements: ['d', 'e'],
        technologies: ['Java', 'Spring Boot', 'Angular'], capabilityIds: [], evidenceIds: [],
      },
    ],
    projects: [], education: [], publications: [], certifications: [],
    recommendations: [], capabilities: [], evidence: [],
  }
}

test('profileToTimeline maps achievements to hitos and technologies to capabilities', () => {
  const t = profileToTimeline(makeProfile(), '2026-07-30')
  assert.equal(t.title, 'Staff Software Engineer')
  assert.equal(t.updatedAt, '2026-07-30')
  assert.equal(t.experiences.length, 2)
  assert.equal(t.experiences[0]!.hitos, 3)
  assert.equal(t.experiences[0]!.capabilities[0], 'Java')
  assert.equal(t.experiences[1]!.end, '2021-06')
})

test('profileToTimeline falls back to technologies when capabilityIds are empty', () => {
  const profile = makeProfile()
  const t = profileToTimeline(profile, '2026-07-30')
  assert.deepEqual(t.experiences[0]!.capabilities, ['Java', 'Spring'])
})

test('deriveStrengths counts capability frequency across experiences, sorted desc', () => {
  const s = deriveStrengths(makeProfile())
  assert.deepEqual(s[0], { name: 'Java', count: 2 })
  assert.equal(s[1]!.count, 1)
})

test('deriveEvidenceCount sums achievements', () => {
  assert.equal(deriveEvidenceCount(makeProfile()), 5)
})

test('findEvidenceGaps considers only past experiences and sorts by milestones asc', () => {
  const gaps = findEvidenceGaps(makeProfile())
  assert.equal(gaps.length, 1)
  assert.equal(gaps[0]!.organization, 'VINCLE')
  assert.equal(gaps[0]!.milestones, 2)
  assert.equal(gaps[0]!.dates, '2017-01 — 2021-06')
})

test('a primitive never mutates the profile', () => {
  const profile = makeProfile()
  deriveStrengths(profile); deriveEvidenceCount(profile); findEvidenceGaps(profile); profileToTimeline(profile, 'x')
  assert.equal(profile.experiences.length, 2)
})
