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

test('real JD evaluation: Engineering Lead JD evaluates workMode, role, demonstrated capabilities and gaps', async () => {
  const profile = (await import('../../provena-web/src/profile.js')).default
  const jd = `
Role: Engineering Lead 
Location: hybrid in Barcelona / Remote in Spain 
Contract: full time 
Language: English 

Responsibilities:
Contribute to the development and improvement of a cloud-native Data & AI platform, helping to design scalable architectures and integrate suitable technologies.
Build and automate platform services by developing Kubernetes-based solutions and APIs that support the deployment, management, and interaction with cloud environments.
Analyse and resolve technical challenges by identifying root causes and implementing reliable, long-term improvements.

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
  assert.ok(ev.gaps.length > 0)
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
  assert.equal(ev.verdict, 'consider')
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
  assert.equal(ev.criteria.find(c => c.criterion === 'roles')!.status, 'satisfied')
  assert.notEqual(ev.verdict, 'skip')
  const demonstratedNames = ev.demonstrated.map(d => d.capabilityName)
  assert.ok(demonstratedNames.includes('Python (Programming Language)'))
  assert.ok(demonstratedNames.includes('Kubernetes'))
  assert.ok(demonstratedNames.includes('REST APIs'))
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
  const demonstratedNames = ev.demonstrated.map(d => d.capabilityName)
  assert.ok(demonstratedNames.includes('Software Development'))
  assert.ok(demonstratedNames.includes('Python (Programming Language)'))
  const gapNames = ev.gaps.map(g => g.capabilityName)
  assert.ok(!gapNames.includes('Software Development'))
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
  assert.ok(demonstratedNames.includes('SQL'))
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
  const gapNames = ev.gaps.map(g => g.capabilityName)
  assert.ok(gapNames.includes('Artificial Intelligence (AI)'))
})






