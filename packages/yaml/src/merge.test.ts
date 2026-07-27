import { test } from 'node:test'
import assert from 'node:assert/strict'
import { merge } from './merge.js'
import type { Profile, Provenance } from '@provena/core'

const linkedinProvenance: Provenance = { source: 'linkedin', importedAt: '2026-01-01T00:00:00Z' }

function baseProfile(): Profile {
  return {
    identity: {
      person: { name: 'Alex', urls: {} },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: [],
    },
    experiences: [{ id: 'exp-1', organization: 'Acme', title: 'Engineer', start: '2020-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [],
    evidence: [],
  }
}

test('imported experience with same org+title+start is skipped', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'new-id', organization: 'Acme', title: 'Engineer', start: '2020-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.experiences.length, 1)
  assert.equal(result.experiences[0]?.id, 'exp-1')
})

test('imported experience with different org+title+start is appended', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'new-id', organization: 'Other Corp', title: 'Senior Engineer', start: '2022-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.experiences.length, 2)
  assert.equal(result.experiences[1]?.organization, 'Other Corp')
})

test('imported capability with same name is skipped', () => {
  const existing = { ...baseProfile(), capabilities: [{ id: 'cap-1', name: 'TypeScript', evidenceIds: [] }], identity: { ...baseProfile().identity, capabilityIds: ['cap-1'] } } as Profile
  const imported: Partial<Profile> = {
    capabilities: [{ id: 'new-cap', name: 'TypeScript', evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.capabilities.length, 1)
})

test('imported person does not overwrite existing', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    identity: { person: { name: 'Imported Alex', urls: {} }, experienceIds: [], projectIds: [], educationIds: [], publicationIds: [], certificationIds: [], recommendationIds: [], capabilityIds: [] },
  }
  const result = merge(imported, existing)
  assert.equal(result.identity.person.name, 'Alex')
})

test('no person.yaml (fresh import) uses imported person', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    identity: { person: { name: 'Fresh Alex', urls: {} }, experienceIds: [], projectIds: [], educationIds: [], publicationIds: [], certificationIds: [], recommendationIds: [], capabilityIds: [] },
  }
  const result = merge(imported, existing)
  assert.equal(result.identity.person.name, 'Alex')
})

test('new entities are added to identity reference arrays', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'exp-2', organization: 'New Co', title: 'Dev', start: '2023-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.ok(result.identity.experienceIds.includes('exp-2'))
})
