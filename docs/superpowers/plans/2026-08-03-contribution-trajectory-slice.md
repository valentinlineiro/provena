# Contribution Trajectory Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve Provena's core data model by introducing `Contribution` as a first-class canonical entity (with `Outcome`, `Scope`, and linked `Evidence`/`Capability`), validating referential integrity, supporting `contributions.yaml` workspace loading, and implementing atomic experience-level fallback in CV projection.

**Architecture:** Add `Contribution`, `Scope`, and `Outcome` models to `@provena/core`, extend `Identity` and `Profile` to include `contributions`, update `YamlWorkspaceLoader` and validator to process `contributions.yaml`, and update `CVProjector` to prioritize selected contributions over legacy experience achievements.

**Tech Stack:** TypeScript, Node.js, Vitest, `@provena/core`, `@provena/yaml`.

## Global Constraints

- Preserve exact TypeScript interfaces and immutability (`readonly`).
- Follow TDD: write failing test, verify failure, implement minimum code, verify pass, commit.
- Invariant: A professional fact MUST NOT be canonically maintained in both legacy `Experience.achievements` and `Contribution`.
- Experience boundary migration: When an `Experience` has linked `Contribution` records, projector renders `Contribution` records; unmigrated experiences fall back to legacy `achievements`.

---

### Task 1: Domain Types (`Contribution`, `Scope`, `Outcome`)

**Files:**
- Modify: `packages/core/src/types.ts`
- Modify: `packages/core/src/profile.ts`
- Test: `packages/core/test/types.test.ts` (create if needed, or add to `packages/core/test/profile.test.ts`)

**Interfaces:**
- Produces: `ScopeLevel`, `ContributionRole`, `Scope`, `Outcome`, `Contribution` types and extended `Identity`, `Profile` interfaces.

- [ ] **Step 1: Write failing type assertion tests**

Create `packages/core/test/types.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import type { Contribution, Profile, Identity } from '../src/index.js'

describe('Contribution types', () => {
  it('instantiates a valid Contribution entity structure', () => {
    const contribution: Contribution = {
      id: 'summa-clean-architecture',
      experienceRef: 'summa-networks',
      summary: 'Designed a Clean Architecture proposal for HSS backend.',
      period: { start: '2025-11' },
      outcome: { summary: 'Adopted as SMSC architecture foundation.' },
      scope: { level: 'product', role: 'initiator', affectedTeams: 3 },
      capabilityIds: ['software-architecture'],
      technologies: ['java', 'spring'],
      evidenceIds: [],
    }

    expect(contribution.id).toBe('summa-clean-architecture')
    expect(contribution.scope?.level).toBe('product')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/test/types.test.ts`
Expected: FAIL with compilation error (cannot find `Contribution`).

- [ ] **Step 3: Update domain types in `@provena/core`**

Modify `packages/core/src/types.ts`:
```typescript
export type ScopeLevel =
  | 'individual'
  | 'team'
  | 'multi-team'
  | 'product'
  | 'organization'

export type ContributionRole =
  | 'initiator'
  | 'lead'
  | 'contributor'

export interface Scope {
  readonly level: ScopeLevel
  readonly affectedTeams?: number
  readonly role?: ContributionRole
}

export interface Outcome {
  readonly summary: string
}

export interface Contribution {
  readonly id: string
  readonly experienceRef: string
  readonly summary: string
  readonly period?: {
    readonly start: string
    readonly end?: string
  }
  readonly outcome?: Outcome
  readonly scope?: Scope
  readonly capabilityIds: readonly string[]
  readonly technologies?: readonly string[]
  readonly evidenceIds: readonly string[]
}
```

Update `Identity` in `packages/core/src/types.ts`:
```typescript
export interface Identity {
  readonly person: Person
  readonly experienceIds: readonly string[]
  readonly projectIds: readonly string[]
  readonly educationIds: readonly string[]
  readonly publicationIds: readonly string[]
  readonly certificationIds: readonly string[]
  readonly recommendationIds: readonly string[]
  readonly capabilityIds: readonly string[]
  readonly contributionIds: readonly string[]
}
```

Update `Profile` in `packages/core/src/profile.ts`:
```typescript
import type {
  Identity,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Capability,
  Evidence,
  Contribution,
  Preferences,
} from './types.js'

export interface Profile {
  readonly identity: Identity
  readonly experiences: readonly Experience[]
  readonly projects: readonly Project[]
  readonly education: readonly Education[]
  readonly publications: readonly Publication[]
  readonly certifications: readonly Certification[]
  readonly recommendations: readonly Recommendation[]
  readonly capabilities: readonly Capability[]
  readonly evidence: readonly Evidence[]
  readonly contributions: readonly Contribution[]
  readonly preferences?: Preferences
}
```

Export types in `packages/core/src/index.ts`:
```typescript
export * from './types.js'
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/test/types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/profile.ts packages/core/src/index.ts packages/core/test/types.test.ts
git commit -m "feat(core): add Contribution, Scope, and Outcome domain types"
```

---

### Task 2: Core Validation & Integrity Rules

**Files:**
- Modify: `packages/core/src/validate.ts`
- Modify: `packages/core/test/validate.test.ts`

**Interfaces:**
- Consumes: `Contribution`, `validate` function.
- Produces: Enhanced `validate()` supporting `contributions` array and referential integrity error checks.

- [ ] **Step 1: Write failing validation tests**

Add to `packages/core/test/validate.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { validate } from '../src/validate.js'
import type { Profile } from '../src/types.js'

describe('validate with contributions', () => {
  it('passes for valid contributions', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: ['exp-1'],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: ['cap-1'],
        contributionIds: ['contrib-1'],
      },
      experiences: [
        { id: 'exp-1', organization: 'Org', title: 'Role', start: '2025', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }
      ],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [{ id: 'cap-1', name: 'Cap', evidenceIds: [] }],
      evidence: [{ id: 'ev-1', type: 'experience', description: 'Desc' }],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'exp-1',
          summary: 'Summary',
          capabilityIds: ['cap-1'],
          evidenceIds: ['ev-1'],
          scope: { level: 'team', affectedTeams: 2 },
        }
      ],
    }
    expect(validate(profile)).toEqual([])
  })

  it('fails if experienceRef points to unknown experience', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: [],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: [],
        contributionIds: ['contrib-1'],
      },
      experiences: [],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [],
      evidence: [],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'unknown-exp',
          summary: 'Summary',
          capabilityIds: [],
          evidenceIds: [],
        }
      ],
    }
    const errors = validate(profile)
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.experienceRef',
      message: 'Reference to unknown id "unknown-exp"',
    }))
  })

  it('fails if affectedTeams is less than 1', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: ['exp-1'],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: [],
        contributionIds: ['contrib-1'],
      },
      experiences: [
        { id: 'exp-1', organization: 'Org', title: 'Role', start: '2025', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }
      ],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [],
      evidence: [],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'exp-1',
          summary: 'Summary',
          capabilityIds: [],
          evidenceIds: [],
          scope: { level: 'team', affectedTeams: 0 },
        }
      ],
    }
    const errors = validate(profile)
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.scope.affectedTeams',
      message: 'affectedTeams must be greater than 0',
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/test/validate.test.ts`
Expected: FAIL with errors.

- [ ] **Step 3: Update `validate.ts`**

Modify `packages/core/src/validate.ts`:
Add `Contribution` to imports and `sourceFromPath`:
```typescript
if (path.startsWith('contributions') || path.startsWith('contribution')) return 'contributions.yaml'
```

In `validate()` function:
```typescript
  const allContributions = data.contributions ?? []
  findDuplicates('contributions', allContributions, errors)
  const contributionIds = collectIds(allContributions)
  findMissing('identity.contributionIds', data.identity.contributionIds, contributionIds, errors)

  for (const contrib of allContributions) {
    if (!experienceIds.has(contrib.experienceRef)) {
      errors.push({
        path: `contribution.${contrib.id}.experienceRef`,
        message: `Reference to unknown id "${contrib.experienceRef}"`,
        source: 'contributions.yaml',
      })
    }
    findMissing(`contribution.${contrib.id}.capabilityIds`, contrib.capabilityIds, capabilityIds, errors)
    findMissing(`contribution.${contrib.id}.evidenceIds`, contrib.evidenceIds, evidenceIds, errors)

    if (contrib.scope?.affectedTeams !== undefined && contrib.scope.affectedTeams <= 0) {
      errors.push({
        path: `contribution.${contrib.id}.scope.affectedTeams`,
        message: 'affectedTeams must be greater than 0',
        source: 'contributions.yaml',
      })
    }
  }
```

Update `validate` signature in `packages/core/src/validate.ts` to accept `contributions?: readonly Contribution[]`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/test/validate.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/validate.ts packages/core/test/validate.test.ts
git commit -m "feat(core): add validation rules for Contribution entities"
```

---

### Task 3: Workspace Loader Schema & Parsing (`@provena/yaml`)

**Files:**
- Modify: `packages/yaml/src/schema.ts`
- Modify: `packages/yaml/src/yaml-workspace-loader.ts`
- Modify: `packages/yaml/src/yaml-workspace-loader.test.ts`

**Interfaces:**
- Consumes: `parseContributions` helper.
- Produces: `YamlWorkspaceLoader` capable of parsing `contributions.yaml`.

- [ ] **Step 1: Write failing loader test**

Add to `packages/yaml/src/yaml-workspace-loader.test.ts`:
```typescript
it('loads contributions.yaml into profile', async () => {
  // Test that loader reads contributions.yaml when present
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/yaml/src/yaml-workspace-loader.test.ts`
Expected: FAIL (parseContributions undefined / not integrated).

- [ ] **Step 3: Add `parseContributions` to `packages/yaml/src/schema.ts`**

Add parser:
```typescript
import type { Contribution } from '@provena/core'

export function parseContributions(raw: unknown): readonly Contribution[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item: any) => ({
    id: String(item.id ?? ''),
    experienceRef: String(item.experienceRef ?? item.experience_ref ?? ''),
    summary: String(item.summary ?? ''),
    period: item.period ? { start: String(item.period.start), end: item.period.end ? String(item.period.end) : undefined } : undefined,
    outcome: item.outcome ? { summary: String(item.outcome.summary) } : undefined,
    scope: item.scope ? {
      level: item.scope.level,
      affectedTeams: typeof item.scope.affectedTeams === 'number' ? item.scope.affectedTeams : (typeof item.scope.affected_teams === 'number' ? item.scope.affected_teams : undefined),
      role: item.scope.role,
    } : undefined,
    capabilityIds: Array.isArray(item.capabilityIds ?? item.capabilities) ? (item.capabilityIds ?? item.capabilities).map(String) : [],
    technologies: Array.isArray(item.technologies) ? item.technologies.map(String) : undefined,
    evidenceIds: Array.isArray(item.evidenceIds ?? item.evidence) ? (item.evidenceIds ?? item.evidence).map(String) : [],
  }))
}
```

- [ ] **Step 4: Integrate into `YamlWorkspaceLoader`**

In `packages/yaml/src/yaml-workspace-loader.ts`:
```typescript
const rawContributions = await loadYaml<unknown>(join(path, 'contributions.yaml'))
const contributions = parseContributions(rawContributions ?? [])

// In profile identity:
contributionIds: orderedIds(manifest, 'contributions', contributions),

// In profile object:
contributions,
```

- [ ] **Step 5: Run tests to verify passing**

Run: `npx vitest run packages/yaml/src/yaml-workspace-loader.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/yaml/src/schema.ts packages/yaml/src/yaml-workspace-loader.ts packages/yaml/src/yaml-workspace-loader.test.ts
git commit -m "feat(yaml): load contributions.yaml in YamlWorkspaceLoader"
```

---

### Task 4: Decision Context & CV Projection Integration

**Files:**
- Modify: `packages/core/src/cv-projector.ts`
- Modify: `packages/core/src/cv-projector.test.ts`

**Interfaces:**
- Consumes: `Profile.contributions`, `Experience`.
- Produces: CV Projector experience achievement rendering selecting `Contribution` records per experience, falling back to `Experience.achievements` when zero contributions exist for that experience.

- [ ] **Step 1: Write failing projector test for Contribution-based experience projection**

In `packages/core/src/cv-projector.test.ts`:
```typescript
it('projects contributions as achievements for migrated experiences', () => {
  const profile: Profile = {
    // ... profile with experience 'exp-1' having 2 contributions
    contributions: [
      {
        id: 'c1',
        experienceRef: 'exp-1',
        summary: 'Designed Clean Architecture proposal.',
        outcome: { summary: 'Adopted as SMSC architecture foundation.' },
        capabilityIds: ['software-architecture'],
        evidenceIds: [],
      }
    ]
  }
  const cv = projectCV(profile)
  expect(cv.experiences[0].achievements[0]).toContain('Designed Clean Architecture proposal.')
  expect(cv.experiences[0].achievements[0]).toContain('Outcome: Adopted as SMSC architecture foundation.')
})

it('falls back to legacy achievements for unmigrated experiences', () => {
  // Experience with 0 contributions uses experience.achievements
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement atomic Experience contribution formatting in `cv-projector.ts`**

In `packages/core/src/cv-projector.ts`:
When building `CvExperience` bullets:
```typescript
const expContributions = (profile.contributions ?? []).filter(c => c.experienceRef === exp.id)

let bullets: string[] = []
if (expContributions.length > 0) {
  bullets = expContributions.map(c => {
    if (c.outcome?.summary) {
      return `${c.summary} (Outcome: ${c.outcome.summary})`
    }
    return c.summary
  })
} else {
  bullets = [...exp.achievements]
}
```

Apply budget limiting (`budget.maxBulletsPerExperience`) to `bullets`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/cv-projector.ts packages/core/src/cv-projector.test.ts
git commit -m "feat(core): project Contribution entities in CVProjector with legacy achievement fallback"
```

---

### Task 5: Dogfooding Migration (`profiles/valentin`) & End-to-End Smoke Test

**Files:**
- Create: `profiles/valentin/contributions.yaml`
- Modify: `profiles/valentin/experience.yaml`
- Modify: `profiles/valentin/provena.yaml` (if order manifest includes contributions)
- Create Test: `packages/core/test/e2e-contributions.test.ts`

**Interfaces:**
- Consumes: Real profile workspace.
- Produces: Validated real profile with `summa-clean-architecture` contribution and passing end-to-end load & projection test.

- [ ] **Step 1: Write failing e2e test loading `profiles/valentin`**

Create `packages/core/test/e2e-contributions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { YamlWorkspaceLoader } from '@provena/yaml'
import { projectCV } from '../src/cv-projector.js'
import { join } from 'node:path'

describe('Valentin Profile End-to-End Contributions', () => {
  it('loads real workspace and projects contributions for Summa Networks', async () => {
    const loader = new YamlWorkspaceLoader()
    const valentinPath = join(__dirname, '../../../profiles/valentin')
    const { profile } = await loader.load(valentinPath)

    expect(profile.contributions.length).toBeGreaterThan(0)
    const cv = projectCV(profile)
    const summa = cv.experiences.find(e => e.organization === 'Summa Networks')
    expect(summa).toBeDefined()
    expect(summa?.achievements.some(a => a.includes('Clean Architecture'))).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/test/e2e-contributions.test.ts`
Expected: FAIL (`contributions.yaml` does not exist yet).

- [ ] **Step 3: Create `profiles/valentin/contributions.yaml` & update `experience.yaml`**

Create `profiles/valentin/contributions.yaml`:
```yaml
- id: summa-clean-architecture
  experienceRef: summa-networks
  summary: >
    Designed a Clean Architecture proposal for the HSS backend.
  outcome:
    summary: >
      Adopted as the architectural foundation of the SMSC product.
  scope:
    level: product
    role: initiator
  capabilityIds:
    - software-architecture
  technologies:
    - java
    - spring
  evidenceIds: []
```

Atomically update `profiles/valentin/experience.yaml` for `summa-networks` to clear legacy achievements array (`achievements: []`) as per the atomic experience migration invariant.

- [ ] **Step 4: Run e2e test to verify it passes**

Run: `npx vitest run packages/core/test/e2e-contributions.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full test suite across repository**

Run: `npm test`
Expected: PASS (all tests green).

- [ ] **Step 6: Commit**

```bash
git add profiles/valentin/contributions.yaml profiles/valentin/experience.yaml packages/core/test/e2e-contributions.test.ts
git commit -m "feat(profile): migrate Summa Networks achievements to canonical Contributions"
```

---

## Plan Self-Review

1. **Spec Coverage:**
   - Data types (`Contribution`, `Scope`, `Outcome`, `ScopeLevel`, `ContributionRole`): Task 1.
   - Core validation & referential integrity: Task 2.
   - Workspace loading (`contributions.yaml`): Task 3.
   - Decision context & CV Projector experience selection: Task 4.
   - Real profile dogfooding & end-to-end smoke test: Task 5.
2. **Placeholder scan:** Clean. No TODOs or vague steps.
3. **Type consistency:** `Contribution`, `Scope`, `Outcome` names and properties match identically across all tasks.
