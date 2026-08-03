import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector, buildCvProjection, DEFAULT_CV_BUDGET, classifyEvidence, EvidenceClass, rankAchievements, significantSignals, redundantSummary, experienceContribution, CONTRIBUTION_BUDGET, projectContribution, evaluateContribution, rankContributions, activatedGroups } from './cv-projector.js'
import type { Profile } from './profile.js'
import type { Contribution, Capability } from './types.js'

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
    projects: [{ id: 'proj-1', name: 'Provena', description: 'A framework improving developer productivity.', technologies: ['TypeScript'], capabilityIds: [], evidenceIds: [] }],
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

test('R5b: the evidence budget follows contribution — Core full, Supporting 2, Historical 1', () => {
  const p = makeProfile()
  const ten = Array.from({ length: 10 }, (_, i) => 'Shipped feature ' + i)
  const core: Profile = { ...p, preferences: { interests: STAFF_VOCAB }, experiences: [{ ...p.experiences[0]!, achievements: [...ten, 'Architected distributed systems and led the platform'] }] }
  const supporting: Profile = { ...p, experiences: [{ ...p.experiences[0]!, achievements: [...ten, 'Participated in architecture decisions'] }] }
  const historical: Profile = { ...p, experiences: [{ ...p.experiences[0]!, achievements: ten }] }
  assert.equal(cvProjector(core).experiences[0]!.achievements.length, CONTRIBUTION_BUDGET.Core)
  assert.equal(cvProjector(supporting).experiences[0]!.achievements.length, CONTRIBUTION_BUDGET.Supporting)
  assert.equal(cvProjector(historical).experiences[0]!.achievements.length, CONTRIBUTION_BUDGET.Historical)
  assert.equal(CONTRIBUTION_BUDGET.Core, DEFAULT_CV_BUDGET.maxBulletsPerExperience)
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

// R2 — target relevance modifies selection order (relevance → evidence →
// canonical), never the truth of evidence. Vocabulary is the decision
// context's emphasize (else profile interests) bridged bilingually, plus
// implicit technical-leadership signals. Real CV data, acceptance for Staff.

const STAFF_VOCAB = [
  'Software Architecture',
  'Developer Productivity',
  'AI-Assisted Engineering',
  'Distributed Systems',
  'Platform Engineering',
  'Technical Leadership',
]

const KNOWMAD_ACHIEVEMENTS = [
  'Trabajó con arquitecturas distribuidas, microservicios y cloud (Spring Boot, Kafka, Docker, Kubernetes, Azure) en sistemas de producción reales',
  'Desarrolló capacidad de adaptación rápida a múltiples clientes, contextos y dominios distintos',
  'Evolucionó de escribir código a entender sistemas completos — APIs, mensajería, bases de datos, CI/CD, operación',
  'Aprendió a alinear decisiones técnicas con equipos y culturas de cliente distintas, asegurando mantenibilidad a largo plazo',
  'Construyó los cimientos técnicos que luego permitieron moverse hacia responsabilidades de arquitectura, productividad e IA',
  'Diseñó servicios backend escalables con Java, Spring Boot, Kafka y MongoDB, mejorando la capacidad del sistema en un 40%',
]

test('R2: relevance outranks evidence strength — knowmad leads with systems scope and keeps the quantified 40% within budget', () => {
  const top4 = rankAchievements(KNOWMAD_ACHIEVEMENTS, STAFF_VOCAB).slice(0, 4)
  assert.equal(top4[0], KNOWMAD_ACHIEVEMENTS[0]!, 'distributed-systems evidence leads the scope narrative')
  assert.equal(top4[1], KNOWMAD_ACHIEVEMENTS[4]!, 'foundations toward architecture/productivity/AI follow')
  assert.ok(top4.includes(KNOWMAD_ACHIEVEMENTS[5]!), 'the quantified 40% survives within the budget')
})

test('R2: influence and architecture ownership lead Summa and VINCLE', () => {
  const summa = [
    'Designed a Clean Architecture proposal for the HSS backend — adopted as the foundation for a separate product (SMSC)',
    "Became the internal reference for AI-assisted engineering; the company's AI Lead shared experiments and sought input on internal training",
    'Evolved from ticket-based development to owning the product roadmap, driving architectural improvements in a legacy 4G network core',
    'Drove modernization of a critical telecom system without compromising stability',
    'Reduced team friction by improving maintainability, simplifying decisions, and accelerating delivery velocity',
  ]
  const vincle = [
    'Led the migration of a legacy CRM/SFA to Spring Boot and Angular, improving maintainability and enabling future evolution',
    'Led a frontend team and participated in architecture decisions across backend, integrations, and business-critical functionality',
  ]
  const summaOrder = rankAchievements(summa, STAFF_VOCAB)
  const vincleOrder = rankAchievements(vincle, STAFF_VOCAB)
  assert.equal(summaOrder[0], summa[1]!, 'the AI-assisted influence reference leads')
  assert.equal(vincleOrder[0], vincle[1]!, 'the architecture-decisions ownership leads the migration')
})

test('R2: relevance never rewrites, dedupes or rewords achievement content', () => {
  const ranked = rankAchievements(KNOWMAD_ACHIEVEMENTS, STAFF_VOCAB)
  assert.deepEqual(new Set(ranked), new Set(KNOWMAD_ACHIEVEMENTS))
})

test('R2: cvProjector threads the vocabulary by default (interests + leadership) on the real data', () => {
  const p: Profile = {
    ...makeProfile(),
    identity: { ...makeProfile().identity, person: { ...makeProfile().identity.person, summary: undefined } },
    preferences: { interests: STAFF_VOCAB },
    experiences: [{ ...makeProfile().experiences[0]!, organization: 'knowmad mood', title: 'Senior Software Engineer', achievements: KNOWMAD_ACHIEVEMENTS }],
  }
  const bullets = cvProjector(p, { targetRole: 'Staff Software Engineer' }).experiences[0]!.achievements
  assert.equal(bullets[0], KNOWMAD_ACHIEVEMENTS[0])
  assert.equal(bullets[1], KNOWMAD_ACHIEVEMENTS[4])
  assert.ok(bullets.includes(KNOWMAD_ACHIEVEMENTS[5]!), 'the quantified 40% survives the budget cap')
})

// R5a — experience contribution classification. Metadata only: derived from
// observable relevance to the decision context, never age. Core → Supporting →
// Historical; nothing is removed or re-budgeted yet.

const SUMMA_ACHIEVEMENTS = [
  'Designed a Clean Architecture proposal for the HSS backend — adopted as the foundation for a separate product (SMSC)',
  "Became the internal reference for AI-assisted engineering; the company's AI Lead shared experiments and sought input on internal training",
  'Evolved from ticket-based development to owning the product roadmap, driving architectural improvements in a legacy 4G network core',
  'Drove modernization of a critical telecom system without compromising stability',
  'Reduced team friction by improving maintainability, simplifying decisions, and accelerating delivery velocity',
]
const VINCLE_ACHIEVEMENTS = [
  'Led the migration of a legacy CRM/SFA to Spring Boot and Angular, improving maintainability and enabling future evolution',
  'Led a frontend team and participated in architecture decisions across backend, integrations, and business-critical functionality',
]
const UCASE_ACHIEVEMENTS = [
  'Contributed to research published within the UCASE group',
  'Worked on knowledge extraction techniques from complex datasets',
  'Applied Fuzzy Formal Concept Analysis to knowledge representation problems',
  'Explored computational methods for pattern discovery and information structuring',
  'Developed an experimental and evidence-driven approach to technical problem solving',
]
const UCA_ACHIEVEMENTS = [
  'Designed and implemented an internal management application for the University\'s Research Transfer Office',
  'Improved internal operational workflows through custom software development',
  'Contributed to research on mutation testing and formal verification',
  'Combined production software development with academic research activities',
  'Built the foundations of a rigorous engineering approach focused on software quality',
]

test('R5a: real CV classification under Staff — Summa and knowmad Core, VINCLE Supporting, UCAD Historical', () => {
  assert.equal(experienceContribution(SUMMA_ACHIEVEMENTS, STAFF_VOCAB), 'Core')
  assert.equal(experienceContribution(KNOWMAD_ACHIEVEMENTS, STAFF_VOCAB), 'Core')
  assert.equal(experienceContribution(VINCLE_ACHIEVEMENTS, STAFF_VOCAB), 'Supporting')
  assert.equal(experienceContribution(UCASE_ACHIEVEMENTS, STAFF_VOCAB), 'Historical')
  assert.equal(experienceContribution(UCA_ACHIEVEMENTS, STAFF_VOCAB), 'Historical')
})

test('R5a: contribution derives from relevance to the decision, never age', () => {
  const oldRelevant = ['Architected distributed systems and led a team of engineers']
  const recentIrrelevant = ['Answered tickets and fixed reported bugs in a legacy codebase']
  assert.equal(experienceContribution(oldRelevant, STAFF_VOCAB), 'Core')
  assert.equal(experienceContribution(recentIrrelevant, STAFF_VOCAB), 'Historical')
})

test('R5a: the same experience is Core for one decision and Historical for another', () => {
  const systems = ['Trabajó con arquitecturas distribuidas y microservicios en sistemas de producción']
  assert.equal(experienceContribution(systems, STAFF_VOCAB), 'Core')
  assert.equal(experienceContribution(systems, ['Developer Productivity']), 'Historical')
})

test('R5a: contribution is metadata — the projection renders the same CV it did before', () => {
  const p: Profile = {
    ...makeProfile(),
    preferences: { interests: STAFF_VOCAB },
  }
  const withMeta = cvProjector(p)
  const contributions = withMeta.experiences.map(e => e.contribution)
  assert.ok(contributions.every(c => c === 'Core' || c === 'Supporting' || c === 'Historical'))
  assert.equal(withMeta.experiences.length, makeProfile().experiences.length)
})

// R5b — contribution-aware budget. Selection of the survivor is still R2→R3;
// the allowance is what changes. The Profile stays canonical; the projection
// adapts, and the adaptation is reversible when the decision changes.

test('R5b: the same experience recovers its budget when another decision makes it Core (reversible projection)', () => {
  const p = makeProfile()
  const research = ['Architected a research platform for distributed analysis']
  const chores = Array.from({ length: 6 }, (_, i) => 'Managed tickets ' + i)
  const subject: Profile = { ...p, experiences: [{ ...p.experiences[0]!, achievements: [...research, ...chores] }] }
  const staff = cvProjector(subject, { targetRole: 'Staff Software Engineer' }).experiences[0]!.achievements.length
  const productivity = cvProjector(subject, { targetRole: 'Staff Software Engineer', emphasize: ['Developer Productivity'] }).experiences[0]!.achievements.length
  assert.equal(staff, CONTRIBUTION_BUDGET.Core, 'staff context grants the full budget')
  assert.equal(productivity, CONTRIBUTION_BUDGET.Historical, 'a productivity-only decision compresses it')
})

test('R5b: Historical keeps its best-ranked achievement, not the first canonical one', () => {
  const p = makeProfile()
  const achievements = [
    'Handled routine tickets',             // Generic, canonical first
    'Reduced operational costs by 30%',    // Quantified
    'Maintained internal documentation',   // Generic
  ]
  const historical: Profile = { ...p, experiences: [{ ...p.experiences[0]!, achievements }] }
  const bullets = cvProjector(historical).experiences[0]!.achievements
  assert.equal(bullets.length, CONTRIBUTION_BUDGET.Historical)
  assert.equal(bullets[0], achievements[1], 'the quantified outcome wins over the first canonical claim')
})

test('R5b: without a Decision Context the default projection keeps the existing R2→R3 selection (Core keeps the full budget)', () => {
  const p = makeProfile()
  const achievements = ['Architected distributed systems', 'Handled routine tickets', 'Reduced operational costs by 30%', 'Shipped a new service']
  const core: Profile = { ...p, preferences: { interests: STAFF_VOCAB }, experiences: [{ ...p.experiences[0]!, achievements }] }
  const cv = cvProjector(core)
  assert.equal(cv.experiences[0]!.contribution, 'Core')
  assert.equal(cv.experiences[0]!.achievements.length, DEFAULT_CV_BUDGET.maxBulletsPerExperience)
  assert.equal(cv.experiences[0]!.achievements[0], achievements[0], 'the ranking itself is untouched')
})

test('R5b: the budget never changes content — survivors are a subset of the canonical history', () => {
  const p = makeProfile()
  const achievements = [
    'Handled routine tickets',
    'Reduced operational costs by 30%',
    'Maintained internal documentation',
    'Ran nightly backups',
    'Wrote internal tooling',
  ]
  const historical: Profile = { ...p, experiences: [{ ...p.experiences[0]!, achievements }] }
  const bullets = cvProjector(historical).experiences[0]!.achievements
  assert.ok(bullets.every(b => achievements.includes(b)))
})

test('R5b: same context, deterministic output', () => {
  const first = cvProjector(makeProfile(), { targetRole: 'Staff Software Engineer' })
  const second = cvProjector(makeProfile(), { targetRole: 'Staff Software Engineer' })
  assert.deepEqual(second, first)
})

// R6 — contribution-aware project selection. Projects are optional evidence:
// a Historical project is omitted (no trajectory continuity), Core and
// Supporting stay. Same taxonomy as R5; the classifier just reads project
// signals. No budget, no ordering, no dedup against experiences.

const MUTATION_PROJECTS = [
  { id: 'proj-m1', name: 'Autoseed — Mutation-based Test Generation', description: 'Research project focused on improving software reliability through automated test generation techniques. Developed mutation-based approaches to generate and optimize test suites for service-oriented architectures.', technologies: [], capabilityIds: [], evidenceIds: [] },
  { id: 'proj-m2', name: 'WS-BPEL Mutation Operators', description: 'Research project exploring mutation testing strategies to improve test coverage and fault detection in WS-BPEL 2.0 systems. Designed new mutation operators to evaluate software quality and testing effectiveness.', technologies: [], capabilityIds: [], evidenceIds: [] },
]

const TESTING_VOCAB = ['Software Testing', 'Formal Verification', 'Mutation Testing']

test('R6: real projects are Historical under Staff and omitted from the projection (acceptance)', () => {
  const p: Profile = { ...makeProfile(), identity: { ...makeProfile().identity, projectIds: MUTATION_PROJECTS.map(x => x.id) }, projects: MUTATION_PROJECTS, preferences: { interests: STAFF_VOCAB } }
  const cv = cvProjector(p, { targetRole: 'Staff Software Engineer' })
  assert.equal(cv.projects.length, 0)
  assert.equal(cv.projectionMetadata.omittedProjects.length, 2)
  assert.ok(cv.projectionMetadata.omittedProjects.every(o => o.contribution === 'Historical'))
  assert.equal(projectContribution(MUTATION_PROJECTS[0]!.name, MUTATION_PROJECTS[0]!.description, [], STAFF_VOCAB), 'Historical')
  assert.equal(projectContribution(MUTATION_PROJECTS[1]!.name, MUTATION_PROJECTS[1]!.description, [], STAFF_VOCAB), 'Historical')
})

test('R6: the same projects reappear under a testing/formal-methods decision (reversibility)', () => {
  const p: Profile = { ...makeProfile(), identity: { ...makeProfile().identity, projectIds: MUTATION_PROJECTS.map(x => x.id) }, projects: MUTATION_PROJECTS, preferences: { interests: STAFF_VOCAB } }
  const cv = cvProjector(p, { targetRole: 'Staff Software Engineer', emphasize: TESTING_VOCAB })
  assert.equal(cv.projects.length, 2)
  assert.equal(cv.projectionMetadata.omittedProjects.length, 0)
  assert.ok(cv.projects.every(x => x.contribution === 'Core'))
  assert.equal(projectContribution(MUTATION_PROJECTS[0]!.name, MUTATION_PROJECTS[0]!.description, [], TESTING_VOCAB), 'Core')
  assert.equal(projectContribution(MUTATION_PROJECTS[1]!.name, MUTATION_PROJECTS[1]!.description, [], TESTING_VOCAB), 'Core')
})

test('R6: without a Historical project the default projection keeps legacy behavior', () => {
  const cv = cvProjector(makeProfile())
  assert.equal(cv.projects.length, 1)
  assert.equal(cv.projects[0]!.contribution, 'Supporting')
  assert.equal(cv.projectionMetadata.omittedProjects.length, 0)
})

test('R6: project selection never alters the experience pipeline', () => {
  const base = { ...makeProfile(), preferences: { interests: STAFF_VOCAB } }
  const withProjects: Profile = { ...base, identity: { ...base.identity, projectIds: MUTATION_PROJECTS.map(x => x.id) }, projects: MUTATION_PROJECTS }
  const a = cvProjector(base, { targetRole: 'Staff Software Engineer' })
  const b = cvProjector(withProjects, { targetRole: 'Staff Software Engineer' })
  assert.deepEqual(b.experiences, a.experiences)
})

test('R6: same context, deterministic project selection', () => {
  const p: Profile = { ...makeProfile(), identity: { ...makeProfile().identity, projectIds: MUTATION_PROJECTS.map(x => x.id) }, projects: MUTATION_PROJECTS, preferences: { interests: STAFF_VOCAB } }
  const a = cvProjector(p, { targetRole: 'Staff Software Engineer' })
  const b = cvProjector(p, { targetRole: 'Staff Software Engineer' })
  assert.deepEqual(b, a)
})

test('R6: the projection never mutates the Profile', () => {
  const p: Profile = { ...makeProfile(), identity: { ...makeProfile().identity, projectIds: MUTATION_PROJECTS.map(x => x.id) }, projects: MUTATION_PROJECTS, preferences: { interests: STAFF_VOCAB } }
  const before = JSON.stringify(p.projects)
  cvProjector(p, { targetRole: 'Staff Software Engineer' })
  assert.equal(JSON.stringify(p.projects), before)
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

// R4b — morphological signal equivalence: a summary sentence dies when a bullet
// expresses the same claim in inflected form, and survives when it adds
// material evidence or when the overlap is only ubiquitous tech vocabulary.

test('R4b: an inflected sentence re-expressing a bullet claim is suppressed (acceptance case)', () => {
  const summary = 'La comunicación técnica en entornos de consultoría fue una escuela: alinear decisiones con equipos distintos y asegurar que las soluciones fueran mantenibles por quienes las recibían.'
  const bullets = significantSignals('Aprendió a alinear decisiones técnicas con equipos y culturas de cliente distintas, asegurando mantenibilidad a largo plazo.')
  assert.equal(redundantSummary(summary, bullets), '')
})

test('R4b: morphological variants count as the same signal (asegurar/asegurando, mantenibles/mantenibilidad)', () => {
  const summary = 'Aseguró que las soluciones fueran mantenibles para los equipos de cliente.'
  const bullets = significantSignals('Aprendió a alinear decisiones técnicas, asegurando mantenibilidad a largo plazo.')
  assert.equal(redundantSummary(summary, bullets), '')
})

test('R4b: ubiquitous tech vocabulary alone never triggers suppression', () => {
  const summary = 'Worked with cloud architecture and distributed systems in production.'
  const bullets = significantSignals('Architected scalable systems in the cloud for production workloads.')
  assert.equal(redundantSummary(summary, bullets), summary)
})

test('R4b: a sentence adding material evidence beyond the bullet survives when the overlap is only ubiquitous vocabulary', () => {
  const summary = 'Aprendió a adaptarse rápido a contextos distintos, entender sistemas ajenos y aportar valor en entornos cambiantes.'
  const bullets = significantSignals('Desarrolló capacidad de adaptación rápida a múltiples clientes, contextos y dominios distintos.')
  assert.equal(redundantSummary(summary, bullets), summary)
})

test('R4b: real pipeline context (union of all experience bullets) — a sentence restating a bullet claim across the union dies, unique claims survive', () => {
  const union = [
    'Diseñó servicios backend escalables con Java, Spring Boot, Kafka y MongoDB, mejorando la capacidad del sistema en un 40%',
    'Aprendió a alinear decisiones técnicas con equipos y culturas de cliente distintas, asegurando mantenibilidad a largo plazo',
    'Trabajó con arquitecturas distribuidas, microservicios y cloud (Spring Boot, Kafka, Docker, Kubernetes, Azure) en sistemas de producción reales',
    'Desarrolló capacidad de adaptación rápida a múltiples clientes, contextos y dominios distintos',
  ].flatMap(significantSignals)
  assert.equal(
    redundantSummary('Aprendió a adaptarse rápido a contextos distintos, entender sistemas ajenos y aportar valor en entornos cambiantes.', union),
    ''
  )
  assert.equal(
    redundantSummary('Etapa de crecimiento como ingeniero "todoterreno": pasó de escribir código a entender sistemas completos — APIs, mensajería, bases de datos, despliegues, CI/CD, operación.', union),
    'Etapa de crecimiento como ingeniero "todoterreno": pasó de escribir código a entender sistemas completos — APIs, mensajería, bases de datos, despliegues, CI/CD, operación.'
  )
})

// Contribution projection & fallback tests

test('CVProjector renders Contribution summaries with Outcome when linked contributions exist', () => {
  const p = makeProfile()
  const profileWithContribs: Profile = {
    ...p,
    contributions: [
      {
        id: 'c1',
        experienceRef: 'exp-1',
        summary: 'Designed a Clean Architecture proposal for HSS backend.',
        outcome: { summary: 'Adopted as SMSC architecture foundation.' },
        capabilityIds: [],
        evidenceIds: [],
      },
      {
        id: 'c2',
        experienceRef: 'exp-1',
        summary: 'Drove architecture initiative without explicit outcome.',
        capabilityIds: [],
        evidenceIds: [],
      },
    ],
  }
  const cv = cvProjector(profileWithContribs)
  const exp1 = cv.experiences.find(e => e.organization === 'Summa Networks')!
  assert.ok(exp1)
  assert.ok(exp1.achievements.includes('Designed a Clean Architecture proposal for HSS backend. (Outcome: Adopted as SMSC architecture foundation.)'))
  assert.ok(exp1.achievements.includes('Drove architecture initiative without explicit outcome.'))
})

test('CVProjector falls back to legacy achievements when zero linked Contribution records exist', () => {
  const p = makeProfile()
  const profileWithPartialContribs: Profile = {
    ...p,
    contributions: [
      {
        id: 'c1',
        experienceRef: 'exp-1',
        summary: 'Designed Clean Architecture.',
        capabilityIds: [],
        evidenceIds: [],
      },
    ],
  }
  const cv = cvProjector(profileWithPartialContribs)
  const exp1 = cv.experiences.find(e => e.organization === 'Summa Networks')!
  const exp2 = cv.experiences.find(e => e.organization === 'VINCLE')!
  assert.deepEqual(exp1.achievements, ['Designed Clean Architecture.'])
  assert.deepEqual(exp2.achievements, ['Built a CRM'])
})

test('budget constraints (maxBulletsPerExperience) limit total bullets rendered per experience when projecting contributions', () => {
  const p = makeProfile()
  const manyContribs = Array.from({ length: 6 }, (_, i) => ({
    id: `c-exp1-${i}`,
    experienceRef: 'exp-1',
    summary: `Architected distributed systems component ${i}`,
    capabilityIds: [],
    evidenceIds: [],
  }))
  const profileWithManyContribs: Profile = {
    ...p,
    contributions: manyContribs,
  }
  const cv = cvProjector(profileWithManyContribs)
  const exp1 = cv.experiences.find(e => e.organization === 'Summa Networks')!
  assert.equal(exp1.achievements.length, DEFAULT_CV_BUDGET.maxBulletsPerExperience)
})

test('evaluateContribution classifies H=0 as Historical regardless of Scope', () => {
  const contrib: Contribution = {
    id: 'c1',
    experienceRef: 'exp-1',
    summary: 'Routine maintenance and ticket triaging',
    scope: { level: 'organization', role: 'initiator' },
    capabilityIds: [],
    evidenceIds: [],
  }
  const activeVocab = activatedGroups(['Software Architecture', 'Technical Leadership'])
  const evalResult = evaluateContribution(contrib, activeVocab, new Map())
  assert.equal(evalResult.hits, 0)
  assert.equal(evalResult.semanticClass, 'Historical')
  assert.equal(evalResult.semanticClassRank, 0)
})

test('rankContributions ranks Core over Supporting regardless of Scope', () => {
  const cCoreTeam: Contribution = {
    id: 'c-core',
    experienceRef: 'exp-1',
    summary: 'Architected distributed systems proposal with technical leadership',
    scope: { level: 'team', role: 'contributor' },
    capabilityIds: [],
    evidenceIds: [],
  }
  const cSupportingOrg: Contribution = {
    id: 'c-supp',
    experienceRef: 'exp-1',
    summary: 'Designed architecture proposal',
    scope: { level: 'organization', role: 'initiator' },
    capabilityIds: [],
    evidenceIds: [],
  }
  const vocab = ['Software Architecture', 'Technical Leadership']
  const ranked = rankContributions([cSupportingOrg, cCoreTeam], vocab, [])
  assert.equal(ranked[0]!.contribution.id, 'c-core')
  assert.equal(ranked[1]!.contribution.id, 'c-supp')
})

test('rankContributions ranks higher Scope level and Role when semantic class and H are equal', () => {
  const cOrgInitiator: Contribution = {
    id: 'c-org-init',
    experienceRef: 'exp-1',
    summary: 'Architected distributed systems with technical leadership',
    scope: { level: 'organization', role: 'initiator' },
    capabilityIds: [],
    evidenceIds: [],
  }
  const cTeamContrib: Contribution = {
    id: 'c-team-contrib',
    experienceRef: 'exp-1',
    summary: 'Architected distributed systems with technical leadership',
    scope: { level: 'team', role: 'contributor' },
    capabilityIds: [],
    evidenceIds: [],
  }
  const vocab = ['Software Architecture', 'Technical Leadership']
  const ranked = rankContributions([cTeamContrib, cOrgInitiator], vocab, [])
  assert.equal(ranked[0]!.contribution.id, 'c-org-init')
  assert.equal(ranked[1]!.contribution.id, 'c-team-contrib')
})

test('evaluateContribution resolves capabilityIds to Capability names for semantic matching', () => {
  const cap: Capability = {
    id: 'cap-arch',
    name: 'Software Architecture',
    evidenceIds: [],
  }
  const contrib: Contribution = {
    id: 'c-cap',
    experienceRef: 'exp-1',
    summary: 'Routine task execution',
    capabilityIds: ['cap-arch'],
    evidenceIds: [],
  }
  const activeVocab = activatedGroups(['Software Architecture'])
  const capabilitiesMap = new Map([['cap-arch', cap]])
  const evalResult = evaluateContribution(contrib, activeVocab, capabilitiesMap)
  assert.equal(evalResult.hits, 1)
  assert.equal(evalResult.semanticClass, 'Supporting')
})

test('derives experience contribution level from maximum contribution rank before budget cap and excludes Historical contributions', () => {
  const p = makeProfile()
  const profileWithContribs: Profile = {
    ...p,
    preferences: {
      interests: ['Software Architecture', 'Technical Leadership'],
    },
    contributions: [
      {
        id: 'c1',
        experienceRef: 'exp-1',
        summary: 'Architected distributed systems proposal with technical leadership',
        capabilityIds: [],
        evidenceIds: [],
      },
      {
        id: 'c2',
        experienceRef: 'exp-1',
        summary: 'Designed architecture proposal',
        capabilityIds: [],
        evidenceIds: [],
      },
      {
        id: 'c3',
        experienceRef: 'exp-1',
        summary: 'Routine ticket triaging',
        capabilityIds: [],
        evidenceIds: [],
      },
    ],
  }
  const cv = cvProjector(profileWithContribs)
  const exp1 = cv.experiences.find(e => e.organization === 'Summa Networks')!
  assert.equal(exp1.contribution, 'Core')
  assert.equal(exp1.achievements.length, 2)
  assert.ok(exp1.achievements.includes('Architected distributed systems proposal with technical leadership'))
  assert.ok(exp1.achievements.includes('Designed architecture proposal'))
  assert.ok(!exp1.achievements.some(a => a.includes('Routine ticket triaging')))
})

test('terminal formatting occurs only AFTER selection and budgeting', () => {
  const p = makeProfile()
  const profileWithContribs: Profile = {
    ...p,
    preferences: {
      interests: ['Software Architecture', 'Technical Leadership'],
    },
    contributions: [
      {
        id: 'c1',
        experienceRef: 'exp-1',
        summary: 'Architected distributed systems proposal with technical leadership',
        outcome: { summary: 'Adopted across all teams' },
        capabilityIds: [],
        evidenceIds: [],
      },
    ],
  }
  const cv = cvProjector(profileWithContribs)
  const exp1 = cv.experiences.find(e => e.organization === 'Summa Networks')!
  assert.equal(exp1.achievements[0], 'Architected distributed systems proposal with technical leadership (Outcome: Adopted across all teams)')
})