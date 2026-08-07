import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCareerCompass, narrateCompass, cvReadiness } from './compass.js'
import { profileToTimeline } from '@provena/core'
import profile, { updatedAt } from './profile.js'
import type { Profile } from '@provena/core'

const COMPASS = computeCareerCompass(profile)
const TIMELINE = profileToTimeline(profile, updatedAt)

test('engine derives facts from the real timeline', () => {
  assert.equal(COMPASS.positioning, 'market-ready')
  assert.equal(COMPASS.readiness, 'ready')
  assert.equal(COMPASS.confidence, 1)
  assert.deepEqual(COMPASS.strengths[0]!, { name: 'Java', count: 4 })
  assert.equal(COMPASS.strengths[1]!.name, 'REST APIs')
  assert.equal(COMPASS.gaps[0]!.organization, 'VINCLE')
  assert.equal(COMPASS.gaps[0]!.milestones, 2)
  assert.equal(COMPASS.nextBestImprovement.target, 'VINCLE')
})

test('narrator renders the market-ready compass', () => {
  const n = narrateCompass(COMPASS, TIMELINE)
  assert.equal(n.status, 'Ready to explore the market')
  assert.equal(n.headline, 'Your recorded experience supports a move to Staff Software Engineer opportunities.')
  assert.deepEqual(n.strengths, ['Java', 'REST APIs', 'Spring Boot'])
  assert.equal(n.gapLabel, 'VINCLE (2 milestones)')
  assert.equal(n.nextStep, 'Document one high-impact milestone from that period, or one demonstrating cross-team impact.')
  assert.match(n.why[1]!, /^Story updated /)
})

test('narrator exposes concrete evidence for every claim', () => {
  const n = narrateCompass(COMPASS, TIMELINE)
  assert.equal(n.why[0], '23 documented milestones')
  assert.match(n.why[1]!, /^Story updated (today|\d+ (day|days) ago)$/)
  assert.equal(n.why[2], 'Current Staff Software Engineer positioning')
  assert.equal(n.why[3], 'Consistent strengths in Java, REST APIs, Spring Boot')
})

test('low-evidence profile produces developing positioning', () => {
  const sparse: Profile = {
    identity: {
      person: { name: 'Alex', title: 'Senior Software Engineer', urls: {} },
      experienceIds: ['e1'], projectIds: [], educationIds: [], publicationIds: [],
      certificationIds: [], recommendationIds: [], capabilityIds: [],
    },
    experiences: [{ id: 'e1', organization: 'Acme', title: 'Engineer', start: '2025-01', achievements: ['a', 'b'], technologies: ['Java'], capabilityIds: [], evidenceIds: [] }],
    projects: [], education: [], publications: [], certifications: [], recommendations: [], capabilities: [], evidence: [],
  }
  const sparseTimeline = profileToTimeline(sparse, '2026-07-30')
  const compass = computeCareerCompass(sparse)
  const n = narrateCompass(compass, sparseTimeline)
  assert.equal(compass.positioning, 'developing')
  assert.equal(compass.readiness, 'building')
  assert.equal(compass.confidence, 2 / 15)
  assert.equal(n.status, 'Still developing')
  assert.equal(n.headline, 'Your story is still developing toward Senior Software Engineer opportunities.')
  assert.deepEqual(n.strengths, ['Java'])
  assert.equal(n.nextStep, 'Document one high-impact milestone from that period, or one demonstrating cross-team impact.')
})

test('compass progresses insufficient-evidence → developing → market-ready', () => {
  const base = (hitos: number): Profile => ({
    identity: {
      person: { name: 'Alex', title: 'Staff Software Engineer', urls: {} },
      experienceIds: ['e1'], projectIds: [], educationIds: [], publicationIds: [],
      certificationIds: [], recommendationIds: [], capabilityIds: [],
    },
    experiences: [{
      id: 'e1',
      organization: 'Acme',
      title: 'Engineer',
      start: '2025-01',
      achievements: Array.from({ length: hitos }, (_, i) => 'a' + i),
      technologies: ['Java', 'Backend Architecture'],
      capabilityIds: [],
      evidenceIds: [],
    }],
    projects: [], education: [], publications: [], certifications: [], recommendations: [], capabilities: [], evidence: [],
  })

  const imported = computeCareerCompass(base(0))
  assert.equal(imported.positioning, 'insufficient-evidence')
  assert.equal(imported.readiness, 'unknown')
  assert.equal(imported.confidence, 0)

  const withMilestones = computeCareerCompass(base(4))
  assert.equal(withMilestones.positioning, 'developing')
  assert.equal(withMilestones.readiness, 'building')

  const mature = computeCareerCompass(base(15))
  assert.equal(mature.positioning, 'market-ready')
  assert.equal(mature.readiness, 'ready')
  assert.equal(mature.confidence, 1)
})

test('insufficient evidence refuses to judge instead of saying "developing"', () => {
  const imported: Profile = {
    identity: {
      person: { name: 'Alex', title: 'Staff Software Engineer', urls: {} },
      experienceIds: ['e1'], projectIds: [], educationIds: [], publicationIds: [],
      certificationIds: [], recommendationIds: [], capabilityIds: [],
    },
    experiences: [{ id: 'e1', organization: 'Acme', title: 'Engineer', start: '2025-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }],
    projects: [], education: [], publications: [], certifications: [], recommendations: [], capabilities: [], evidence: [],
  }
  const importedTimeline = profileToTimeline(imported, '2026-07-30')
  const n = narrateCompass(computeCareerCompass(imported), importedTimeline)
  assert.equal(n.status, 'Insufficient evidence')
  assert.equal(n.headline, 'Not enough recorded milestones to assess your career positioning yet.')
  assert.deepEqual(n.strengths, [])
  assert.equal(n.gapLabel, '')
  assert.equal(n.nextStep, 'Document your first career milestones to unlock the Career Compass.')
  assert.equal(n.why[0], '0 documented milestones')
  assert.match(n.why[1]!, /^Story updated /)
})

test('cvReadiness surfaces the compass gap as a strengthening suggestion', () => {
  const text = cvReadiness({ targetRole: 'Staff Software Engineer' }, COMPASS)
  assert.match(text, /Projection Quality: Good/)
  assert.match(text, /One additional milestone from VINCLE/)
  assert.match(text, /for Staff Software Engineer opportunities/)
})
