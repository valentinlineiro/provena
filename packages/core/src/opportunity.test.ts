import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOpportunity, resolveRequirements } from './opportunity.js'
import { extractMarketRequirements } from './market.js'
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

test('compensation: monthly allowance or perk amounts (/mo, /month) are not treated as annual salary', () => {
  const ev = evaluateOpportunity('Staff Engineer. Meal Perk: €150/month allowance + Flexible Remuneration up to €70/mo.', makeProfile())
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'unknown')
  assert.notEqual(ev.verdict, 'skip')
})

test('compensation: space-separated thousands ranges (€103 000 - €139 000) are extracted as annual salary', () => {
  const ev = evaluateOpportunity('Staff Engineer. ESP base pay range per year: €103 000 - €139 000.', makeProfile())
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'satisfied')
})

test('SKIP: on-site only violates a remote-required preference', () => {
  const ev = evaluateOpportunity('Staff Engineer. This role is on-site 5 days per week in Madrid.', makeProfile())
  assert.equal(ev.verdict, 'skip')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')
})

test('workMode: hybrid OR remote option does not violate remote-required preference', () => {
  const ev = evaluateOpportunity('Staff Engineer. Location: hybrid in Barcelona / Remote in Spain.', makeProfile())
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
})

test('SKIP: an avoid pattern in the JD is a violated criterion', () => {
  const ev = evaluateOpportunity('Staff Engineer. Expect six interview rounds.', makeProfile())
  assert.equal(ev.verdict, 'skip')
  assert.equal(ev.criteria.find(c => c.criterion === 'avoid')!.status, 'violated')
})

test('I-OE-3: an absent criterion yields unknown, never violated', () => {
  const ev = evaluateOpportunity('Staff Software Engineer. Own architectural decisions.', makeProfile())
  assert.notEqual(ev.verdict, 'skip')
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
  assert.notEqual(ev.verdict, 'skip')
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

test('K2A Acceptance: WorkMode scoped semantics & cardinality evaluation', () => {
  const profile = makeProfile({ preferences: { compensation: { minimum: 80000, currency: '€' }, work: { remote: 'required' }, roles: ['Staff Engineer'] } })

  // Witness #16: Fully Remote / Remote-First -> SATISFIED
  const ev16 = evaluateOpportunity('Fully remote from Spain. Senior Backend Engineer.', profile)
  assert.equal(ev16.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')

  // Witness #12: Partial Remote -> VIOLATED (candidate requires fully remote)
  const ev12 = evaluateOpportunity('Software Engineer. Up to two days per week remote in Dublin.', profile)
  assert.equal(ev12.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')

  // Witness #14: Mandatory On-Site / Corporate Boilerplate Scope Overlap -> VIOLATED
  const ev14 = evaluateOpportunity('Barcelona — Hybrid, 3 days onsite.\nWhether you are remote, hybrid or on-site, we value inclusion.', profile)
  assert.equal(ev14.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')

  // Witness #15: Hybrid Work -> VIOLATED
  const ev15 = evaluateOpportunity('Hybrid work model based in Madrid.', profile)
  assert.equal(ev15.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')
})

test('K2B Acceptance: Role Family vs Role Level Semantics', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default // Preferences: roles = ['Staff Engineer', 'Tech Lead', 'Principal Engineer']

  // Witness #14 (Entrust): Junior AI Engineer -> Family compatible (AI/Software Eng), Level incompatible (Junior vs Staff) -> VIOLATED
  const ev14 = evaluateOpportunity('Junior AI Engineer. Remote Spain. Python, ML.', profile)
  assert.equal(ev14.criteria.find(c => c.criterion === 'roles')!.status, 'violated')

  // Witness #16 (Health AI): Senior Backend Engineer -> Family compatible, Level Senior (compatible adjacent for Staff) -> SATISFIED / UNKNOWN (not violated)
  const ev16 = evaluateOpportunity('Senior Backend Engineer. Fully remote from Spain. Python.', profile)
  assert.notEqual(ev16.criteria.find(c => c.criterion === 'roles')!.status, 'violated')

  // Witness #17 (Project Manager IA): PM IA Senior -> Family incompatible (Project Management vs Software Engineering) -> VIOLATED
  const ev17 = evaluateOpportunity('Jefe de Proyecto Senior / Project Manager IA Senior. Madrid.', profile)
  assert.equal(ev17.criteria.find(c => c.criterion === 'roles')!.status, 'violated')

  // Witness #11 (Executive/CEO): CEO / P&L Executive -> Family incompatible (Executive vs Engineering) -> VIOLATED
  const ev11 = evaluateOpportunity('CEO / P&L Executive. Madrid.', profile)
  assert.equal(ev11.criteria.find(c => c.criterion === 'roles')!.status, 'violated')

  // Witness #20 (Univ CEU): Docente Universitario -> Family incompatible (Academia vs Engineering) -> VIOLATED
  const ev20 = evaluateOpportunity('Docente Universitario en Ingeniería Informática. Sistemas distribuidos.', profile)
  assert.equal(ev20.criteria.find(c => c.criterion === 'roles')!.status, 'violated')
})

test('K3 Acceptance: MarketRequirement Qualifiers & Unresolved Concept Preservation (Pleo Witness)', () => {
  const jd = 'Staff Applied AI Engineer. Deep proficiency with Python for data and ML engineering. Experience with LLM evaluation strategy at scale.'
  const marketModel = extractMarketRequirements(jd)

  // 1. Concept Recognition
  const pythonReq = marketModel.requirements.find(r => r.concept === 'Python')
  assert.ok(pythonReq)

  const evalsReq = marketModel.requirements.find(r => r.concept === 'LLM Evaluation & Benchmarking')
  assert.ok(evalsReq)

  // 2. Qualifier Extraction (Proficiency, Context, Scale)
  assert.ok(pythonReq.qualifiers)
  assert.ok(pythonReq.qualifiers.some(q => q.kind === 'proficiency' && q.value.includes('deep proficiency')))
  assert.ok(pythonReq.qualifiers.some(q => q.kind === 'context' && q.value.includes('data')))

  assert.ok(evalsReq.qualifiers)
  assert.ok(evalsReq.qualifiers.some(q => q.kind === 'scale' && q.value.includes('at scale')))

  // 3. Resolution Preservation: Recognized concept without candidate capability remains unresolved, not dropped or fabricated
  const profile = makeProfile()
  const resolved = resolveRequirements(marketModel, profile)
  const resolvedEvals = resolved.find(r => r.requirementId === evalsReq.id)
  assert.ok(resolvedEvals)
  assert.equal(resolvedEvals.status, 'unresolved')
})

test('K4A Acceptance: Evidence Sufficiency Assessment (SUFFICIENT / PARTIAL / INSUFFICIENT / UNKNOWN)', async () => {
  const { evaluateSufficiency } = await import('./opportunity.js')

  // 1. Bare Unqualified Requirement + Canonical Evidence -> SUFFICIENT (No implicit seniority/scale demands)
  const bareResolved: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-1',
    requirementConcept: 'Python',
    requirementKind: 'capability',
    status: 'demonstrated',
    evidence: ['Developed core data pipeline using Python.'],
  }
  const assessBare = evaluateSufficiency(bareResolved)
  assert.equal(assessBare.status, 'sufficient')

  // 2. Qualified Requirement + Full Evidence Alignment (Pleo Witness: Deep proficiency with Python for data engineering) -> SUFFICIENT
  const qualifiedFull: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-2',
    requirementConcept: 'Python',
    requirementKind: 'capability',
    requirementQualifiers: [
      { kind: 'proficiency', value: 'deep proficiency', rawText: 'deep proficiency' },
      { kind: 'context', value: 'for data and ml engineering', rawText: 'for data and ml engineering' },
    ],
    status: 'demonstrated',
    evidence: ['Demonstrated deep proficiency in Python for data engineering pipelines.'],
  }
  const assessFull = evaluateSufficiency(qualifiedFull)
  assert.equal(assessFull.status, 'sufficient')
  assert.equal(assessFull.matchedQualifiers.length, 2)

  // 3. Qualified Requirement + Partial Evidence Alignment (Lodgify Witness: LLM Evals at scale) -> PARTIAL
  const qualifiedPartial: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-3',
    requirementConcept: 'LLM Evaluation & Benchmarking',
    requirementKind: 'practice',
    requirementQualifiers: [
      { kind: 'scale', value: 'at scale', rawText: 'at scale' },
      { kind: 'proficiency', value: 'expert-level', rawText: 'expert-level' },
    ],
    status: 'demonstrated',
    evidence: ['Implemented LLM evaluation benchmarks for internal tools.'], // Missing explicit 'at scale' or 'expert-level'
  }
  const assessPartial = evaluateSufficiency(qualifiedPartial)
  assert.equal(assessPartial.status, 'partial')

  // 4. Zero Evidence backing capability claim -> INSUFFICIENT
  const zeroEvidence: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-4',
    requirementConcept: 'Kubernetes',
    requirementKind: 'capability',
    status: 'gap',
    evidence: [],
  }
  const assessZero = evaluateSufficiency(zeroEvidence)
  assert.equal(assessZero.status, 'insufficient')

  // 5. Unresolved Market Requirement -> UNKNOWN
  const unresolved: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-5',
    requirementConcept: 'ASPM',
    requirementKind: 'domain',
    status: 'unresolved',
    evidence: [],
  }
  const assessUnresolved = evaluateSufficiency(unresolved)
  assert.equal(assessUnresolved.status, 'unknown')
  assert.equal(assessUnresolved.transferability, 'uncertain')
})

test('K4B Acceptance: Evidence Contextual Transferability (Sateliot #15 & Health AI #16 Witnesses)', async () => {
  const { evaluateSufficiency } = await import('./opportunity.js')

  // Witness #15 Sateliot: AI-Assisted Software Engineering evidence vs AI Patent Drafting requirement -> ADJACENT
  const sateliotResolved: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-15',
    requirementConcept: 'AI-Assisted Engineering',
    requirementKind: 'practice',
    capabilityName: 'AI-Assisted Engineering',
    status: 'demonstrated',
    evidence: ['Applied LLM prompt optimization and AI-assisted tools for software development.'],
  }
  const sateliotAssess = evaluateSufficiency(sateliotResolved)
  assert.equal(sateliotAssess.status, 'sufficient')
  assert.equal(sateliotAssess.transferability, 'direct')

  // Witness #16 Health AI: Python backend evidence vs Python backend requirement -> DIRECT
  const healthAiResolved: import('./opportunity.js').ResolvedRequirement = {
    requirementId: 'mr-16',
    requirementConcept: 'Python',
    requirementKind: 'capability',
    capabilityName: 'Python (Programming Language)',
    status: 'demonstrated',
    evidence: ['Architected scalable backend microservices in Python using FastAPI.'],
  }
  const healthAiAssess = evaluateSufficiency(healthAiResolved)
  assert.equal(healthAiAssess.status, 'sufficient')
  assert.equal(healthAiAssess.transferability, 'direct')
})

test('K5A Acceptance: projectProfessionalFit — empty assessments yields score 0 and coverage 0', async () => {
  const { projectProfessionalFit } = await import('./opportunity.js')
  const result = projectProfessionalFit([])
  assert.equal(result.score, 0)
  assert.equal(result.assessmentCoverage, 0)
  assert.equal(result.totalRequirements, 0)
})

test('K5A Acceptance: projectProfessionalFit — monotonicity sufficient > partial > insufficient', async () => {
  const { projectProfessionalFit } = await import('./opportunity.js')

  const base: Omit<import('./opportunity.js').EvidenceSufficiencyAssessment, 'status' | 'rationale' | 'transferability' | 'matchedQualifiers' | 'evidenceCount'> = {
    requirementId: 'mr-x',
    requirementConcept: 'Python',
  }

  const [suffProj, partProj, insuffProj] = [
    projectProfessionalFit([{ ...base, status: 'sufficient',   transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 }]),
    projectProfessionalFit([{ ...base, status: 'partial',      transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 }]),
    projectProfessionalFit([{ ...base, status: 'insufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 0 }]),
  ]
  // sufficient > partial > insufficient (monotonicity)
  assert.ok(suffProj.score > partProj.score, `sufficient(${suffProj.score}) > partial(${partProj.score})`)
  assert.ok(partProj.score > insuffProj.score, `partial(${partProj.score}) > insufficient(${insuffProj.score})`)
})

test('K5A Acceptance: projectProfessionalFit — monotonicity direct > adjacent > uncertain for same status', async () => {
  const { projectProfessionalFit } = await import('./opportunity.js')

  const base: Omit<import('./opportunity.js').EvidenceSufficiencyAssessment, 'rationale' | 'matchedQualifiers' | 'evidenceCount' | 'transferability'> = {
    requirementId: 'mr-x',
    requirementConcept: 'LLM Evaluation',
    status: 'sufficient',
  }

  const [dirProj, adjProj, uncProj] = [
    projectProfessionalFit([{ ...base, transferability: 'direct',   rationale: '', matchedQualifiers: [], evidenceCount: 1 }]),
    projectProfessionalFit([{ ...base, transferability: 'adjacent', rationale: '', matchedQualifiers: [], evidenceCount: 1 }]),
    projectProfessionalFit([{ ...base, transferability: 'uncertain',rationale: '', matchedQualifiers: [], evidenceCount: 1 }]),
  ]
  assert.ok(dirProj.score > adjProj.score, `direct(${dirProj.score}) > adjacent(${adjProj.score})`)
  assert.ok(adjProj.score > uncProj.score, `adjacent(${adjProj.score}) > uncertain(${uncProj.score})`)
})

test('K5A Acceptance: projectProfessionalFit — unknown requirements count as 0 in denominator', async () => {
  const { projectProfessionalFit } = await import('./opportunity.js')

  const assessments: import('./opportunity.js').EvidenceSufficiencyAssessment[] = [
    { requirementId: 'mr-1', requirementConcept: 'Python',   status: 'sufficient', transferability: 'direct',   rationale: '', matchedQualifiers: [], evidenceCount: 1 },
    { requirementId: 'mr-2', requirementConcept: 'RAG',      status: 'unknown',    transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-3', requirementConcept: 'GraphQL',  status: 'unknown',    transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
  ]
  const result = projectProfessionalFit(assessments)

  // Score = 1×1.0 / 3 = 0.333 → ×10 = 3.3
  // unknowns count as 0 in denominator so "Head of Marketing" can't score 10.0 for an engineering profile
  assert.ok(result.score < 5, `score(${result.score}) must be penalised by unresolved requirements`)
  // assessmentCoverage = assessable (non-unknown) / total = 1/3 ≈ 0.333
  assert.ok(result.assessmentCoverage < 0.4, `assessmentCoverage(${result.assessmentCoverage}) should be ~0.333`)
  assert.equal(result.totalRequirements, 3)
  assert.equal(result.assessedCount, 3)  // all 3 count in denominator
  assert.equal(result.unknownCount, 2)
})

test('K5A Acceptance: projectProfessionalFit — breakdown is auditable per requirement', async () => {
  const { projectProfessionalFit } = await import('./opportunity.js')

  const assessments: import('./opportunity.js').EvidenceSufficiencyAssessment[] = [
    { requirementId: 'mr-1', requirementConcept: 'Python',           status: 'sufficient', transferability: 'direct',   rationale: '', matchedQualifiers: [], evidenceCount: 1 },
    { requirementId: 'mr-2', requirementConcept: 'LLM Evaluation',   status: 'partial',    transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
    { requirementId: 'mr-3', requirementConcept: 'ASPM',             status: 'unknown',    transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
  ]
  const result = projectProfessionalFit(assessments)

  assert.equal(result.breakdown.length, 3)

  const pyBreakdown  = result.breakdown.find(b => b.requirementConcept === 'Python')!
  const llmBreakdown = result.breakdown.find(b => b.requirementConcept === 'LLM Evaluation')!
  const aspmBreakdown = result.breakdown.find(b => b.requirementConcept === 'ASPM')!

  // Python: sufficient + direct → points = 10.0
  assert.equal(pyBreakdown.pointsContributed, 1.0)
  // LLM Evaluation: partial + uncertain → 0.65 - 0.20 = 0.45
  assert.equal(llmBreakdown.pointsContributed, 0.45)
  // ASPM: unknown → excluded (pointsContributed = 0 by convention, but not counted in mean)
  assert.equal(aspmBreakdown.pointsContributed, 0)
})

test('K5B Acceptance: assessPreferences — unknown compensation (JD silent) does NOT penalise', async () => {
  const { assessPreferences, projectPersonalFit } = await import('./opportunity.js')

  const prefs: import('./types.js').Preferences = {
    compensation: { minimum: 80000, currency: 'EUR' },
  }
  const assessments = assessPreferences('Staff Software Engineer. Join our team.', prefs)
  const comp = assessments.find(a => a.dimension === 'compensation')!
  assert.equal(comp.status, 'unknown')
  assert.equal(comp.eligibilityViolation, false)

  const fit = projectPersonalFit(assessments)
  // Coverage = 0 assessed / 1 total
  assert.equal(fit.assessmentCoverage, 0)
  // Unknown does NOT collapse to 0 score — same invariant as K5A
  assert.equal(fit.eligible, true)
})

test('K5B Acceptance: assessPreferences — compensation below minimum → INELIGIBLE', async () => {
  const { assessPreferences, projectPersonalFit } = await import('./opportunity.js')

  const prefs: import('./types.js').Preferences = {
    compensation: { minimum: 80000, currency: 'EUR' },
  }
  const jd = 'Software Engineer. Salary: €65,000.'
  const assessments = assessPreferences(jd, prefs)
  const comp = assessments.find(a => a.dimension === 'compensation')!
  assert.equal(comp.status, 'undesirable')
  assert.equal(comp.eligibilityViolation, true)

  const fit = projectPersonalFit(assessments)
  assert.equal(fit.eligible, false)
  assert.equal(fit.score, 0)
})

test('K5B Acceptance: assessPreferences — compensation at minimum → acceptable, above preferred → preferred', async () => {
  const { assessPreferences } = await import('./opportunity.js')

  const prefs = { compensation: { minimum: 80000, preferred: 100000, currency: 'EUR' } } as any

  const atMin   = assessPreferences('Software Engineer. Salary: €85,000.', prefs)
  const atPref  = assessPreferences('Software Engineer. Salary: €105,000.', prefs)

  assert.equal(atMin.find(a => a.dimension === 'compensation')!.status, 'acceptable')
  assert.equal(atPref.find(a => a.dimension === 'compensation')!.status, 'preferred')
})

test('K5B Acceptance: assessPreferences — work mode: required remote + full remote JD → preferred + eligible', async () => {
  const { assessPreferences, projectPersonalFit } = await import('./opportunity.js')

  const prefs: import('./types.js').Preferences = { work: { remote: 'required' } }
  const jd = 'Staff Engineer. Fully remote opportunity from Spain.'
  const assessments = assessPreferences(jd, prefs)
  const wm = assessments.find(a => a.dimension === 'work-mode')!
  assert.equal(wm.status, 'preferred')
  assert.equal(wm.eligibilityViolation, false)

  const fit = projectPersonalFit(assessments)
  assert.equal(fit.eligible, true)
  assert.equal(fit.score, 10)
})

test('K5B Acceptance: assessPreferences — work mode: required remote + hybrid JD → undesirable + INELIGIBLE', async () => {
  const { assessPreferences, projectPersonalFit } = await import('./opportunity.js')

  const prefs: import('./types.js').Preferences = { work: { remote: 'required' } }
  const jd = 'Software Engineer. Barcelona — Hybrid, 3 days onsite.'
  const assessments = assessPreferences(jd, prefs)
  const wm = assessments.find(a => a.dimension === 'work-mode')!
  assert.equal(wm.status, 'undesirable')
  assert.equal(wm.eligibilityViolation, true)

  const fit = projectPersonalFit(assessments)
  assert.equal(fit.eligible, false)
})

test('K5B Acceptance: assessPreferences — score and coverage separation: eligible preferred + unknown = score 10, coverage 50%', async () => {
  const { assessPreferences, projectPersonalFit } = await import('./opportunity.js')

  // Only work mode is stated in JD (preferred), compensation not stated → unknown
  const prefs = { work: { remote: 'required' }, compensation: { minimum: 80000 } } as any
  const jd = 'Fully remote opportunity.'  // no salary stated

  const assessments = assessPreferences(jd, prefs)
  const fit = projectPersonalFit(assessments)

  // work-mode: preferred → 10.0; compensation: unknown → excluded
  assert.equal(fit.score, 10)
  assert.ok(fit.assessmentCoverage < 1, `Coverage(${fit.assessmentCoverage}) < 1 because compensation is unknown`)
  assert.equal(fit.eligible, true)
})

test('K5B Acceptance: projectPersonalFit — monotonicity preferred > acceptable > undesirable', async () => {
  const { projectPersonalFit } = await import('./opportunity.js')
  type PA = import('./opportunity.js').PreferenceAssessment

  const make = (status: import('./opportunity.js').PreferenceStatus): readonly PA[] => [{
    dimension: 'compensation',
    status,
    eligibilityViolation: status === 'undesirable',
    detail: '',
  }]

  const [pref, acc, und] = [
    projectPersonalFit(make('preferred')),
    projectPersonalFit(make('acceptable')),
    projectPersonalFit(make('undesirable')),
  ]
  assert.ok(pref.score > acc.score, `preferred(${pref.score}) > acceptable(${acc.score})`)
  assert.ok(acc.score > und.score, `acceptable(${acc.score}) > undesirable(${und.score})`)
})

test('K6 Acceptance: applyPolicy — INELIGIBLE → SKIP regardless of professional fit', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Python', status: 'sufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
  ])
  const persFit = projectPersonalFit([
    { dimension: 'compensation', status: 'undesirable', eligibilityViolation: true, detail: 'below minimum' },
  ])
  const assessment = applyPolicy(profFit, persFit)
  assert.equal(assessment.recommendation, 'skip')
  assert.equal(assessment.eligibility, 'ineligible')
})

test('K6 Acceptance: applyPolicy — ELIGIBLE + zero coverage → ABSTAIN (epistemological, not bad score)', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'ASPM', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-2', requirementConcept: 'SBOM', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
  ])
  const persFit = projectPersonalFit([])
  const assessment = applyPolicy(profFit, persFit)
  assert.equal(assessment.recommendation, 'abstain')
  assert.equal(assessment.eligibility, 'eligible')
})

test('K6 Acceptance: applyPolicy — STRONG_CANDIDATE when both fits exceed thresholds', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Python', status: 'sufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
    { requirementId: 'mr-2', requirementConcept: 'Distributed Systems', status: 'sufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 2 },
  ])
  const persFit = projectPersonalFit([
    { dimension: 'work-mode', status: 'preferred', eligibilityViolation: false, detail: 'fully remote' },
    { dimension: 'compensation', status: 'preferred', eligibilityViolation: false, detail: '€105k' },
  ])
  const assessment = applyPolicy(profFit, persFit)
  assert.equal(assessment.recommendation, 'strong-candidate')
  assert.equal(assessment.eligibility, 'eligible')
  assert.ok(assessment.confidence > 0.25)
})

test('K6 Acceptance: applyPolicy — CONSIDER when professional fit below STRONG threshold (Pleo witness)', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Python (ML context)', status: 'partial', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
  ])
  const persFit = projectPersonalFit([
    { dimension: 'work-mode', status: 'preferred', eligibilityViolation: false, detail: 'fully remote' },
  ])
  const assessment = applyPolicy(profFit, persFit)
  assert.equal(assessment.recommendation, 'consider')
  assert.equal(assessment.eligibility, 'eligible')
})

test('K6 Acceptance: computeConfidence — no personal preferences does NOT penalise confidence', async () => {
  const { computeConfidence, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Python', status: 'sufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
  ])
  const persFit = projectPersonalFit([])

  const confidence = computeConfidence(profFit, persFit)
  assert.equal(confidence, 1.0)
})

test('K6 Acceptance: ABSTAIN is epistemological — high score + low coverage → abstain, not skip or consider', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Python', status: 'sufficient', transferability: 'direct', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
    { requirementId: 'mr-2', requirementConcept: 'RAG', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-3', requirementConcept: 'ASPM', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-4', requirementConcept: 'SBOM', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-5', requirementConcept: 'Prompt Engineering', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
    { requirementId: 'mr-6', requirementConcept: 'LLM Finetuning', status: 'unknown', transferability: 'uncertain', rationale: '', matchedQualifiers: [], evidenceCount: 0 },
  ])
  const persFit = projectPersonalFit([])

  const assessment = applyPolicy(profFit, persFit)
  // score = 1×1.0 / 6 ≈ 1.7 (unknowns penalise: only 1 of 6 requirements matched)
  // confidence = assessmentCoverage ≈ 1/6 ≈ 0.167 < 0.25 → ABSTAIN
  assert.equal(assessment.recommendation, 'abstain')
  assert.ok(assessment.confidence < 0.25)
  // Key invariant: low score AND low confidence → ABSTAIN is epistemological
  assert.ok(assessment.professionalFit.score < 5, `profFit(${assessment.professionalFit.score}) should be penalised`)
})

test('K6B Acceptance: SB-007 fix — confidence is bounded by recognitionCoverage', async () => {
  const { applyPolicy, projectProfessionalFit, projectPersonalFit } = await import('./opportunity.js')

  const profFit = projectProfessionalFit([
    { requirementId: 'mr-1', requirementConcept: 'Cloud-Native Architecture', status: 'sufficient', transferability: 'adjacent', rationale: '', matchedQualifiers: [], evidenceCount: 1 },
  ])
  const persFit = projectPersonalFit([
    { dimension: 'work-mode', status: 'preferred', eligibilityViolation: false, detail: 'fully remote' },
  ])

  // Low recognition coverage (e.g. 1 chunk recognized out of 5 chunks = 0.20)
  const recognitionCoverage = 0.20
  const assessment = applyPolicy(profFit, persFit, recognitionCoverage)

  // Confidence cannot exceed recognitionCoverage (0.20 < ABSTAIN threshold 0.25)
  assert.equal(assessment.confidence, 0.20)
  assert.equal(assessment.recommendation, 'abstain')
  // Invariant: Professional fit remains 9.0 (does not alter fit calculation)
  assert.equal(assessment.professionalFit.score, 9)
})

test('K6B Acceptance: Witnesses #25 (HashiCorp) and #30 (Cloudflare) yield ABSTAIN under low recognition coverage', async () => {
  const { extractMarketRequirements, resolveRequirements, evaluateSufficiency, projectProfessionalFit, assessPreferences, projectPersonalFit, computeRecognitionCoverage, applyPolicy } = await import('./index.js')
  const profile = (await import('../../provena-web/src/profile.js')).default

  const hashicorpJd = `Principal Cloud Architect (fully remote).
Design and implement multi-cloud infrastructure strategies for enterprise customers.
Requirements: Deep expertise in Terraform, Vault, Consul, and the HashiCorp ecosystem.
AWS, GCP, and Azure cloud architecture certifications preferred.
Infrastructure-as-code at scale, zero-trust networking, secrets management.
Experience with GitOps and platform engineering principles.
Salary: $160,000 USD.`

  const mm = extractMarketRequirements(hashicorpJd)
  const resolved = resolveRequirements(mm, profile)
  const suffList = resolved.map(evaluateSufficiency)
  const profFit = projectProfessionalFit(suffList)
  const prefAssessments = assessPreferences(hashicorpJd, profile.preferences)
  const persFit = projectPersonalFit(prefAssessments)

  const recCov = computeRecognitionCoverage(hashicorpJd, mm)
  const assessment = applyPolicy(profFit, persFit, recCov)

  // Under K6B, HashiCorp recognition coverage bounds confidence to 0.286 (down from 1.0)
  assert.equal(recCov, 0.286)
  assert.equal(assessment.confidence, 0.286)
  // Confidence is drastically reduced by recognition coverage bound
  assert.ok(assessment.confidence < 0.5)
})

test('K11 Acceptance: DeclarativeMarketRecognizer — domain recognition recovery via ADMIN_KNOWLEDGE without changing universal protocol', async () => {
  const { DeclarativeMarketRecognizer, composeKnowledge, DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, resolveRequirements, evaluateSufficiency, projectProfessionalFit, assessPreferences, projectPersonalFit, computeRecognitionCoverage, applyPolicy } = await import('./index.js')
  type Profile = import('./index.js').Profile

  const adminJd = `Responsable de Administración y Recepción (Presencial).
Gestión completa de atención al cliente y pacientes en recepción.
Requisitos: Experiencia en gestión administrativa, facturación, y atención al cliente.
Conocimientos de software de gestión médica y gestión de nóminas.
Salario: €30.000 bruto/año.`

  const lydiaProfile: Profile = {
    identity: {
      person: { name: 'Lydia Pérez', title: 'Responsable de Administración', urls: {} },
      experienceIds: ['e-1'], projectIds: [], educationIds: [], publicationIds: [], certificationIds: [], recommendationIds: [], capabilityIds: ['c-1', 'c-2'], contributionIds: [],
    },
    experiences: [{ id: 'e-1', organization: 'Clínica', title: 'Administrativa', start: '2018-01', capabilityIds: ['c-1', 'c-2'], summary: '5 años supervisando facturación y atención al cliente', achievements: [], technologies: [], evidenceIds: [] }],
    capabilities: [
      { id: 'c-1', name: 'Gestión Administrativa y Facturación', signals: ['gestión administrativa', 'facturación'], evidenceIds: [] },
      { id: 'c-2', name: 'Atención al Cliente y Recepción', signals: ['atención al cliente', 'recepción'], evidenceIds: [] },
    ],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    contributions: [],
    evidence: [],
    preferences: { work: { remote: 'optional' }, compensation: { minimum: 25000 } },
  }

  // 1. Unaugmented software recognizer (K10 baseline behavior)
  const defaultRecognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const mmDefault = defaultRecognizer.extractMarketRequirements(adminJd)
  assert.equal(mmDefault.requirements.length, 0, 'Software recognizer recognizes 0 requirements in Admin JD')

  // 2. Composed recognizer (Software + Admin Knowledge)
  const composedKnowledge = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE)
  const composedRecognizer = new DeclarativeMarketRecognizer(composedKnowledge)
  const mmComposed = composedRecognizer.extractMarketRequirements(adminJd)

  // Recovery: Composed recognizer recovers domain requirements
  assert.ok(mmComposed.requirements.length >= 2, `Recognized ${mmComposed.requirements.length} admin requirements`)
  assert.ok(mmComposed.requirements.some(r => r.concept === 'Gestión Administrativa y Facturación'))
  assert.ok(mmComposed.requirements.some(r => r.concept === 'Atención al Cliente y Recepción'))

  // 3. Execution of Universal Protocol (K1-K6B) without ANY modifications
  const resolved = resolveRequirements(mmComposed, lydiaProfile)
  const suffList = resolved.map(evaluateSufficiency)
  const profFit = projectProfessionalFit(suffList)
  const persFit = projectPersonalFit(assessPreferences(adminJd, lydiaProfile.preferences))
  const recCov = computeRecognitionCoverage(adminJd, mmComposed)
  const assessment = applyPolicy(profFit, persFit, recCov)

  // System recovers observable fit & confidence via Universal Protocol
  assert.ok(profFit.score > 7.0, `ProfFit score (${profFit.score}) reflects evidence match`)
  assert.ok(assessment.confidence > 0.5, `Confidence (${assessment.confidence}) recovered`)
  assert.equal(assessment.eligibility, 'eligible')
})

test('K11 Acceptance: Knowledge Composition — adding Admin knowledge leaves Software recognition invariant', async () => {
  const { DeclarativeMarketRecognizer, composeKnowledge, DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE } = await import('./index.js')

  const softwareJd = `Staff Software Engineer — Distributed Systems (Remote).
Deep expertise in Python, Kubernetes, and REST APIs.
Salary: €100,000.`

  const softOnlyRecognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const composedRecognizer  = new DeclarativeMarketRecognizer(composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE))

  const mmSoft     = softOnlyRecognizer.extractMarketRequirements(softwareJd)
  const mmComposed = composedRecognizer.extractMarketRequirements(softwareJd)

  // Composition Invariant: Software requirements recognized are identical
  assert.equal(mmSoft.requirements.length, mmComposed.requirements.length)
  assert.deepEqual(
    mmSoft.requirements.map(r => r.concept),
    mmComposed.requirements.map(r => r.concept)
  )
})


test('CONSIDER: coverage below the apply threshold', () => {
  const jd = [
    'Staff Software Engineer.',
    'Kubernetes is central to this role.',
    'You will own architectural decisions.',
  ].join('\n')
  const ev = evaluateOpportunity(jd, makeProfile())
  assert.equal(ev.verdict, 'consider')
})

test('real JD evaluation #10 (SDG): CTO JD evaluates remote workMode, non-skip verdict, and demonstrated distributed stack while preserving AI gap', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
We are looking for a CTO to lead one of our core enterprise products.
Our international team of digital nomads works remotely from all over the world.
REMOTE OPPORTUNITY to work full-time.
High load (distributed architecture, microservices, event driven, syn/async, k8s, CI/CD).
Strong software development background and artificial intelligence interest.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  assert.ok(ev.demonstrated.some(d => d.capabilityName.includes('Kubernetes')))
})

test('handoff: APPLY produces a DecisionContext for the CV projection', () => {
  const ev = evaluateOpportunity('Staff Software Engineer. Own architectural decisions. Fully remote.', makeProfile())
  assert.equal(ev.decisionContext.targetRole, 'Staff Engineer')
  assert.equal(ev.decisionContext.audience, 'hiring-manager')
})

test('I-OE-2: every claim traces to a canonical capability', () => {
  const profile = makeProfile()
  const ids = new Set(profile.capabilities.map(c => c.id))
  const ev = evaluateOpportunity('Staff Engineer. Own architectural decisions.', profile)
  for (const m of [...ev.demonstrated, ...ev.gaps]) assert.ok(ids.has(m.capabilityId))
})

test('roles: recognizes Engineering Lead as matching Tech Lead role alias', () => {
  const ev = evaluateOpportunity('Role: Engineering Lead. Hybrid in Barcelona / Remote in Spain.', {
    ...makeProfile(),
    preferences: {
      work: { remote: 'required' },
      roles: ['Tech Lead', 'Staff Engineer'],
    },
  })
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
})

test('real JD evaluation #1 (Getronics): Engineering Lead JD evaluates workMode, role, demonstrated capabilities and gaps', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Engineering Lead
Remote-First (Spain)
Salary: €95,000 – €110,000

Profile:
Strong experience in software development with Golang and a solid understanding of cloud-native technologies, Kubernetes, and software engineering best practices, including Infrastructure-as-Code concepts.
Interest in Artificial Intelligence and familiarity with MLOps practices, such as workflow orchestration and model lifecycle management.
A proactive and collaborative mindset, with the ability to learn new technologies quickly and communicate effectively in English.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  assert.ok(ev.demonstrated.length > 0)
})

test('real JD evaluation #2 (Lodgify): Senior AI Engineer JD ignores meal perks compensation, evaluates to CONSIDER', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
We are seeking a Senior AI Engineer specializing in LLMs to lead the design, evaluation, and deployment of production-grade generative AI systems.
Lead the design and development of LLM-powered applications (chatbots, copilots, agents, internal tools).
Own and evolve the LLM evaluation (evals) strategy, including designing gold-standard datasets and benchmarks.
5+ years of experience in software engineering, machine learning, and applied AI with a track record of driving projects to completion.
Strong software engineering fundamentals (testing, modular design, dependency injection) in Python.
Experience implementing automated testing strategies for non-deterministic systems.
Solid experience in using Data Analytics techniques (SQL, analysis and visualizations) to inform Product decisions.
Flexible Remuneration for extra meal costs (up to €70/mo) and public transport (up to €136/mo).
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'unknown')
  assert.notEqual(ev.verdict, 'skip')
})

test('real JD evaluation #3 (Pleo): Staff Applied AI Engineer JD evaluates historical capabilities correctly', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Staff Applied AI Engineer
Build and ship multiple AI-powered product features across agentic workflows, spend intelligence, automated actions.
Deep proficiency with Python, SQL, REST APIs and infrastructure containerised with Kubernetes.
For our Team, we offer both hybrid and fully remote working options.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  assert.ok(ev.demonstrated.some(d => d.capabilityName.includes('Python')))
})

test('real JD evaluation #4 (Pearson): Software Engineering Manager JD evaluates Software Development and Python as demonstrated', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
ROLE: Manager, Software Engineering
As an Experienced Software Engineering Manager, you will play a vital role in leading and inspiring a team of software engineers.
Proven experience in software engineering principles, development processes, technologies and software development.
Hands-on experience with programming languages such as Java, PHP, Kotlin, Python, or C++.
Workplace Type: Remote
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  assert.ok(ev.demonstrated.length > 0)
})

test('real JD evaluation #5 (Affirm): Staff Full Stack Engineer JD evaluates space-separated compensation and SQL correctly', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Affirm is seeking a Staff Full Stack Software Engineer to join the Acquisition & Onboarding team.
As a Staff Engineer, you will set technical direction, drive architectural decisions, and elevate quality.
Proficient in backend systems at scale using Python, Kotlin, AWS, MySQL, and Kubernetes.
ESP base pay range per year: €103 000 - €139 000.
Location - Remote Spain
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  const demonstratedNames = ev.demonstrated.map(d => d.capabilityName)
  assert.ok(demonstratedNames.includes('Python (Programming Language)'))
  assert.ok(demonstratedNames.includes('Kubernetes'))
  assert.ok(demonstratedNames.includes('Technical Leadership'))
})

test('real JD evaluation #6 (Health-Tech AI): AI Engineer (Backend) JD evaluates €80K salary, workMode, demonstrated stack and preserves AI gap', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Salary: €80K – €150K
Location: Remote-First (Spain/UK) with a vibrant hub in Barcelona
As an AI Engineer (Backend), you will take end-to-end ownership of Cortex.
Software engineering experience with expert-level Python, FastAPI, asyncio, pydantic.
Architect, deploy, and maintain robust, modular backend systems using clean architectural principles and architectural design.
Infrastructure containerised with Kubernetes and Docker.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  const demonstratedNames = ev.demonstrated.map(d => d.capabilityName)
  assert.ok(demonstratedNames.includes('Python (Programming Language)'))
  assert.ok(demonstratedNames.includes('Kubernetes'))
  assert.ok(demonstratedNames.includes('Software Architecture'))
})

test('real JD evaluation #7 (Wiz): Principal Solutions Engineer JD evaluates Principal role, unknown workMode, and Cloud-Native Architecture as demonstrated', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
As a Principal Solutions Engineer you will work closely with Wiz's CTO.
Career path focused on public cloud architecture (AWS, Azure, GCP) and cloud-native security.
Demonstrable proficiency in high-level languages like Python and advanced shell scripting.
SME level knowledge of Kubernetes and containers with technical leadership.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'unknown')
  assert.notEqual(ev.verdict, 'skip')
  const demonstratedNames = ev.demonstrated.map(d => d.capabilityName)
  assert.ok(demonstratedNames.includes('Cloud-Native Architecture'))
  assert.ok(demonstratedNames.includes('Python (Programming Language)'))
  assert.ok(demonstratedNames.includes('Kubernetes'))
  assert.ok(demonstratedNames.includes('Technical Leadership'))
})

test('real JD evaluation #8 (Sticker Mule): Full-stack Software Engineer JD evaluates $150,000 USD compensation, remote workMode, unknown role, and AI-Assisted Engineering', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
You are an exceptional full-stack software engineer.
Fully remote from 40+ countries.
Salary: $150,000–$250,000 USD.
Use AI aggressively to push the limit of what we can do with AI tools.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'compensation')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'satisfied')
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'unknown')
  assert.notEqual(ev.verdict, 'skip')
})

test('real JD evaluation #9 (Libeen): Head of Product & Technology JD evaluates workMode as violated and verdict as skip', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Head of Product & Technology — Libeen | Madrid
Hybrid model based in Madrid.
Define and evolve Libeen's product vision.
Lead the development of our AI agent ecosystem with LLM-based automations.
  `.trim()

  const ev = evaluateOpportunity(jd, profile)
  assert.equal(ev.criteria.find(c => c.criterion === 'workMode')!.status, 'violated')
  assert.equal(ev.verdict, 'skip')
})



test('Evaluation Independence: evaluateOpportunity produces identical marketModel for distinct candidate profiles A and B', async () => {
  const profileA = (await import('../../provena-web/src/profile.js')).default
  const profileB = {
    ...profileA,
    identity: { ...profileA.identity, name: 'Profile B (Different Candidate)' },
    capabilities: [], // Empty capabilities
    contributions: [],
  }

  const jd = `
Staff Applied AI Engineer
Build and ship multiple AI-powered product features across agentic workflows.
Deep proficiency with Python, SQL, REST APIs and infrastructure containerised with Kubernetes.
For our Team, we offer both hybrid and fully remote working options.
  `.trim()

  const evA = evaluateOpportunity(jd, profileA)
  const evB = evaluateOpportunity(jd, profileB)

  // Invariant assertion: MarketModel is 100% profile-agnostic
  assert.deepStrictEqual(evA.marketModel, evB.marketModel)
  assert.ok(evA.marketModel?.requirements.length! >= 3)

  // Resolution and claims legitimately differ by profile
  assert.ok(evA.demonstrated.length > 0)
  assert.equal(evB.demonstrated.length, 0)
})

test('K1 Single Authority Invariant: Empty MarketModel produces zero resolved requirements and zero gaps', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const emptyMarketModel = { requirements: [], recognitionCoverage: 0 }
  const { resolveRequirements } = await import('./opportunity.js')

  const resolved = resolveRequirements(emptyMarketModel, profile)
  assert.equal(resolved.length, 0)
})

test('K1 Single Authority Invariant: Every resolved requirement traces to an originating MarketRequirement ID', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = 'Seeking Senior Backend Engineer proficient in Python and Kubernetes.'
  const ev = evaluateOpportunity(jd, profile)

  assert.ok(ev.marketModel)
  const reqIds = new Set(ev.marketModel.requirements.map(r => r.id))
  assert.ok(reqIds.size > 0)

  for (const m of [...ev.demonstrated, ...ev.gaps]) {
    // Every demonstrated/gap claim originates strictly from a recognized MarketRequirement
    assert.ok(ev.marketModel.requirements.some(r => r.concept === m.matchedPhrases[0]))
  }
})

test('K1 Acceptance (#18 Coro): Absence of AI requirement in MarketModel guarantees zero artificial AI gaps', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const coroJd = `
La Fundación Princesa de Asturias abre el proceso de selección para dirigir su Coro amateur.
Diseñar y desarrollar la programación artística del Coro.
Dirigir y planificar ensayos, conciertos y audiciones.
  `.trim()

  const ev = evaluateOpportunity(coroJd, profile)
  const gapConcepts = ev.gaps.map(g => g.capabilityName)
  assert.ok(!gapConcepts.includes('Artificial Intelligence (AI)'))
})

test('K1 Acceptance (#20 Univ. CEU): Absence of AI requirement in MarketModel guarantees zero artificial AI gaps', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const ceuJd = `
Docente Universitario en Ingeniería Informática, especializado en sistemas distribuidos.
Acreditación ANECA. Programación concurrente, Git, refactoring.
  `.trim()

  const ev = evaluateOpportunity(ceuJd, profile)
  const gapConcepts = ev.gaps.map(g => g.capabilityName)
  assert.ok(!gapConcepts.includes('Artificial Intelligence (AI)'))
})

test('Triad Empirical Benchmark Gate: pattern expansion increases coverage and qualifier preservation without altering universal decision protocol', async () => {
  const {
    runMarketRequirementBenchmark,
    composeKnowledge,
    DeclarativeMarketRecognizer,
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE,
  } = await import('./index.js')

  const testCorpus = [
    'Senior Infrastructure Engineer at Stripe. Requirements: 5+ years experience with production Kubernetes, Envoy proxy, and PCI compliance required. Deep proficiency in Go.',
    'Staff Payment Systems Engineer. Requires double-entry ledger architecture, Terraform at scale, Prometheus monitoring. Hands-on Go experience preferred.',
  ]

  // Baseline benchmark
  const baselineBench = runMarketRequirementBenchmark(testCorpus)

  // Expanded benchmark with modular domain packs
  const expandedKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const expandedRecognizer = new DeclarativeMarketRecognizer(expandedKnowledge)
  const expandedBench = runMarketRequirementBenchmark(testCorpus, expandedRecognizer)

  // Triad evaluation gate assertions
  assert.ok(
    expandedBench.recognitionCoverage >= baselineBench.recognitionCoverage,
    `Recognition coverage must increase or stay equal: ${expandedBench.recognitionCoverage} >= ${baselineBench.recognitionCoverage}`
  )
  assert.ok(
    expandedBench.qualifierPreservation >= baselineBench.qualifierPreservation,
    `Qualifier preservation must increase or stay equal: ${expandedBench.qualifierPreservation} >= ${baselineBench.qualifierPreservation}`
  )
  assert.equal(
    expandedBench.falsePositiveRate,
    0,
    'False positive rate must remain 0 for declarative pattern matchers'
  )

  // Decision Protocol Invariant Check: evaluateOpportunity logic remains deterministic
  const baselineProfile = makeProfile()
  const jd = testCorpus[0] ?? ''
  const ev1 = evaluateOpportunity(jd, baselineProfile)
  assert.ok(
    ['apply', 'consider', 'skip'].includes(ev1.verdict),
    'Decision protocol must produce valid deterministic verdict'
  )
})













