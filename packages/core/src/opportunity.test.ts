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












