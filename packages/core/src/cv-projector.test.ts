import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from './projections.js'
import { cvProjector } from './cv-projector.js'
import type { Profile } from './profile.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Valentín Liñeiro Barea', title: 'Staff Software Engineer', summary: 'I help teams evolve complex systems.', urls: {} },
      experienceIds: ['exp-1', 'exp-2', 'exp-3'],
      projectIds: ['proj-1'], educationIds: [], publicationIds: [], certificationIds: [],
      recommendationIds: [], capabilityIds: [],
    },
    experiences: [
      { id: 'exp-1', organization: 'Summa Networks', title: 'Senior Software Engineer', start: '2025-10', achievements: ['Led a migration'], technologies: ['Java', 'Spring'], capabilityIds: [], evidenceIds: [] },
      { id: 'exp-2', organization: 'VINCLE', title: 'Software Engineer', start: '2017-01', end: '2021-06', achievements: ['Built a CRM'], technologies: ['Java', 'Angular'], capabilityIds: [], evidenceIds: [] },
      { id: 'exp-3', organization: 'Old Role', title: 'Developer', start: '2013-01', end: '2014-01', achievements: ['Maintained legacy'], technologies: ['COBOL'], capabilityIds: [], evidenceIds: [] },
    ],
    projects: [{ id: 'proj-1', name: 'Provena', description: 'A framework.', technologies: ['TypeScript'], capabilityIds: [], evidenceIds: [] }],
    education: [], publications: [], certifications: [], recommendations: [],
    capabilities: [], evidence: [],
  }
}

test('cvProjector without context is byte-identical to resumeProjector', () => {
  const profile = makeProfile()
  assert.deepEqual(cvProjector(profile).model, resumeProjector.project(profile))
})

test('excludeExperienceIds removes experiences and reports them in metadata', () => {
  const p = makeProfile()
  const { model, metadata } = cvProjector(p, { excludeExperienceIds: ['exp-3'] })
  assert.equal(model.experiences.length, 2)
  assert.equal(model.experiences[0]!.organization, 'Summa Networks')
  assert.deepEqual(metadata.excludedExperienceIds, ['exp-3'])
  assert.deepEqual(metadata.selectedExperienceIds, ['exp-1', 'exp-2'])
})

test('includeExperienceIds limits to the whitelist', () => {
  const { model, metadata } = cvProjector(makeProfile(), { includeExperienceIds: ['exp-2'] })
  assert.equal(model.experiences.length, 1)
  assert.equal(model.experiences[0]!.organization, 'VINCLE')
  assert.deepEqual(metadata.selectedExperienceIds, ['exp-2'])
})

test('omit filters a technology but keeps the experience', () => {
  const p = makeProfile()
  const { model } = cvProjector(p, { omit: ['COBOL'] })
  assert.equal(model.experiences.length, 3)
  assert.ok(model.experiences.every(e => !e.technologies.includes('COBOL')))
  assert.ok(model.capabilities.every(c => c.name !== 'COBOL'))
})

test('emphasize moves named capabilities first and reports them in metadata', () => {
  const p = makeProfile()
  const { model, metadata } = cvProjector(p, { emphasize: ['Spring'] })
  assert.equal(model.experiences[0]!.technologies[0], 'Spring')
  assert.deepEqual(metadata.emphasizedCapabilities, ['Spring'])
})

test('summary priority: explicit wins, generateSummary overrides, targetRole auto-generates', () => {
  const p = makeProfile()
  assert.equal(cvProjector(p).model.summary, 'I help teams evolve complex systems.')
  assert.equal(cvProjector(p, { generateSummary: true, targetRole: 'Staff Software Engineer' }).model.summary, 'Staff Software Engineer with proven strengths in Java, Spring, Angular.')
  const noSummary = { ...p, identity: { ...p.identity, person: { ...p.identity.person, summary: undefined } } }
  assert.equal(cvProjector(noSummary).model.summary, '')
  assert.match(cvProjector(noSummary, { targetRole: 'Staff Software Engineer' }).model.summary, /Staff Software Engineer with proven strengths in Java, Spring, Angular\./)
})

test('audience recruiter omits projects, hiring-manager includes them', () => {
  const p = makeProfile()
  assert.equal(cvProjector(p, { audience: 'recruiter' }).model.projects.length, 0)
  assert.equal(cvProjector(p, { audience: 'hiring-manager' }).model.projects.length, 1)
  assert.equal(cvProjector(p).model.projects.length, 1)
})

test('phase order: emphasizing an excluded experience never affects the output', () => {
  const p = makeProfile()
  const { model } = cvProjector(p, { includeExperienceIds: ['exp-1'], emphasize: ['Angular'] })
  assert.equal(model.experiences.length, 1)
  assert.ok(model.experiences[0]!.technologies.every(t => t !== 'Angular'))
})

test('a projector never mutates the profile', () => {
  const profile = makeProfile()
  cvProjector(profile, { excludeExperienceIds: ['exp-3'], emphasize: ['Spring'] })
  assert.equal(profile.experiences.length, 3)
})
