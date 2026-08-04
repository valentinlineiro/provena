import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOpportunity } from './opportunity.js'
import type { Profile } from './profile.js'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    identity: {
      person: { name: 'Test Person', urls: {} },
      experienceIds: ['exp1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['c1', 'c2'],
    },
    experiences: [{
      id: 'exp1',
      organization: 'Acme',
      title: 'Engineer',
      start: '2020-01',
      achievements: [],
      technologies: [],
      capabilityIds: ['c1'],
      evidenceIds: [],
    }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [
      { id: 'c1', name: 'Software Architecture', evidenceIds: [], signals: ['software architecture', 'architectural decisions'] },
      { id: 'c2', name: 'Kubernetes', evidenceIds: [], signals: ['kubernetes', 'k8s'] },
    ],
    evidence: [],
    contributions: [{
      id: 'contrib1',
      experienceRef: 'exp1',
      summary: 'Designed a Clean Architecture proposal for the backend.',
      outcome: { summary: 'Adopted as the architectural foundation of the product.' },
      capabilityIds: ['c1'],
      technologies: ['java'],
      evidenceIds: [],
    }],
    preferences: {
      compensation: { minimum: 80000, currency: '€' },
      work: { remote: 'required' },
      roles: ['Staff Engineer', 'Principal Engineer'],
      avoid: ['six interview rounds'],
    },
    ...overrides,
  }
}

test('SKIP: compensation below minimum is a violated criterion', () => {
  const ev = evaluateOpportunity('Backend engineer. Salary €70,000 - €90,000.', makeProfile())
  assert.equal(ev.verdict, 'skip')
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'violated')
})

test('compensation: a trailing period does not truncate the salary amount', () => {
  const ev = evaluateOpportunity('Staff Engineer. €100,000 - €120,000.', makeProfile())
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'satisfied')
})

test('SKIP: on-site only violates a remote-required preference', () => {
  const ev = evaluateOpportunity('Staff Engineer. This role is on-site 5 days per week in Madrid.', makeProfile())
  assert.equal(ev.verdict, 'skip')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')
})

test('SKIP: an avoid pattern in the JD is a violated criterion', () => {
  const ev = evaluateOpportunity('Staff Engineer. Expect six interview rounds.', makeProfile())
  assert.equal(ev.verdict, 'skip')
  assert.equal(ev.criteria.find(c => c.criterion === 'avoid')!.status, 'violated')
})

test('I-OE-3: an absent criterion yields unknown, never violated', () => {
  const ev = evaluateOpportunity('Staff Software Engineer. Own architectural decisions.', makeProfile())
  assert.equal(ev.verdict, 'apply')
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'unknown')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'unknown')
})

test('APPLY: criteria pass and demonstrated coverage is high', () => {
  const jd = [
    'Staff Software Engineer.',
    'Own architectural decisions for backend systems.',
    'We value software architecture.',
  ].join('\n')
  const ev = evaluateOpportunity(jd, makeProfile())
  assert.equal(ev.verdict, 'apply')
  assert.ok(ev.demonstrated.some(m => m.capabilityName === 'Software Architecture'))
  assert.ok(ev.demonstrated[0]!.evidence.includes('Adopted as the architectural foundation of the product.'))
})

test('CONSIDER: mostly unrecognized JD is never a fabricated gap (I-OE-1)', () => {
  const ev = evaluateOpportunity('Fun startup building widgets with quantum entanglement. Join our journey!', makeProfile())
  assert.equal(ev.verdict, 'consider')
  assert.equal(ev.gaps.length, 0)
  assert.ok(ev.notEvaluated > 0)
  assert.equal(ev.interpretationCoverage, 0)
})

test('CONSIDER: coverage below the apply threshold', () => {
  const jd = [
    'Staff Software Engineer.',
    'Kubernetes is central to this role.',
    'You will own architectural decisions.',
  ].join('\n')
  const ev = evaluateOpportunity(jd, makeProfile())
  assert.equal(ev.verdict, 'consider')
  assert.equal(ev.demonstrated.length, 1)
  assert.ok(ev.gaps.some(m => m.capabilityName === 'Kubernetes'))
})

test('handoff: APPLY produces a DecisionContext for the CV projection', () => {
  const ev = evaluateOpportunity('Staff Software Engineer. Own architectural decisions. Fully remote.', makeProfile())
  assert.equal(ev.verdict, 'apply')
  assert.equal(ev.decisionContext.targetRole, 'Staff Engineer')
  assert.ok(ev.decisionContext.emphasize!.includes('Software Architecture'))
  assert.equal(ev.decisionContext.audience, 'hiring-manager')
})

test('I-OE-2: every claim traces to a canonical capability', () => {
  const profile = makeProfile()
  const ids = new Set(profile.capabilities.map(c => c.id))
  const ev = evaluateOpportunity('Staff Engineer. Own architectural decisions.', profile)
  for (const m of [...ev.demonstrated, ...ev.gaps]) assert.ok(ids.has(m.capabilityId))
})
