# Opportunity Evaluation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the web answer "should I apply?" for a pasted job description — APPLY / CONSIDER / SKIP with reasons traced to the canonical profile, then hand the decision context to the CV projection.

**Architecture:** A pure deterministic evaluator in `@provena/core` (`evaluateOpportunity(jd, profile)`) turns JD text + canonical truth into a traceable `OpportunityEvaluation`. Criterion extractors check `preferences`; a signal matcher maps JD phrases → capability `signals` → contributions → evidence. A policy produces the verdict. The web adds an `/evaluate` page + `/api/evaluate` route; on APPLY it hands the `DecisionContext` to `/cv` via query params.

**Tech Stack:** TypeScript (NodeNext ESM), `node:test`, Cloudflare Worker (`@provena/web`), `@provena/yaml` workspace loader.

## Global Constraints

- Deterministic only. No LLM, no AI services, no API keys, no external infrastructure.
- No KV for evaluation state; the canonical profile stays the single source of truth.
- `evaluateOpportunity(jd, profile)` is the public pure frontier in core: prose + canonical truth in, traceable evaluation out.
- Coverage operates only over the universe Provena recognized: `coverage = demonstrated / (demonstrated + no-evidence)`; unrecognized JD text is counted separately as `notEvaluated`.
- **I-OE-1:** Absence of recognition MUST NOT be interpreted as absence of evidence (`notEvaluated`, never a gap).
- **I-OE-2:** Opportunity evaluation MUST NOT introduce claims about the profile that cannot be traced to canonical evidence.
- **I-OE-3:** A violated criterion requires positive evidence of violation; failure to extract a criterion yields `unknown`, never `violated`.
- Verdict is always three-way; `UNKNOWN` exists only at the signal level.
- `APPLY_COVERAGE_THRESHOLD = 0.7`, `APPLY_INTERPRETATION_THRESHOLD = 0.5` are calibration hypotheses — placeholders until ~10 real offers.
- English-first UI.

---

### Task 1: Core type + YAML schema accept `signals` on Capability

**Files:**
- Modify: `packages/core/src/types.ts:24-30` (the `Capability` interface)
- Modify: `packages/yaml/src/schema.ts:117-125` (`parseCapabilities`)
- Test: `packages/yaml/src/schema.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Capability.signals?: readonly string[]`; `parseCapabilities` accepts an optional `signals` string array and rejects a non-string array. Later tasks rely on `signals` being present on the loaded profile's capabilities.

- [ ] **Step 1: Write the failing tests**

Append to `packages/yaml/src/schema.test.ts` and extend its import:

```ts
import { parseExperiences, parsePerson, parseCapabilities } from './schema.js'
```

```ts
test('parseCapabilities accepts an optional signals array', () => {
  const raw = [{
    id: 'cap-1',
    name: 'Technical Leadership',
    evidenceIds: [],
    signals: ['technical leadership', 'mentor engineers'],
  }]
  const parsed = parseCapabilities(raw)
  assert.equal(parsed.length, 1)
  assert.deepEqual(parsed[0]!.signals, ['technical leadership', 'mentor engineers'])
})

test('parseCapabilities rejects a non-string signals array', () => {
  const raw = [{ id: 'cap-1', name: 'X', evidenceIds: [], signals: [42] }]
  assert.throws(() => parseCapabilities(raw), /capabilities\.yaml\[0\]: invalid or missing field\(s\): signals/)
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test packages/yaml/src/schema.test.ts`
Expected: both new tests fail (the second throws an unexpected missing-field error, the first fails on `signals` typing/round-trip).

- [ ] **Step 3: Implement the type and schema**

Edit `packages/core/src/types.ts`, the `Capability` interface (add the field after `name`):

```ts
export interface Capability {
  readonly id: string
  readonly name: string
  readonly signals?: readonly string[]
  readonly description?: string
  readonly evidenceIds: readonly string[]
  readonly provenance?: Provenance
}
```

Edit `packages/yaml/src/schema.ts`, replace `parseCapabilities`:

```ts
export function parseCapabilities(raw: unknown, file = 'capabilities.yaml'): Capability[] {
  return parseArray<Capability>(raw, file, (v) => {
    const bad = checks(v, [
      ['id', isString],
      ['name', isString],
      ['evidenceIds', isStringArray],
    ])
    if ('signals' in v && !isStringArray(v['signals'])) bad.push('signals')
    return bad
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --import tsx --test packages/yaml/src/schema.test.ts`
Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/yaml/src/schema.ts packages/yaml/src/schema.test.ts
git commit -m "feat(core): add signals to Capability and accept them in the YAML schema"
```

---

### Task 2: Core — the Opportunity evaluator

**Files:**
- Create: `packages/core/src/opportunity.ts`
- Create: `packages/core/src/opportunity.test.ts`
- Modify: `packages/core/src/index.ts` (export the new module)

**Interfaces:**
- Consumes: `Profile`, `Preferences` (`./types.js`), `DecisionContext` (`./cv-projector.js`).
- Produces (exported from `@provena/core`):
  - `evaluateOpportunity(jd: string, profile: Profile): OpportunityEvaluation`
  - `APPLY_COVERAGE_THRESHOLD`, `APPLY_INTERPRETATION_THRESHOLD`
  - types `Verdict`, `CriterionStatus`, `SignalStatus`, `CriterionCheck`, `SignalMatch`, `OpportunityEvaluation`
  - `OpportunityEvaluation` shape (later tasks rely on exact field names): `{ verdict, criteria, demonstrated, gaps, notEvaluated, coverage, interpretationCoverage, confidence, decisionContext }`
  - `decisionContext: DecisionContext` has `targetRole?: string`, `audience`, `emphasize: string[]`.

- [ ] **Step 1: Write the failing tests**

Create `packages/core/src/opportunity.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --import tsx --test packages/core/src/opportunity.test.ts`
Expected: FAIL — `Cannot find module './opportunity.js'`.

- [ ] **Step 3: Implement the evaluator**

Create `packages/core/src/opportunity.ts`:

```ts
import type { Profile } from './profile.js'
import type { Preferences } from './types.js'
import type { DecisionContext } from './cv-projector.js'

export type Verdict = 'apply' | 'consider' | 'skip'
export type CriterionStatus = 'satisfied' | 'violated' | 'unknown'
export type SignalStatus = 'demonstrated' | 'no-evidence'

export interface CriterionCheck {
  readonly criterion: string
  readonly status: CriterionStatus
  readonly detail: string
}

export interface SignalMatch {
  readonly capabilityId: string
  readonly capabilityName: string
  readonly matchedPhrases: readonly string[]
  readonly evidence: readonly string[]
  readonly status: SignalStatus
}

export interface OpportunityEvaluation {
  readonly verdict: Verdict
  readonly criteria: readonly CriterionCheck[]
  readonly demonstrated: readonly SignalMatch[]
  readonly gaps: readonly SignalMatch[]
  readonly notEvaluated: number
  readonly coverage: number
  readonly interpretationCoverage: number
  readonly confidence: number
  readonly decisionContext: DecisionContext
}

// ponytail: thresholds are calibration hypotheses — tune after ~10 real offers
export const APPLY_COVERAGE_THRESHOLD = 0.7
export const APPLY_INTERPRETATION_THRESHOLD = 0.5

function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ---- criterion extractors -------------------------------------------------

function parseAmount(s: string): number {
  const t = s.trim()
  if (t.includes(',') && !t.includes('.')) return parseFloat(t.replace(/,/g, ''))
  if (t.includes('.') && !t.includes(',')) {
    const [, dec] = t.split('.')
    if (dec && dec.length === 3) return parseFloat(t.replace(/\./g, ''))
    return parseFloat(t)
  }
  return parseFloat(t)
}

function extractSalaries(text: string): number[] {
  const out: number[] = []
  const re = /(?:€|eur|euro)\s*([\d.,]+)\s*(k)?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    let n = parseAmount(m[1]!)
    if (m[2]) n *= 1000
    if (!Number.isNaN(n)) out.push(n)
  }
  return out
}

function checkCompensation(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const min = prefs?.compensation?.minimum
  if (!min) return { criterion: 'compensation', status: 'unknown', detail: 'no minimum compensation in profile' }
  const salaries = extractSalaries(jd)
  if (salaries.length === 0) return { criterion: 'compensation', status: 'unknown', detail: 'JD does not state compensation' }
  const floor = Math.min(...salaries)
  const status = floor < min ? 'violated' : 'satisfied'
  return { criterion: 'compensation', status, detail: 'JD states €' + floor + '; minimum is €' + min }
}

const REMOTE_RE = /remote|work from home|\bwfh\b|remote-?first/i
const ONSITE_RE = /on[- ]site|in (?:the )?office|per week in|relocation/i
const HYBRID_RE = /hybrid/i

function checkWorkMode(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const pref = prefs?.work?.remote
  if (!pref) return { criterion: 'workMode', status: 'unknown', detail: 'no remote preference in profile' }
  if (pref === 'required') {
    if (ONSITE_RE.test(jd) || HYBRID_RE.test(jd)) {
      return { criterion: 'workMode', status: 'violated', detail: 'JD requires on-site or hybrid presence; you require fully remote' }
    }
    if (REMOTE_RE.test(jd)) return { criterion: 'workMode', status: 'satisfied', detail: 'JD allows remote' }
    return { criterion: 'workMode', status: 'unknown', detail: 'JD does not state work mode' }
  }
  if (pref === 'hybrid') {
    if (REMOTE_RE.test(jd) || HYBRID_RE.test(jd)) return { criterion: 'workMode', status: 'satisfied', detail: 'JD allows remote/hybrid' }
    if (ONSITE_RE.test(jd)) return { criterion: 'workMode', status: 'violated', detail: 'JD is on-site only' }
    return { criterion: 'workMode', status: 'unknown', detail: 'JD does not state work mode' }
  }
  return { criterion: 'workMode', status: 'unknown', detail: 'remote is optional' }
}

function roleTokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 3)
}

export function findMatchedRole(jd: string, roles: readonly string[]): string | null {
  const jdTokens = new Set(roleTokens(jd))
  return roles.find(r => {
    const rt = roleTokens(r)
    return rt.length > 0 && rt.every(t => jdTokens.has(t))
  }) ?? null
}

function checkRoles(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const roles = prefs?.roles ?? []
  if (roles.length === 0) return { criterion: 'roles', status: 'unknown', detail: 'no preferred roles in profile' }
  const matched = findMatchedRole(jd, roles)
  if (matched) return { criterion: 'roles', status: 'satisfied', detail: 'JD matches preferred role ' + matched }
  const lower = jd.toLowerCase()
  if (/(junior|mid-?level)/i.test(lower) || roleTokens(lower).includes('senior')) {
    return { criterion: 'roles', status: 'violated', detail: 'JD targets a level below preferred (' + roles.join(', ') + ')' }
  }
  return { criterion: 'roles', status: 'unknown', detail: 'JD role not recognizable vs preferred: ' + roles.join(', ') }
}

function checkAvoid(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const avoid = prefs?.avoid ?? []
  if (avoid.length === 0) return { criterion: 'avoid', status: 'unknown', detail: 'no avoid list in profile' }
  const lower = jd.toLowerCase()
  const hit = avoid.find(a => lower.includes(a.toLowerCase()))
  if (hit) return { criterion: 'avoid', status: 'violated', detail: 'JD matches avoid: ' + hit }
  return { criterion: 'avoid', status: 'satisfied', detail: 'no avoid pattern detected' }
}

// ---- signal matcher -------------------------------------------------------

function evidenceByCapability(profile: Profile): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const c of profile.contributions ?? []) {
    for (const id of c.capabilityIds ?? []) {
      const list = map.get(id) ?? []
      list.push(c.outcome?.summary ?? c.summary)
      map.set(id, list)
    }
  }
  return map
}

function matchSignals(jd: string, profile: Profile): { matches: SignalMatch[]; notEvaluated: number } {
  const normJd = normalizeText(jd)
  const evidenceByCap = evidenceByCapability(profile)
  const matches: SignalMatch[] = []
  for (const cap of profile.capabilities ?? []) {
    const matchedPhrases: string[] = []
    for (const signal of cap.signals ?? []) {
      if (normJd.includes(normalizeText(signal))) matchedPhrases.push(signal)
    }
    if (matchedPhrases.length === 0) continue
    const evidence = evidenceByCap.get(cap.id) ?? []
    matches.push({
      capabilityId: cap.id,
      capabilityName: cap.name,
      matchedPhrases,
      evidence,
      status: evidence.length > 0 ? 'demonstrated' : 'no-evidence',
    })
  }
  // ponytail: newline chunks as interpretation units; revisit if real offers disagree
  const chunks = jd.split(/\n+/).map(c => c.trim()).filter(Boolean)
  const notEvaluated = chunks.filter(chunk => {
    const n = normalizeText(chunk)
    return !matches.some(m => m.matchedPhrases.some(p => n.includes(normalizeText(p))))
  }).length
  return { matches, notEvaluated }
}

// ---- policy ---------------------------------------------------------------

export function evaluateOpportunity(jd: string, profile: Profile): OpportunityEvaluation {
  const prefs = profile.preferences
  const criteria: CriterionCheck[] = [
    checkCompensation(jd, prefs),
    checkWorkMode(jd, prefs),
    checkRoles(jd, prefs),
    checkAvoid(jd, prefs),
  ]
  const { matches, notEvaluated } = matchSignals(jd, profile)
  const demonstrated = matches.filter(m => m.status === 'demonstrated')
  const gaps = matches.filter(m => m.status === 'no-evidence')
  const recognized = demonstrated.length + gaps.length
  const coverage = recognized === 0 ? 0 : demonstrated.length / recognized
  const interpretationCoverage = recognized + notEvaluated === 0 ? 0 : recognized / (recognized + notEvaluated)
  const confidence = recognized + notEvaluated === 0 ? 0 : demonstrated.length / (recognized + notEvaluated)

  const violated = criteria.find(c => c.status === 'violated')
  const verdict: Verdict = violated
    ? 'skip'
    : coverage >= APPLY_COVERAGE_THRESHOLD && interpretationCoverage >= APPLY_INTERPRETATION_THRESHOLD
      ? 'apply'
      : 'consider'

  const decisionContext: DecisionContext = {
    targetRole: findMatchedRole(jd, prefs?.roles ?? []) ?? undefined,
    audience: 'hiring-manager',
    emphasize: demonstrated.map(m => m.capabilityName),
  }

  return {
    verdict,
    criteria,
    demonstrated,
    gaps,
    notEvaluated,
    coverage,
    interpretationCoverage,
    confidence,
    decisionContext,
  }
}
```

- [ ] **Step 4: Export from core**

Append to `packages/core/src/index.ts`:

```ts
export type { Verdict, CriterionStatus, SignalStatus, CriterionCheck, SignalMatch, OpportunityEvaluation } from './opportunity.js'
export { evaluateOpportunity, findMatchedRole, APPLY_COVERAGE_THRESHOLD, APPLY_INTERPRETATION_THRESHOLD } from './opportunity.js'
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --import tsx --test packages/core/src/opportunity.test.ts`
Expected: PASS — all 9 tests green.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: PASS — no errors (watch for unused-locals errors in the new test file).

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/opportunity.ts packages/core/src/opportunity.test.ts packages/core/src/index.ts
git commit -m "feat(core): add deterministic opportunity evaluator over canonical profile"
```

---

### Task 3: Seed signals in the canonical profile

**Files:**
- Modify: `profiles/valentin/capabilities.yaml`
- Modify: `packages/core/src/canonicalProfile.test.ts`

**Interfaces:**
- Consumes: `Capability.signals` from Task 1.
- Produces: the canonical profile whose capabilities carry `signals`, verified through `YamlWorkspaceLoader`. Later web tasks rely on the regenerated bundle carrying these signals.

- [ ] **Step 1: Add `signals` to the five capabilities**

In `profiles/valentin/capabilities.yaml`, add a `signals` block after the `evidenceIds: []` line of each of these capabilities (keep `provenance` anchors as they are):

`Software Architecture` (`id: 420b07b6-c49e-43ee-a409-f569e60378ab`):

```yaml
  signals:
    - software architecture
    - system architecture
    - architectural design
    - architecture decisions
    - architectural decisions
    - design systems
    - technical design
    - clean architecture
```

`Technical Leadership` (`id: 72e03a49-5880-401e-8aec-c1f6c0b21efd`):

```yaml
  signals:
    - technical leadership
    - technical direction
    - technical ownership
    - drive technical decisions
    - mentor engineers
    - lead engineering initiatives
    - technical roadmap
```

`AI-Assisted Engineering` (`id: 7ab84b2f-5ef0-4619-8784-c700f27c2694`):

```yaml
  signals:
    - ai-assisted engineering
    - ai-assisted development
    - ai engineering
    - llm
    - genai
    - ai tools
```

`Developer Productivity` (`id: 49dd7b2b-0dc6-4d4a-86ba-5a409e0ac610`):

```yaml
  signals:
    - developer productivity
    - developer experience
    - devops
    - ci/cd
    - build tooling
    - internal tools
    - engineering efficiency
```

`Distributed Systems` (`id: 5cdea70c-e1b8-4699-abec-cbc326ba0ab1`):

```yaml
  signals:
    - distributed systems
    - distributed architecture
    - high availability
    - fault tolerance
    - scalability
    - microservices
    - messaging systems
    - event-driven
```

- [ ] **Step 2: Add the integration assertion**

Append a test to `packages/core/src/canonicalProfile.test.ts`:

```ts
it('capabilities carry signals for opportunity evaluation', async () => {
  const profilePath = path.resolve(process.cwd(), 'profiles/valentin')
  const loader = new YamlWorkspaceLoader()
  const { profile } = await loader.load(profilePath)
  assert.ok(profile.capabilities.some(c => (c.signals ?? []).length > 0))
})
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `node --import tsx --test packages/core/src/canonicalProfile.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add profiles/valentin/capabilities.yaml packages/core/src/canonicalProfile.test.ts
git commit -m "data(profile): seed capability signals for opportunity evaluation"
```

---

### Task 4: Regenerate the web profile embed

**Files:**
- Modify: `packages/provena-web/src/profile.ts` (regenerated — same header/`updatedAt` as today)

**Interfaces:**
- Consumes: `profiles/valentin` workspace (now with `signals`).
- Produces: the embedded `profile` the web worker imports, now carrying `capabilities[].signals` and `preferences`.

- [ ] **Step 1: Regenerate `profile.ts`**

Run from repo root:

```bash
node --import tsx -e "
import { writeFile } from 'node:fs/promises'
import { YamlWorkspaceLoader } from './packages/yaml/src/yaml-workspace-loader.ts'
const { profile } = await new YamlWorkspaceLoader().load('./profiles/valentin')
const body = \"// Generated from profiles/valentin — regenerate with the command in docs/superpowers/plans/2026-07-31-cv-preparation.md (Task 3)\n\" +
  \"import type { Profile } from '@provena/core'\n\" +
  \"export const updatedAt = '2026-07-30'\n\" +
  'export default ' + JSON.stringify(profile, null, 2) + ' satisfies Profile\n'
await writeFile('packages/provena-web/src/profile.ts', body)
"
```

- [ ] **Step 2: Verify signals are embedded**

Run: `grep -c '"signals"' packages/provena-web/src/profile.ts`
Expected: `5` (one per seeded capability).

- [ ] **Step 3: Typecheck the web package**

Run: `npm run typecheck -w packages/provena-web`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/provena-web/src/profile.ts
git commit -m "feat(web): embed capability signals in the web profile"
```

---

### Task 5: Web — Evaluate page, API route, nav section

**Files:**
- Modify: `packages/provena-web/src/index.ts`
- Create: `packages/provena-web/src/evaluate.test.ts`
- Modify: `packages/provena-web/src/nav.test.ts`

**Interfaces:**
- Consumes: `evaluateOpportunity` and `OpportunityEvaluation` from `@provena/core` (Task 2); the embedded `profile` with `signals` (Task 4).
- Produces: `GET /evaluate` (page), `POST /api/evaluate` (`{ jd: string }` → `OpportunityEvaluation` JSON); `siteNav` accepts `'evaluate'`.

- [ ] **Step 1: Write the failing web tests**

Create `packages/provena-web/src/evaluate.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = {} as never

test('Evaluate page renders the nav, title and paste box', async () => {
  const res = await worker.fetch(new Request('https://provena.example/evaluate'), env)
  const html = await res.text()
  assert.ok(html.includes('<a class="active" href="/evaluate">Evaluate</a>'))
  assert.ok(html.includes('<h1>Evaluate an opportunity</h1>'))
  assert.ok(html.includes('<textarea id="jd"'))
  assert.ok(html.includes('onclick="evaluate()"'))
})

test('POST /api/evaluate returns a traceable evaluation', async () => {
  const jd = 'Staff Software Engineer. Own architectural decisions for backend systems. Fully remote. €100,000 - €120,000.'
  const res = await worker.fetch(new Request('https://provena.example/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd }),
  }), env)
  assert.equal(res.status, 200)
  const ev = await res.json()
  assert.ok(['apply', 'consider', 'skip'].includes(ev.verdict))
  assert.ok(Array.isArray(ev.criteria))
  assert.ok(ev.demonstrated.some(m => m.capabilityName === 'Software Architecture'))
})

test('embedded profile carries capability signals for evaluation', async () => {
  const profile = (await import('./profile.js')).default
  assert.ok(profile.capabilities.some(c => (c.signals ?? []).length > 0))
})
```

Append to `packages/provena-web/src/nav.test.ts`:

```ts
test('siteNav renders the Evaluate section', () => {
  assert.ok(siteNav('story').includes('<a href="/evaluate">Evaluate</a>'))
  assert.ok(siteNav('evaluate').includes('<a class="active" href="/evaluate">Evaluate</a>'))
  assert.ok(!siteNav('evaluate').includes('class="active" href="/"'))
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --import tsx --test packages/provena-web/src/evaluate.test.ts packages/provena-web/src/nav.test.ts`
Expected: FAIL — no `/evaluate` route, no Evaluate nav link.

- [ ] **Step 3: Implement the nav section**

In `packages/provena-web/src/index.ts`, change the `siteNav` signature and add the section:

```ts
export function siteNav(section: 'story' | 'prepare' | 'evaluate'): string {
```

```ts
  const sections = [
    { label: 'Story', href: '/', id: 'story' as const },
    { label: 'Prepare', href: '/cv', id: 'prepare' as const },
    { label: 'Evaluate', href: '/evaluate', id: 'evaluate' as const },
  ]
```

- [ ] **Step 4: Implement the page, API route and import**

Add the import at the top of `packages/provena-web/src/index.ts` (extend the existing core import line):

```ts
import { profileToTimeline, cvProjector, evaluateOpportunity } from '@provena/core'
```

Insert `EVALUATE_PAGE` after the `CV_PAGE` template literal (before the `renderCV` function). It follows the same single-file HTML+script pattern as the existing pages:

```ts
const EVALUATE_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Evaluate</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
@media (max-width: 480px) { body { padding: 0.75rem; } main { margin-top: 1rem; } }
main { max-width: 40rem; margin: 2rem auto; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
textarea { width: 100%; min-height: 12rem; font-size: 0.875rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
.card { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; margin-top: 1rem; }
.card .verdict { font-size: 1.125rem; font-weight: 700; }
.card .verdict.apply { color: #2e7d32; }
.card .verdict.consider { color: #b26a00; }
.card .verdict.skip { color: #c62828; }
.card h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-top: 1rem; }
.card ul { margin: 0.25rem 0 0 1.125rem; }
.card li { font-size: 0.875rem; color: #333; margin-bottom: 0.375rem; }
.card .trace { font-size: 0.8125rem; color: #555; margin-top: 0.25rem; }
.meta { color: #777; font-size: 0.8125rem; margin-top: 0.5rem; }
.site { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; margin-bottom: 0.625rem; }
.site .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site .links a { font-size: 0.875rem; color: #999; text-decoration: none; padding-bottom: 0.125rem; }
.site .links a.active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; }
</style>
<main>
${siteNav('evaluate')}
<h1>Evaluate an opportunity</h1>
<p class="subtitle">Paste a job description. Provena looks for signals it can honestly evaluate against your profile.</p>
<label for="jd">Job description</label>
<textarea id="jd" placeholder="Staff Software Engineer..."></textarea>
<button onclick="evaluate()">Evaluate</button>
<div id="result"></div>
</main>
<script>
const result = document.getElementById('result')
let lastEv = null
async function evaluate() {
  const jd = document.getElementById('jd').value.trim()
  if (!jd) return
  result.innerHTML = '<p class="meta">Evaluating...</p>'
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd }),
  })
  if (!res.ok) { result.innerHTML = '<p class="meta">Error: ' + await res.text() + '</p>'; return }
  const ev = await res.json()
  lastEv = ev
  result.innerHTML = renderResult(ev)
}
function checkIcon(status) {
  return status === 'violated' ? '✗' : status === 'satisfied' ? '✓' : '?'
}
function renderResult(ev) {
  const parts = []
  parts.push('<div class="card"><div class="verdict ' + ev.verdict + '">' + ev.verdict.toUpperCase() + '</div>')
  parts.push('<h3>Criteria</h3><ul>')
  parts.push(ev.criteria.map(c => '<li>' + checkIcon(c.status) + ' <strong>' + c.criterion + '</strong> — ' + c.detail + '</li>').join(''))
  parts.push('</ul>')
  if (ev.demonstrated.length) {
    parts.push('<h3>Can demonstrate</h3><ul>')
    parts.push(ev.demonstrated.map(m => '<li>✓ <strong>' + m.capabilityName + '</strong>' +
      '<div class="trace">JD: "' + m.matchedPhrases.join('", "') + '" → your evidence: ' + m.evidence.join('; ') + '</div></li>').join(''))
    parts.push('</ul>')
  }
  if (ev.gaps.length) {
    parts.push('<h3>Gaps</h3><ul>')
    parts.push(ev.gaps.map(m => '<li>△ <strong>' + m.capabilityName + '</strong> — recognized but no recorded evidence</li>').join(''))
    parts.push('</ul>')
  }
  parts.push('<h3>Not evaluated</h3>')
  parts.push('<p class="meta">' + ev.notEvaluated + ' part(s) of the description could not be read against the profile vocabulary.</p>')
  parts.push('<p class="meta">Coverage ' + Math.round(ev.coverage * 100) + '% · Interpreted ' + Math.round(ev.interpretationCoverage * 100) + '% · Confidence ' + Math.round(ev.confidence * 100) + '%</p>')
  if (ev.verdict === 'apply') parts.push('<button onclick="prepare()">Prepare application</button>')
  parts.push('</div>')
  return parts.join('')
}
function prepare() {
  const dc = lastEv ? lastEv.decisionContext || {} : {}
  const q = new URLSearchParams()
  if (dc.targetRole) q.set('role', dc.targetRole)
  if (dc.emphasize && dc.emphasize.length) q.set('emphasize', dc.emphasize.join(','))
  location.href = '/cv?' + q.toString()
}
</script>
`
```

In the `fetch` handler, add two routes before the final `return new Response('Not found', { status: 404 })`:

```ts
    if (request.method === 'GET' && url.pathname === '/evaluate') {
      return new Response(EVALUATE_PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/evaluate') {
      try {
        const body = (await request.json()) as { jd?: string }
        if (!body.jd || typeof body.jd !== 'string') {
          return new Response('Missing jd', { status: 400 })
        }
        return new Response(JSON.stringify(evaluateOpportunity(body.jd, profile)), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --import tsx --test packages/provena-web/src/evaluate.test.ts packages/provena-web/src/nav.test.ts`
Expected: PASS.

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck -w packages/provena-web`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/evaluate.test.ts packages/provena-web/src/nav.test.ts
git commit -m "feat(web): add Evaluate page and opportunity evaluation API"
```

---

### Task 6: Web — handoff Evaluate → Prepare CV

**Files:**
- Modify: `packages/provena-web/src/index.ts` (the `CV_PAGE` script)
- Modify: `packages/provena-web/src/evaluate.test.ts`

**Interfaces:**
- Consumes: the `prepare()` navigation already in `EVALUATE_PAGE` (Task 5), which links to `/cv?role=...&emphasize=...`.
- Produces: `/cv` reads `role` and `emphasize` query params to pre-fill the context for the CV projection.

- [ ] **Step 1: Write the failing test**

Append to `packages/provena-web/src/evaluate.test.ts`:

```ts
test('Prepare page reads role/emphasize query params for the evaluate handoff', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('new URLSearchParams(location.search)'))
  assert.ok(html.includes("params.get('role')"))
  assert.ok(html.includes("params.get('emphasize')"))
  assert.ok(html.includes('prefillEmphasize.includes'))
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --import tsx --test packages/provena-web/src/evaluate.test.ts`
Expected: FAIL — the CV page has no query-param handling.

- [ ] **Step 3: Implement the query-param pre-fill in `CV_PAGE`**

In `packages/provena-web/src/index.ts`, inside the `CV_PAGE` script, right after the `const suggestions = ${JSON.stringify(SUGGESTIONS)}` line, add:

```js
const params = new URLSearchParams(location.search)
const prefillRole = params.get('role')
if (prefillRole) document.getElementById('role').value = prefillRole
const prefillEmphasize = (params.get('emphasize') || '').split(',').filter(Boolean)
```

Replace the caps generation block:

```js
document.getElementById('caps').innerHTML = suggestions.strengths.map(s =>
  '<label><input type="checkbox" data-cap="' + s + '" checked> ' + s + '</label>'
).join('')
```

with:

```js
const capNames = [...suggestions.strengths]
for (const name of prefillEmphasize) if (!capNames.includes(name)) capNames.push(name)
document.getElementById('caps').innerHTML = capNames.map(s =>
  '<label><input type="checkbox" data-cap="' + s + '" checked> ' + s + '</label>'
).join('')
document.querySelectorAll('[data-cap]').forEach(el => {
  if (prefillEmphasize.length && !prefillEmphasize.includes(el.dataset.cap)) el.checked = false
})
```

`buildContext()` already reads the DOM, so the pre-filled role and checkboxes flow into `/api/cv/preview`.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `node --import tsx --test packages/provena-web/src/evaluate.test.ts`
Expected: PASS.

- [ ] **Step 5: Full verification**

Run: `npm run typecheck`
Run: `npm test`
Expected: both PASS with no failures.

- [ ] **Step 6: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/evaluate.test.ts
git commit -m "feat(web): hand the evaluation decision context into CV preparation"
```
