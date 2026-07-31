# Prepare CV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Prepare CV" flow: a `/cv` page in the web Worker that projects the canonical `Profile` into a targeted `ResumeModel` using a shared `DecisionContext`, with Compass-style suggestions and markdown/print-PDF export.

**Architecture:** `Profile` is the single source of truth. `@provena/core` gains shared primitives (`career.ts`: `deriveStrengths`, `deriveEvidenceCount`, `findEvidenceGaps`, `profileToTimeline`) and a new projection (`cv-projector.ts`). The web embeds the full `Profile`, replaces `timeline.ts`, refactors `computeCareerCompass` to consume `Profile`, and adds `/cv` + `POST /api/cv/preview`. The Worker computes; the browser is pure UI.

**Tech Stack:** TypeScript, Node `node:test` via `tsx`, Cloudflare Workers (`wrangler`), existing `@provena/markdown` + `@provena/html` renderers.

## Global Constraints

- `Profile` is immutable; no projection mutates it (I2). Projectors never call each other (I8); they share `career.ts` primitives, never results.
- Selection is explicit (`includeExperienceIds` / `excludeExperienceIds`) — never a side effect of `omit` (I7).
- `cvProjector(profile, {})` must be byte-identical to `resumeProjector.project(profile)`.
- Summary priority: explicit `person.summary` wins unless `generateSummary: true`; auto-generate only with `targetRole`; no summary otherwise.
- `audience: 'recruiter'` omits projects; default and `'hiring-manager'` include them.
- The web Home render (COMPASS_HTML + experience list) must stay byte-identical after the `timeline.ts → profile` migration.
- Real profile data has `capabilityIds: []` — capability resolution MUST fall back to `technologies` when ids are empty, or the Compass output changes.
- Root typecheck: `npm run typecheck`. Web typecheck: `npm run typecheck -w packages/provena-web`. Tests: `npm test` (runs `node --import tsx --test packages/*/src/*.test.ts`).
- No new dependencies. Reuse existing renderers (`MarkdownResumeRenderer`, `HtmlResumeRenderer`).
- Do not add code comments unless they explain a deliberate shortcut (mark as `// ponytail:`).

---

### Task 1: `career.ts` primitives in `@provena/core`

**Files:**
- Create: `packages/core/src/career.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/career.test.ts`

**Interfaces:**
- Produces:
  - `export interface CareerExperience { organization: string; title: string; start: string; end: string | null; hitos?: number; capabilities: string[] }`
  - `export interface CareerTimeline { title: string; updatedAt: string; experiences: CareerExperience[] }`
  - `export interface Strength { name: string; count: number }`
  - `export interface Gap { organization: string; dates: string; milestones: number }`
  - `export function deriveStrengths(profile: Profile): Strength[]` — all strengths sorted by count desc
  - `export function deriveEvidenceCount(profile: Profile): number` — total achievements
  - `export function findEvidenceGaps(profile: Profile): Gap[]` — sorted by milestones asc; only past experiences when any exist, else all
  - `export function profileToTimeline(profile: Profile, updatedAt: string): CareerTimeline`
- Consumes: `Profile` type from `./profile.js`.

- [ ] **Step 1: Write the failing test**

Create `packages/core/src/career.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveStrengths, deriveEvidenceCount, findEvidenceGaps, profileToTimeline } from './career.js'
import type { Profile } from './profile.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Valentín Liñeiro Barea', title: 'Staff Software Engineer | Software Architecture', urls: {} },
      experienceIds: ['exp-1', 'exp-2'],
      projectIds: [], educationIds: [], publicationIds: [], certificationIds: [],
      recommendationIds: [], capabilityIds: [],
    },
    experiences: [
      {
        id: 'exp-1', organization: 'Summa Networks', title: 'Senior Software Engineer',
        start: '2025-10', achievements: ['a', 'b', 'c'],
        technologies: ['Java', 'Spring'], capabilityIds: [], evidenceIds: [],
      },
      {
        id: 'exp-2', organization: 'VINCLE', title: 'Software Engineer',
        start: '2017-01', end: '2021-06', achievements: ['d', 'e'],
        technologies: ['Java', 'Spring Boot', 'Angular'], capabilityIds: [], evidenceIds: [],
      },
    ],
    projects: [], education: [], publications: [], certifications: [],
    recommendations: [], capabilities: [], evidence: [],
  }
}

test('profileToTimeline maps achievements to hitos and technologies to capabilities', () => {
  const t = profileToTimeline(makeProfile(), '2026-07-30')
  assert.equal(t.title, 'Staff Software Engineer')
  assert.equal(t.updatedAt, '2026-07-30')
  assert.equal(t.experiences.length, 2)
  assert.equal(t.experiences[0]!.hitos, 3)
  assert.equal(t.experiences[0]!.capabilities[0], 'Java')
  assert.equal(t.experiences[1]!.end, '2021-06')
})

test('profileToTimeline falls back to technologies when capabilityIds are empty', () => {
  const profile = makeProfile()
  const t = profileToTimeline(profile, '2026-07-30')
  assert.deepEqual(t.experiences[0]!.capabilities, ['Java', 'Spring'])
})

test('deriveStrengths counts capability frequency across experiences, sorted desc', () => {
  const s = deriveStrengths(makeProfile())
  assert.deepEqual(s[0], { name: 'Java', count: 2 })
  assert.equal(s[1]!.count, 1)
})

test('deriveEvidenceCount sums achievements', () => {
  assert.equal(deriveEvidenceCount(makeProfile()), 5)
})

test('findEvidenceGaps considers only past experiences and sorts by milestones asc', () => {
  const gaps = findEvidenceGaps(makeProfile())
  assert.equal(gaps.length, 1)
  assert.equal(gaps[0]!.organization, 'VINCLE')
  assert.equal(gaps[0]!.milestones, 2)
  assert.equal(gaps[0]!.dates, '2017-01 — 2021-06')
})

test('a primitive never mutates the profile', () => {
  const profile = makeProfile()
  deriveStrengths(profile); deriveEvidenceCount(profile); findEvidenceGaps(profile); profileToTimeline(profile, 'x')
  assert.equal(profile.experiences.length, 2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/core/src/career.test.ts`
Expected: FAIL — module `./career.js` not found.

- [ ] **Step 3: Write minimal implementation**

Create `packages/core/src/career.ts`:

```ts
import type { Profile } from './profile.js'

export interface CareerExperience {
  organization: string
  title: string
  start: string
  end: string | null
  hitos?: number
  capabilities: string[]
}

export interface CareerTimeline {
  title: string
  updatedAt: string
  experiences: CareerExperience[]
}

export interface Strength {
  name: string
  count: number
}

export interface Gap {
  organization: string
  dates: string
  milestones: number
}

function orderedExperiences(profile: Profile) {
  const map = new Map(profile.experiences.map(e => [e.id, e]))
  return profile.identity.experienceIds.map(id => map.get(id)).filter((e): e is NonNullable<typeof e> => e !== undefined)
}

// ponytail: capabilityIds are empty in real data — technologies carry the signal.
// Resolution uses ids when present, else falls back to technologies.
function capabilityNames(profile: Profile, exp: { capabilityIds: readonly string[]; technologies: readonly string[] }): string[] {
  if (exp.capabilityIds.length > 0) {
    const map = new Map(profile.capabilities.map(c => [c.id, c]))
    return exp.capabilityIds.map(id => map.get(id)?.name).filter((n): n is string => n !== undefined)
  }
  return [...exp.technologies]
}

export function deriveStrengths(profile: Profile): Strength[] {
  const freq = new Map<string, number>()
  for (const e of orderedExperiences(profile)) {
    for (const c of capabilityNames(profile, e)) freq.set(c, (freq.get(c) ?? 0) + 1)
  }
  return [...freq.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function deriveEvidenceCount(profile: Profile): number {
  return orderedExperiences(profile).reduce((sum, e) => sum + e.achievements.length, 0)
}

export function findEvidenceGaps(profile: Profile): Gap[] {
  const all = orderedExperiences(profile)
  const candidates = all.some(e => e.end) ? all.filter(e => e.end) : all
  return candidates
    .map(e => ({
      organization: e.organization,
      dates: e.start + (e.end ? ' — ' + e.end : ' — present'),
      milestones: e.achievements.length,
    }))
    .sort((a, b) => a.milestones - b.milestones)
}

export function profileToTimeline(profile: Profile, updatedAt: string): CareerTimeline {
  return {
    title: (profile.identity.person.title ?? '').split('|')[0]!.trim(),
    updatedAt,
    experiences: orderedExperiences(profile).map(e => ({
      organization: e.organization,
      title: e.title,
      start: e.start,
      end: e.end ?? null,
      hitos: e.achievements.length,
      capabilities: capabilityNames(profile, e),
    })),
  }
}
```

- [ ] **Step 4: Export from core**

Edit `packages/core/src/index.ts`, add after the existing exports:

```ts
export type { CareerExperience, CareerTimeline, Strength, Gap } from './career.js'
export { deriveStrengths, deriveEvidenceCount, findEvidenceGaps, profileToTimeline } from './career.js'
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --import tsx --test packages/core/src/career.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/career.ts packages/core/src/career.test.ts packages/core/src/index.ts
git commit -m "feat(core): career primitives — strengths, evidence count, gaps, profile→timeline"
```

---

### Task 2: `cvProjector` in `@provena/core`

**Files:**
- Modify: `packages/core/src/projections.ts`
- Create: `packages/core/src/cv-projector.ts`
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/cv-projector.test.ts`

**Interfaces:**
- Consumes: `Profile` (`./profile.js`), `ResumeModel`/`Projector` (`./projections.js`), `deriveStrengths` (`./career.js`).
- Produces:
  - `export interface DecisionContext { targetRole?: string; audience?: 'recruiter' | 'hiring-manager'; emphasize?: readonly string[]; omit?: readonly string[] }`
  - `export interface CVContext extends DecisionContext { includeExperienceIds?: readonly string[]; excludeExperienceIds?: readonly string[]; generateSummary?: boolean }`
  - `export interface ProjectionMetadata { generatedSummary: boolean; selectedExperienceIds: string[]; excludedExperienceIds: string[]; emphasizedCapabilities: string[] }`
  - `export interface CVProjection { model: ResumeModel; metadata: ProjectionMetadata }`
  - `export function cvProjector(profile: Profile, context?: CVContext): CVProjection`
  - `export function buildResumeModel(profile: Profile, opts?: ResumeBuildOptions): ResumeModel` in `projections.ts`
  - `export interface ResumeBuildOptions { includeExperienceIds?: readonly string[]; excludeExperienceIds?: readonly string[]; emphasize?: readonly string[]; omit?: readonly string[] }`

- [ ] **Step 1: Refactor `projections.ts` to expose `buildResumeModel`**

Replace the `resumeProjector` implementation in `packages/core/src/projections.ts` (keep `RecruiterBriefModel`/`recruiterProjector` untouched). Add `ResumeBuildOptions` and extract the model building:

```ts
export interface ResumeBuildOptions {
  includeExperienceIds?: readonly string[]
  excludeExperienceIds?: readonly string[]
  emphasize?: readonly string[]
  omit?: readonly string[]
}

function resolveExperiences(profile: Profile, opts: ResumeBuildOptions = {}): Experience[] {
  const map = new Map(profile.experiences.map(e => [e.id, e]))
  const all = profile.identity.experienceIds.map(id => map.get(id)).filter((e): e is Experience => e !== undefined)
  const included = opts.includeExperienceIds && opts.includeExperienceIds.length > 0
    ? all.filter(e => opts.includeExperienceIds!.includes(e.id))
    : all
  return included.filter(e => !(opts.excludeExperienceIds ?? []).includes(e.id))
}

function reorderTechnologies(techs: readonly string[], emphasize: readonly string[], omit: readonly string[]): string[] {
  const present = techs.filter(t => !omit.includes(t))
  const [moved, rest] = [present.filter(t => emphasize.includes(t)), present.filter(t => !emphasize.includes(t))]
  return [...moved, ...rest]
}

export function buildResumeModel(profile: Profile, opts: ResumeBuildOptions = {}): ResumeModel {
  const experiences = resolveExperiences(profile, opts)
  const emphasize = opts.emphasize ?? []
  const omit = opts.omit ?? []
  return {
    name: profile.identity.person.name,
    email: profile.identity.person.email,
    location: profile.identity.person.location,
    urls: profile.identity.person.urls,
    summary: profile.identity.person.summary ?? '',
    experiences: experiences.map(e => ({
      organization: e.organization,
      title: e.title,
      start: e.start,
      end: e.end,
      summary: e.summary,
      achievements: e.achievements,
      technologies: reorderTechnologies(e.technologies, emphasize, omit),
    })),
    projects: resolve(profile.identity.projectIds, profile.projects).map(p => ({
      name: p.name,
      role: p.role,
      description: p.description,
      url: p.url,
      technologies: p.technologies,
    })),
    education: resolve(profile.identity.educationIds, profile.education),
    publications: resolve(profile.identity.publicationIds, profile.publications),
    certifications: resolve(profile.identity.certificationIds, profile.certifications),
    capabilities: [...new Set(experiences.flatMap(e => e.technologies))]
      .filter(t => !omit.includes(t))
      .map(name => ({ name: reorderTechnologies([name], emphasize, [])[0]!, description: undefined, evidenceCount: 0 })),
  }
}

export const resumeProjector: Projector<ResumeModel> = {
  project: (profile: Profile): ResumeModel => buildResumeModel(profile),
}
```

Note: the `capabilities` array keeps the original Set order; `emphasize` only affects per-experience tech lists, so the no-context snapshot stays byte-identical to the old `resumeProjector`. `Experience` and `resolve` are already imported in this file — verify at the top: `import type { Experience } from './types.js'`.

- [ ] **Step 2: Write the failing test**

Create `packages/core/src/cv-projector.test.ts`:

```ts
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
  assert.equal(cvProjector(p, { generateSummary: true, targetRole: 'Staff Software Engineer' }).model.summary, 'Staff Software Engineer with proven strengths in Java.')
  const noSummary = { ...p, identity: { ...p.identity, person: { ...p.identity.person, summary: undefined } } }
  assert.equal(cvProjector(noSummary).model.summary, '')
  assert.match(cvProjector(noSummary, { targetRole: 'Staff Software Engineer' }).model.summary, /Staff Software Engineer with proven strengths in Java\./)
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --import tsx --test packages/core/src/cv-projector.test.ts`
Expected: FAIL — module `./cv-projector.js` not found.

- [ ] **Step 4: Write minimal implementation**

Create `packages/core/src/cv-projector.ts`:

```ts
import type { Profile } from './profile.js'
import { buildResumeModel } from './projections.js'
import { deriveStrengths } from './career.js'
import type { ResumeModel } from './projections.js'

export interface DecisionContext {
  targetRole?: string
  audience?: 'recruiter' | 'hiring-manager'
  emphasize?: readonly string[]
  omit?: readonly string[]
}

export interface CVContext extends DecisionContext {
  includeExperienceIds?: readonly string[]
  excludeExperienceIds?: readonly string[]
  generateSummary?: boolean
}

export interface ProjectionMetadata {
  generatedSummary: boolean
  selectedExperienceIds: string[]
  excludedExperienceIds: string[]
  emphasizedCapabilities: string[]
}

export interface CVProjection {
  model: ResumeModel
  metadata: ProjectionMetadata
}

function autoSummary(profile: Profile, targetRole: string): string {
  const names = deriveStrengths(profile).slice(0, 3).map(s => s.name)
  return targetRole + ' with proven strengths in ' + names.join(', ') + '.'
}

export function cvProjector(profile: Profile, context: CVContext = {}): CVProjection {
  const allIds = profile.identity.experienceIds.filter(id => profile.experiences.some(e => e.id === id))
  const include = context.includeExperienceIds
  const selected = (include && include.length > 0 ? include.filter(id => allIds.includes(id)) : [...allIds])
    .filter(id => !(context.excludeExperienceIds ?? []).includes(id))
  const excluded = (context.excludeExperienceIds ?? []).filter(id => allIds.includes(id))

  const model = buildResumeModel(profile, {
    includeExperienceIds: selected,
    emphasize: context.emphasize,
    omit: context.omit,
  })

  const hasExplicit = !!profile.identity.person.summary
  const generate = context.generateSummary === true || (!hasExplicit && !!context.targetRole)
  if (generate && context.targetRole) {
    model.summary = autoSummary(profile, context.targetRole)
  }

  if (context.audience === 'recruiter') {
    model.projects = []
  }

  const emphasizedCapabilities = (context.emphasize ?? []).filter(name =>
    model.capabilities.some(c => c.name === name))

  return {
    model,
    metadata: {
      generatedSummary: generate && !!context.targetRole,
      selectedExperienceIds: selected,
      excludedExperienceIds: excluded,
      emphasizedCapabilities,
    },
  }
}
```

- [ ] **Step 5: Export from core**

Edit `packages/core/src/index.ts`, add after the `projections.js` exports:

```ts
export type { DecisionContext, CVContext, ProjectionMetadata, CVProjection } from './cv-projector.js'
export { cvProjector } from './cv-projector.js'
export type { ResumeBuildOptions } from './projections.js'
export { buildResumeModel } from './projections.js'
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `node --import tsx --test packages/core/src/cv-projector.test.ts packages/core/src/projections.test.ts`
Expected: PASS — all tests (new 9 + existing 3).

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/cv-projector.ts packages/core/src/cv-projector.test.ts packages/core/src/projections.ts packages/core/src/index.ts
git commit -m "feat(core): cvProjector with decision context, selection, and metadata"
```

---

### Task 3: Embed full `Profile` in the web

**Files:**
- Modify: `packages/provena-web/package.json`
- Create: `packages/provena-web/src/profile.ts`
- Delete: `packages/provena-web/src/timeline.ts`

**Interfaces:**
- Consumes: `YamlWorkspaceLoader` (`packages/yaml/src/yaml-workspace-loader.ts`) one-time to generate the embed.
- Produces: `packages/provena-web/src/profile.ts` — `export const updatedAt = '2026-07-30'` and `export default { ...profile... } satisfies Profile`.

- [ ] **Step 1: Add workspace dependencies to the web package**

Edit `packages/provena-web/package.json`, add to `devDependencies`:

```json
"@provena/core": "*",
"@provena/markdown": "*",
"@provena/html": "*"
```

Run: `npm install`
Expected: workspace symlinks created.

- [ ] **Step 2: Generate `profile.ts` from the valentin workspace**

Run from repo root (one-off generation, then committed):

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

Verify the file starts with `export const updatedAt` and ends with `satisfies Profile`.

- [ ] **Step 3: Verify the embed typechecks**

Run: `npm run typecheck -w packages/provena-web`
Expected: PASS — no errors (the generated `satisfies Profile` is valid).

- [ ] **Step 4: Delete `timeline.ts`**

```bash
git rm packages/provena-web/src/timeline.ts
```

- [ ] **Step 5: Commit**

```bash
git add packages/provena-web/package.json package-lock.json packages/provena-web/src/profile.ts
git commit -m "feat(web): embed full Profile, replacing reduced timeline model"
```

---

### Task 4: Refactor the Compass to consume `Profile`

**Files:**
- Modify: `packages/provena-web/src/compass.ts`
- Modify: `packages/provena-web/src/compass.test.ts`
- Modify: `packages/provena-web/src/index.ts`

**Interfaces:**
- Consumes: `computeCareerCompass` from `@provena/core` (Task 1 exports `deriveStrengths`, `deriveEvidenceCount`, `findEvidenceGaps`, `profileToTimeline`, types `CareerTimeline`, `Strength`, `Gap`).
- Produces: `computeCareerCompass(profile: Profile): CareerCompass` and `narrateCompass(compass: CareerCompass, timeline: CareerTimeline): CompassNarrative` — same shapes as today.

- [ ] **Step 1: Refactor `compass.ts`**

Rewrite `packages/provena-web/src/compass.ts` so the engine consumes `Profile` and uses the core primitives. Keep `CompassNarrative`, `narrateCompass`, `daysSince`, the state types, and the thresholds. Change only `computeCareerCompass`:

```ts
/// <reference types="@cloudflare/workers-types" />
import { deriveStrengths, deriveEvidenceCount, findEvidenceGaps } from '@provena/core'
import type { Profile } from '@provena/core'
import type { CareerTimeline, Strength, Gap } from '@provena/core'

export type { Strength, Gap } from '@provena/core'
export type { CareerExperience, CareerTimeline } from '@provena/core'

export type Positioning = 'insufficient-evidence' | 'developing' | 'positioned' | 'market-ready'
export type Readiness = 'unknown' | 'building' | 'ready'

export interface Recommendation {
  target: string
  text: string
}

// CareerHint reserved: strategy layer (which action maximizes your goal), populated after
// calibrating against diverse profiles — unlike nextBestImprovement (improvement layer).
export interface CareerHint {
  title: string
  rationale: string
  expectedImpact: 'low' | 'medium' | 'high'
}

export interface CareerCompass {
  positioning: Positioning
  readiness: Readiness
  strengths: Strength[]
  gaps: Gap[]
  nextBestImprovement: Recommendation
  confidence: number
  careerHint?: CareerHint
}

// ponytail: evidence-volume tiers, tune thresholds once real dogfooding data disagrees
const HITOS_DEVELOPING = 5
const HITOS_POSITIONED = 15

export function computeCareerCompass(profile: Profile): CareerCompass {
  if (profile.identity.experienceIds.length === 0) {
    throw new Error('CareerCompass requires at least one experience')
  }

  const strengths = deriveStrengths(profile).slice(0, 3)
  const totalHitos = deriveEvidenceCount(profile)

  const positioning: Positioning = totalHitos === 0
    ? 'insufficient-evidence'
    : totalHitos < HITOS_DEVELOPING ? 'developing'
    : totalHitos < HITOS_POSITIONED ? 'positioned' : 'market-ready'
  const readiness: Readiness = totalHitos === 0
    ? 'unknown'
    : totalHitos < HITOS_POSITIONED ? 'building' : 'ready'
  const confidence = Math.min(1, totalHitos / HITOS_POSITIONED)

  const gap = findEvidenceGaps(profile)[0]!
  const gaps: Gap[] = [gap]
  const nextBestImprovement: Recommendation = {
    target: gap.organization,
    text: 'document one high-impact milestone from that period, or one demonstrating cross-team impact',
  }

  return { positioning, readiness, strengths, gaps, nextBestImprovement, confidence }
}
```

Keep the rest of `compass.ts` (`CompassNarrative`, `daysSince`, `narrateCompass`) unchanged — `narrateCompass` still takes a `CareerTimeline` and reads `timeline.title`, `timeline.updatedAt`, and `timeline.experiences`.

- [ ] **Step 2: Update `compass.test.ts`**

Replace the `timeline` import and the `COMPASS` fixture. The test file currently imports `timeline` from `./timeline.js`. Change to build a `Profile` fixture. At the top:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCareerCompass, narrateCompass } from './compass.js'
import { profileToTimeline } from '@provena/core'
import profile, { updatedAt } from './profile.js'
import type { Profile } from '@provena/core'

const COMPASS = computeCareerCompass(profile)
const TIMELINE = profileToTimeline(profile, updatedAt)
```

Replace `timeline` references in assertions with `TIMELINE`:
- `narrateCompass(COMPASS, timeline)` → `narrateCompass(COMPASS, TIMELINE)`.
- The `sparse` fixture and the two `insufficient-evidence` fixtures become `Profile` literals. Example (`sparse`):

```ts
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
```

Apply the same transformation to the `imported` fixture in the progression test and the `insufficient-evidence` test (both currently build `CareerTimeline` objects with `hitos`/`capabilities`). Convert them to `Profile` literals with `achievements`/`technologies` matching the old hitos/capabilities, then wrap with `profileToTimeline`.

- [ ] **Step 3: Update `index.ts` to consume the Profile**

Edit `packages/provena-web/src/index.ts`:

```ts
/// <reference types="@cloudflare/workers-types" />
import { computeCareerCompass, narrateCompass } from './compass.js'
import { profileToTimeline } from '@provena/core'
import profile, { updatedAt } from './profile.js'
```

Replace the `COMPASS_HTML` IIFE with:

```ts
const TIMELINE = profileToTimeline(profile, updatedAt)

const COMPASS_HTML = (() => {
  const compass = computeCareerCompass(profile)
  const n = narrateCompass(compass, TIMELINE)
  const sections = [
    '<div class="status ' + (compass.readiness === 'ready' ? 'ok' : compass.readiness === 'unknown' ? 'neutral' : 'warn') + '">' + n.status + '</div>',
    '<p class="headline">' + n.headline + '</p>',
    n.strengths.length ? '<div class="fact"><span class="label">Strengths</span><ul>' + n.strengths.map(s => '<li>' + s + '</li>').join('') + '</ul></div>' : '',
    n.gapLabel ? '<div class="fact"><span class="label">Evidence gap</span><ul><li>' + n.gapLabel + '</li></ul></div>' : '',
    '<div class="fact"><span class="label">Next step</span><p>' + n.nextStep + '</p></div>',
    '<details class="why"><summary>Why this conclusion</summary><ul>' + n.why.map(l => '<li>' + l + '</li>').join('') + '</ul></details>',
  ].filter(Boolean).join('')
  return sections
})()
```

Then update every remaining reference to the old `timeline` in the page:
- `const timeline = ${JSON.stringify(timeline)}` → `const timeline = ${JSON.stringify(TIMELINE)}`
- `timeline.name` → `profile.identity.person.name` (header), so embed `const profile = ${JSON.stringify(profile)}` in the script.
- `timeline.title` → `TIMELINE.title` (still works, `TIMELINE` is available in module scope inside the template literal).
- `document.getElementById('experiences-summary').textContent` uses `timeline.experiences.length` — keep `TIMELINE` as the embedded `timeline` variable so the client JS needs minimal changes.

In the client script, the embedded variable stays named `timeline` (now = `TIMELINE`), and add `const profile = ${JSON.stringify(profile)}` before it. Update the header line:

```js
document.getElementById('name').textContent = profile.identity.person.name
```

- [ ] **Step 4: Run the compass tests**

Run: `node --import tsx --test packages/provena-web/src/compass.test.ts`
Expected: PASS — all tests (the real profile has 23 achievements → market-ready, strengths Java/Spring Boot/Python, gap VINCLE).

- [ ] **Step 5: Verify the Home render is byte-identical**

Run the compass test (above) — it asserts the exact narrative strings. Additionally confirm the module loads: `node --import tsx -e "import './packages/provena-web/src/index.ts'"`.
Expected: PASS, no throw.

- [ ] **Step 6: Typechecks**

Run: `npm run typecheck` and `npm run typecheck -w packages/provena-web`
Expected: PASS — no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/provena-web/src/compass.ts packages/provena-web/src/compass.test.ts packages/provena-web/src/index.ts
git commit -m "refactor(web): compass consumes Profile via core primitives"
```

---

### Task 5: `/cv` page and preview API

**Files:**
- Modify: `packages/provena-web/src/index.ts`
- Modify: `packages/provena-web/src/compass.test.ts` (optional addition, or new `packages/provena-web/src/cv.test.ts`)

**Interfaces:**
- Consumes: `cvProjector` + `CVContext` + `CVProjection` (`@provena/core`), `MarkdownResumeRenderer` (`@provena/markdown`), `HtmlResumeRenderer` (`@provena/html`), `profile`/`updatedAt` (`./profile.js`), `computeCareerCompass` (`./compass.js`).
- Produces: `GET /cv` HTML page; `POST /api/cv/preview` → `{ model, metadata, markdown, html }`.

- [ ] **Step 1: Write the failing test for the preview route**

Create `packages/provena-web/src/cv.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cvProjector } from '@provena/core'
import profile from './profile.js'

test('cvProjector on the embedded profile with a target role auto-generates a summary', () => {
  const { model, metadata } = cvProjector(profile, { targetRole: 'Staff Software Engineer' })
  assert.match(model.summary, /Staff Software Engineer with proven strengths/)
  assert.equal(metadata.generatedSummary, true)
})

test('cvProjector on the embedded profile with recruiter audience omits projects', () => {
  const { model } = cvProjector(profile, { audience: 'recruiter' })
  assert.equal(model.projects.length, 0)
})

test('cvProjector on the embedded profile without context matches resumeProjector', async () => {
  const { resumeProjector } = await import('@provena/core')
  assert.deepEqual(cvProjector(profile).model, resumeProjector.project(profile))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/provena-web/src/cv.test.ts`
Expected: PASS already (cvProjector works) — this test guards the embed, not new code. Skip to Step 3 if green.

- [ ] **Step 3: Add imports and the `/cv` page to `index.ts`**

Add to the imports at the top of `packages/provena-web/src/index.ts`:

```ts
import { cvProjector } from '@provena/core'
import type { CVContext, CVProjection } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'
import { HtmlResumeRenderer } from '@provena/html'
```

Add the page and handler. Before `export default`, add:

```ts
const markdownRenderer = new MarkdownResumeRenderer()
const htmlRenderer = new HtmlResumeRenderer()

const CV_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Prepare CV</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
main { max-width: 40rem; margin: 2rem auto; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
input, select { width: 100%; padding: 0.5rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.375rem; font-family: inherit; }
.check { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.check label { display: flex; align-items: center; gap: 0.25rem; text-transform: none; letter-spacing: 0; color: #333; font-size: 0.8125rem; background: #efefef; border-radius: 999px; padding: 0.25rem 0.625rem; margin: 0; }
.check input { width: auto; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
pre { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; font-size: 0.8125rem; white-space: pre-wrap; margin-top: 0.75rem; max-height: 24rem; overflow: auto; }
.meta { background: #fffbe6; border: 1px solid #e6d98a; border-radius: 0.5rem; padding: 0.625rem; font-size: 0.8125rem; color: #6b5b00; margin-top: 1rem; display: none; }
.row { display: flex; gap: 0.5rem; }
.row button { flex: 1; }
</style>
<main>
<h1>Prepare CV</h1>
<p class="subtitle">Target a role, review suggestions, export.</p>

<section>
  <label for="role">Target role</label>
  <input id="role" list="roles" placeholder="Staff Software Engineer">
  <datalist id="roles">
    <option value="Senior Software Engineer">
    <option value="Staff Software Engineer">
    <option value="Principal Software Engineer">
  </datalist>
</section>

<section>
  <label for="audience">Audience</label>
  <select id="audience">
    <option value="hiring-manager">Hiring manager</option>
    <option value="recruiter">Recruiter</option>
  </select>
</section>

<section>
  <label>Generate summary automatically</label>
  <div class="check"><label><input type="checkbox" id="autoSummary"> Auto-generate</label></div>
</section>

<section>
  <label>Experiences (uncheck to exclude)</label>
  <div class="check" id="experiences"></div>
</section>

<section>
  <label>Suggested emphasis (from your strengths — edit freely)</label>
  <div class="check" id="caps"></div>
</section>

<div class="meta" id="meta"></div>

<button onclick="preview()">Preview CV</button>
<div class="row">
  <button onclick="exportMd()">Download .md</button>
  <button onclick="exportHtml()">Open HTML / Print PDF</button>
</div>

<pre id="preview"></pre>
</main>
<script>
const profile = ${JSON.stringify(profile)}
const compass = ${JSON.stringify((() => { const c = (await (await import('@provena/core')).computeCareerCompass) ? null : null })())}
</script>
`

async function renderCV(context: CVContext): Promise<CVProjection> {
  return cvProjector(profile, context)
}

function cvContextFromBody(body: unknown): CVContext {
  const b = body as Record<string, unknown>
  const list = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  return {
    targetRole: typeof b.targetRole === 'string' ? b.targetRole : undefined,
    audience: b.audience === 'recruiter' || b.audience === 'hiring-manager' ? b.audience : undefined,
    emphasize: list(b.emphasize),
    omit: list(b.omit),
    includeExperienceIds: list(b.includeExperienceIds),
    excludeExperienceIds: list(b.excludeExperienceIds),
    generateSummary: b.generateSummary === true ? true : undefined,
  }
}
```

**Important:** the template literal embeds `profile` as JSON but must NOT embed `compass`/`CVProjection` this way (they are runtime values, not serializable at module load). Replace the closing `</script>` block above with a **static** page script (no `compass` IIFE), and inject the Compass **suggestions** as JSON:

```ts
const compassForPage = computeCareerCompass(profile)
const SUGGESTIONS = {
  strengths: compassForPage.strengths.map(s => s.name),
  gapLabel: compassForPage.gaps[0] ? compassForPage.gaps[0]!.organization + ' (' + compassForPage.gaps[0]!.milestones + ' milestone(s))' : '',
}
```

and in `CV_PAGE` embed `const suggestions = ${JSON.stringify(SUGGESTIONS)}` instead of the broken `compass` block above.

- [ ] **Step 4: Add the routes to the Worker fetch handler**

Edit `export default { async fetch(...) }` — add two branches before the `return new Response('Not found', ...)`:

```ts
if (request.method === 'GET' && url.pathname === '/cv') {
  return new Response(CV_PAGE, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

if (request.method === 'POST' && url.pathname === '/api/cv/preview') {
  try {
    const body = await request.json()
    const context = cvContextFromBody(body)
    const { model, metadata } = renderCV(context)
    return new Response(JSON.stringify({
      model,
      metadata,
      markdown: markdownRenderer.render(model),
      html: htmlRenderer.render(model),
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
  }
}
```

- [ ] **Step 5: Complete the client script in `CV_PAGE`**

The page needs client JS to (1) render the experience/capability chips, (2) POST to `/api/cv/preview`, (3) download markdown, (4) open HTML for print. Replace the placeholder `</script>` content with:

```html
<script>
const profile = ${JSON.stringify(profile)}
const suggestions = ${JSON.stringify(SUGGESTIONS)}

document.getElementById('experiences').innerHTML = profile.identity.experienceIds.map(id => {
  const e = profile.experiences.find(x => x.id === id)
  if (!e) return ''
  return '<label><input type="checkbox" data-exp="' + id + '" checked> ' + e.organization + '</label>'
}).join('')

document.getElementById('caps').innerHTML = suggestions.strengths.map(s =>
  '<label><input type="checkbox" data-cap="' + s + '" checked> ' + s + '</label>'
).join('')

function buildContext() {
  const role = document.getElementById('role').value.trim()
  const audience = document.getElementById('audience').value
  const excludeExperienceIds = [...document.querySelectorAll('[data-exp]')]
    .filter(el => !el.checked).map(el => el.dataset.exp)
  const emphasize = [...document.querySelectorAll('[data-cap]')]
    .filter(el => el.checked).map(el => el.dataset.cap)
  return {
    targetRole: role || undefined,
    audience,
    excludeExperienceIds,
    emphasize,
    generateSummary: document.getElementById('autoSummary').checked ? true : undefined,
  }
}

let lastResult = null

async function preview() {
  const res = await fetch('/api/cv/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildContext()),
  })
  if (!res.ok) { document.getElementById('preview').textContent = 'Error: ' + await res.text(); return }
  lastResult = await res.json()
  document.getElementById('preview').textContent = lastResult.markdown
  const m = lastResult.metadata
  const parts = []
  parts.push('Included ' + m.selectedExperienceIds.length + ' of ' + profile.identity.experienceIds.length + ' experiences.')
  if (m.generatedSummary) parts.push('Summary generated automatically.')
  if (m.emphasizedCapabilities.length) parts.push(m.emphasizedCapabilities.length + ' capabilities emphasized.')
  const meta = document.getElementById('meta')
  meta.textContent = parts.join(' ')
  meta.style.display = parts.length ? 'block' : 'none'
}

function exportMd() {
  if (!lastResult) return
  const blob = new Blob([lastResult.markdown], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cv.md'
  a.click()
}

function exportHtml() {
  if (!lastResult) return
  const w = window.open('', '_blank')
  if (w) { w.document.write(lastResult.html); w.document.close(); w.focus() }
}

preview()
</script>
```

- [ ] **Step 6: Typecheck and test**

Run: `npm run typecheck` and `npm run typecheck -w packages/provena-web`
Expected: PASS.
Run: `node --import tsx --test packages/provena-web/src/cv.test.ts`
Expected: PASS — 3 tests.

- [ ] **Step 7: Manual smoke test**

Run: `npm run typecheck` then `npx wrangler dev` in `packages/provena-web` (or `npm run dev -w packages/provena-web`).
Expected: `http://localhost:8787/cv` shows the form; clicking "Preview CV" renders markdown; "Download .md" downloads; "Open HTML / Print PDF" opens a print-styled page; the meta line shows "Included 5 of 5 experiences."

- [ ] **Step 8: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/cv.test.ts
git commit -m "feat(web): Prepare CV page with preview and export"
```

---

### Task 6: Full verification and documentation

**Files:**
- Modify: `docs/architecture.md` (add the Selection → Presentation → Rendering principle and the I7/I8 invariants)
- No code changes unless a test fails.

- [ ] **Step 1: Run the full suite**

Run: `npm test`
Expected: PASS — every `packages/*/src/*.test.ts` test (projections, cv-projector, career, compass, web cv, markdown, html, jsonresume, linkedin, yaml, cli, e2e, validate).

- [ ] **Step 2: Run both typechecks**

Run: `npm run typecheck` and `npm run typecheck -w packages/provena-web`
Expected: PASS — no errors.

- [ ] **Step 3: Verify `timeline.ts` is gone**

Run: `git status` and `git ls-files packages/provena-web/src`
Expected: no `timeline.ts`; files are `index.ts`, `compass.ts`, `compass.test.ts`, `profile.ts`, `cv.test.ts`, `tsconfig.json`, `package.json`, `wrangler.jsonc`.

- [ ] **Step 4: Document the projection principle in `docs/architecture.md`**

Append to the invariants section:

```markdown
### Projection principle

A projection is `Profile → TModel` with phases executed in order:
`Selection → Presentation → Summary → Rendering`. Selection decides which
experiences are included (explicit, or later derived from the target role);
Presentation orders and filters capabilities; Summary generates the narrative
(Explicit → Auto → none); Rendering serializes a representation. The `Profile`
is never adapted — only the projections change.

### I7 — Selection is explicit or target-role-derived
A technology list can never remove an experience. Experience selection is a
high-level decision with its own rule.

### I8 — Projectors share primitives, never results
The Career Compass and the CV projector both consume `career.ts` primitives
(`deriveStrengths`, `deriveEvidenceCount`, `findEvidenceGaps`). Neither calls
the other. If the Compass's weighting changes, the CV does not change unless
the underlying primitive changes.
```

- [ ] **Step 5: Commit**

```bash
git add docs/architecture.md
git commit -m "docs(architecture): projection principle and I7/I8 invariants"
```

---

## Self-Review Notes

- `profileToTimeline` falls back to `technologies` when `capabilityIds` is empty — required because the real valentin profile has `capabilityIds: []` and the old `timeline.ts` capabilities match its technologies. Without this the Compass output (and Home render) would change.
- `cvProjector` builds its model via `buildResumeModel` with `includeExperienceIds: selected`, guaranteeing the no-context case is byte-identical to `resumeProjector` (same resolution, same Set order, no reordering without `emphasize`).
- `cvProjector` never imports `computeCareerCompass` — it uses `deriveStrengths` directly for the auto-summary, preserving I8.
- The `/cv` page embeds only serializable JSON (`profile`, `suggestions`); the projection runs server-side in `POST /api/cv/preview`.
- Compass suggestions render as pre-checked but editable chips; the user's selection is what ships to the projector (Suggested, not Applied).
