import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector, buildCvProjection, DEFAULT_CV_BUDGET, classifyEvidence, EvidenceClass, rankAchievements, significantSignals, redundantSummary } from './cv-projector.js'
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
    preferences: {
      interests: ['Software Architecture', 'Developer Productivity', 'AI-Assisted Engineering', 'Distributed Systems'],
    },
  }
}

test('cvProjection is a flat renderer-neutral contract, not a ResumeModel wrapper', () => {
  const cv = cvProjector(makeProfile())
  assert.equal(cv.hasOwnProperty('metadata'), false)
  assert.equal(cv.hasOwnProperty('model'), false)
  assert.ok(cv.identity)
  assert.ok(cv.headline)
  assert.ok(Array.isArray(cv.expertise))
  assert.ok(Array.isArray(cv.experiences))
})

test('headline comes from the decision context, falling back to the first title segment', () => {
  assert.equal(cvProjector(makeProfile()).headline, 'Staff Software Engineer')
  assert.equal(cvProjector(makeProfile(), { targetRole: 'Principal Engineer' }).headline, 'Principal Engineer')
})

test('expertise tracks profile interests and is capped by default budget', () => {
  const p = makeProfile()
  const cv = cvProjector(p, { targetRole: 'Principal Engineer' })
  assert.deepEqual(cv.expertise, ['Software Architecture', 'Developer Productivity', 'AI-Assisted Engineering', 'Distributed Systems'])
  const manyInterests = { ...p, preferences: { interests: Array.from({ length: 10 }, (_, i) => 'Expertise ' + i) } }
  assert.equal(cvProjector(manyInterests).expertise.length, DEFAULT_CV_BUDGET.maxCoreExpertise)
})

test('technologies are frequency-ordered, exclude expertise, and are capped', () => {
  const p = makeProfile()
  const cv = cvProjector(p)
  assert.equal(cv.technologies[0], 'Java')
  assert.ok(!cv.technologies.some(t => cv.expertise.includes(t)))
})

test('achievements per experience respect maxBulletsPerExperience budget', () => {
  const p = makeProfile()
  const p2: Profile = {
    ...p,
    experiences: [{ ...p.experiences[0]!, achievements: Array.from({ length: 10 }, (_, i) => 'achievement ' + i) }],
  }
  const cv = cvProjector(p2)
  assert.equal(cv.experiences[0]!.achievements.length, DEFAULT_CV_BUDGET.maxBulletsPerExperience)
})

test('certifications are capped by the budget', () => {
  const p = makeProfile()
  const p2: Profile = {
    ...p,
    identity: { ...p.identity, certificationIds: ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9'] },
    certifications: [
      ...Array.from({ length: 9 }, (_, i) => ({ id: `c${i + 1}`, name: `Cert ${i + 1}`, issuer: 'Issuer', evidenceIds: [] as string[] })),
    ],
  }
  const cv = cvProjector(p2)
  assert.equal(cv.certifications.length, DEFAULT_CV_BUDGET.maxCertifications)
})

test('excludeExperienceIds removes experiences', () => {
  const cv = cvProjector(makeProfile(), { excludeExperienceIds: ['exp-3'] })
  assert.equal(cv.experiences.length, 2)
  assert.ok(cv.experiences.every(e => e.organization !== 'Old Role'))
})

test('includeExperienceIds limits to the whitelist', () => {
  const cv = cvProjector(makeProfile(), { includeExperienceIds: ['exp-2'] })
  assert.equal(cv.experiences.length, 1)
  assert.equal(cv.experiences[0]!.organization, 'VINCLE')
})

test('omit filters a technology but keeps the experience', () => {
  const cv = cvProjector(makeProfile(), { omit: ['COBOL'] })
  assert.equal(cv.experiences.length, 3)
  assert.ok(cv.experiences.every(e => !e.technologies.includes('COBOL')))
})

test('emphasize moves named technology first', () => {
  const cv = cvProjector(makeProfile(), { emphasize: ['Spring'] })
  assert.equal(cv.experiences[0]!.technologies[0], 'Spring')
})

test('summary priority: explicit wins, generateSummary overrides, targetRole auto-generates', () => {
  const p = makeProfile()
  assert.equal(cvProjector(p).summary, 'I help teams evolve complex systems.')
  assert.equal(cvProjector(p, { generateSummary: true, targetRole: 'Staff Software Engineer' }).summary, 'Staff Software Engineer with proven strengths in Java, Spring, Angular.')
  const noSummary = { ...p, identity: { ...p.identity, person: { ...p.identity.person, summary: undefined } } }
  assert.equal(cvProjector(noSummary).summary, '')
  assert.match(cvProjector(noSummary, { targetRole: 'Staff Software Engineer' }).summary, /Staff Software Engineer with proven strengths in Java, Spring, Angular\./)
})

test('audience recruiter omits projects, hiring-manager includes them', () => {
  assert.equal(cvProjector(makeProfile(), { audience: 'recruiter' }).projects.length, 0)
  assert.equal(cvProjector(makeProfile(), { audience: 'hiring-manager' }).projects.length, 1)
  assert.equal(cvProjector(makeProfile()).projects.length, 1)
})

test('phase order: emphasizing an excluded experience never affects the output', () => {
  const cv = cvProjector(makeProfile(), { includeExperienceIds: ['exp-1'], emphasize: ['Angular'] })
  assert.equal(cv.experiences.length, 1)
  assert.ok(cv.experiences[0]!.technologies.every(t => t !== 'Angular'))
})

test('buildCvProjection is the same function as cvProjector', () => {
  const p = makeProfile()
  assert.deepEqual(buildCvProjection(p), cvProjector(p))
})

test('a projector never mutates the profile', () => {
  const profile = makeProfile()
  cvProjector(profile, { excludeExperienceIds: ['exp-3'], emphasize: ['Spring'] })
  assert.equal(profile.experiences.length, 3)
})

// R3 — evidence-over-claim: quantified/measured outcomes survive the budget
// cap over generic claims positioned earlier, with deterministic taxonomy.

test('R3: classifyEvidence recognises the five evidence taxons deterministically', () => {
  assert.equal(classifyEvidence('Reduced p99 latency by 40%'), EvidenceClass.Quantified)
  assert.equal(classifyEvidence('Improved capacity by 40%'), EvidenceClass.Quantified)
  assert.equal(classifyEvidence('adopted as the foundation for a separate product'), EvidenceClass.Adopted)
  assert.equal(classifyEvidence('externally validated outcome'), EvidenceClass.Adopted)
  assert.equal(classifyEvidence('Built an internal CLI tool for the whole team'), EvidenceClass.Artifact)
  assert.equal(classifyEvidence('shipped a new service'), EvidenceClass.Artifact)
  assert.equal(classifyEvidence('Led the migration of a legacy CRM'), EvidenceClass.Owned)
  assert.equal(classifyEvidence('drove the product roadmap'), EvidenceClass.Owned)
  assert.equal(classifyEvidence('Reduced team friction'), EvidenceClass.Generic)
  assert.equal(classifyEvidence('evolved from coding to understanding systems'), EvidenceClass.Generic)
})

test('R3: a quantified achievement at position 5 survives a generic claim at 1–4 (acceptance from the real CV)', () => {
  const achievements = [
    'Led a frontend team', // Owned
    'Evolved from writing code', // Generic
    'learned to align with teams', // Generic
    'Contributed to research', // Generic
    'Designed scalable backend with Java, Spring Boot and MongoDB, improving capacity by 40%', // Quantified
  ]
  // rank, then cap at 4: quantified must displace the last generic.
  const ranked = rankAchievements(achievements).slice(0, 4)
  assert.equal(ranked.length, 4)
  assert.ok(ranked.includes(achievements[4]!), 'the quantified outcome must survive')
  assert.ok(ranked.includes(achievements[0]!), 'the owned/led item is stronger than generic and must survive')
})

test('R3: stable sort keeps the original order when all achievements share the same evidence class', () => {
  const achievements = [
    'Learned to adapt quickly',
    'Evolved from writing code',
    'Aligned decisions with teams',
  ]
  assert.deepEqual(rankAchievements(achievements), achievements)
})

test('R3: the ranking never rewrites, dedupes or rewords achievement content', () => {
  const achievements = ['First claim', 'Reduced p99 by 40%', 'Second claim']
  const ranked = rankAchievements(achievements)
  assert.deepEqual(new Set(ranked), new Set(achievements))
  assert.ok(ranked.every(a => achievements.includes(a)))
})

test('R3: within an equal class the canonical profile order is preserved', () => {
  const achievements = ['Ship thing', 'Ship other', 'Ship third']
  const ranked = rankAchievements(achievements)
  assert.equal(ranked[0], 'Ship thing')
  assert.equal(ranked[2], 'Ship third')
})

// R4 — semantic redundancy suppression: never emit a summary that only
// re-enunciates, in prose, claims already covered by the experience's own
// achievements (which R3 already curated). Deterministic, token-based.

test('R4: significantSignals extracts stable content tokens, dropping en+es stopwords and punctuation', () => {
  const s = significantSignals('Consultoría de software en microservicios, cloud y Kubernetes, ensuring maintainability.')
  assert.ok(s.includes('microservicios'))
  assert.ok(s.includes('kubernetes'))
  assert.ok(s.includes('maintainability'))
  assert.ok(!s.includes('de'))
  assert.ok(!s.includes('y'))
  assert.ok(!s.includes('en'))
})

test('R4: suppression is sentence-scoped — a redundant claim drops, a unique claim in the same summary survives', () => {
  const summary = 'Consultoría en sistemas distribuidos y cloud. Evolved from writing code to understanding full systems.'
  const bulletSignals = significantSignals('Evolved from writing code to understanding full systems.')
  assert.equal(redundantSummary(summary, bulletSignals), 'Consultoría en sistemas distribuidos y cloud.')
})

test('R4: a claim whose signals are already fully carried by the own bullets is suppressed entirely', () => {
  const summary = 'Evolved from writing code to understanding full systems.'
  const bulletSignals = significantSignals('Evolved from writing code to understanding full systems in production.')
  assert.equal(redundantSummary(summary, bulletSignals), '')
})

test('R4: suppression is sentence-scoped — a redundant claim drops while a unique claim in the same summary survives', () => {
  const summary = 'Consultoría en múltiples clientes. Evolved from writing code to understanding full systems.'
  const bulletSignals = significantSignals('Evolved from writing code to understanding full systems.')
  assert.equal(redundantSummary(summary, bulletSignals), 'Consultoría en múltiples clientes.')
})

test('R4: a quantified or adopted claim beyond the bullets is kept even if covered', () => {
  const summary = 'Designed a scalable backend, improving capacity by 40%.'
  const bulletSignals = significantSignals('Led a team; evolved from writing code.')
  assert.equal(redundantSummary(summary, bulletSignals), summary)
})

test('R4: empty summary is never redundant (nothing to suppress)', () => {
  assert.equal(redundantSummary('', []), '')
})

test('R4: redundantSummary is deterministic — same inputs, same output', () => {
  const summary = 'Worked on distributed systems, microservices and cloud.'
  const ctx = significantSignals('Worked on distributed systems, microservices and cloud in production.')
  assert.equal(redundantSummary(summary, ctx), redundantSummary(summary, ctx))
})