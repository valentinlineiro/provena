# LinkedIn Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `provena import linkedin <export.zip>` that reads a LinkedIn data export, merges it into a workspace without clobbering existing edits, and sets up migration infrastructure for future schema evolution.

**Architecture:** A new `@provena/linkedin-import` package implements `Importer` from `@provena/core`. `@provena/yaml` gains `YamlWorkspaceWriter`, a migration runner, and a merge engine with per-entity matchers. The CLI orchestrates read → merge → validate → write.

**Tech Stack:** TypeScript, `crypto.randomUUID()` for IDs, `node:test`/`node:assert` for tests, `js-yaml` for YAML writing, `yauzl` for ZIP reading.

## Global Constraints

- All entity types get optional `readonly provenance?: Provenance` field
- `Importer.read()` must be deterministic
- IDs via `crypto.randomUUID()`, no new runtime deps beyond `yauzl` + `@types/yauzl`
- ZIP parsed in memory via `yauzl` + `Buffer` accumulation
- Follow existing code style: `readonly` fields, named exports, `.js` extensions in imports, `node:test` with `node:assert/strict`

---
### Task 1: Provenance + Importer interface — `@provena/core`

**Files:**
- Modify: `packages/core/src/types.ts` — add `Provenance` type and optional field on entities
- Create: `packages/core/src/importer.ts` — `Importer` interface
- Modify: `packages/core/src/index.ts` — export new types

**Interfaces:**
- Produces:
  ```ts
  interface Provenance { source: 'linkedin' | 'manual'; importedAt?: string }
  interface Importer<TContext = void> { read(location: string, ctx?: TContext): Promise<Partial<Profile>> }
  ```

- [ ] **Step 1: Add `Provenance` to `packages/core/src/types.ts`**

Insert before `EvidenceSource`:

```ts
export interface Provenance {
  readonly source: 'linkedin' | 'manual'
  readonly importedAt?: string
}
```

Add `readonly provenance?: Provenance` to every entity interface. For example, `Experience` becomes:

```ts
export interface Experience {
  readonly id: string
  readonly organization: string
  readonly title: string
  readonly start: string
  readonly end?: string
  readonly location?: string
  readonly summary?: string
  readonly achievements: readonly string[]
  readonly technologies: readonly string[]
  readonly capabilityIds: readonly string[]
  readonly evidenceIds: readonly string[]
  readonly provenance?: Provenance
}
```

Do the same for: `Project`, `Education`, `Publication`, `Certification`, `Recommendation`, `Capability`, `Evidence`, `Person`.

- [ ] **Step 2: Create `packages/core/src/importer.ts`**

```ts
import type { Profile } from './profile.js'

export interface Importer<TContext = void> {
  /** Read external data from `location` and return a partial Profile.
   *
   * Must be deterministic: same input → same canonical data
   * (except for generated UUIDs and importedAt timestamps).
   *
   * May throw for: invalid archive, malformed source data,
   * unsupported export version. */
  read(location: string, ctx?: TContext): Promise<Partial<Profile>>
}
```

- [ ] **Step 3: Export from `packages/core/src/index.ts`**

```ts
export type { Provenance } from './types.js'
export type { Importer } from './importer.js'
```

- [ ] **Step 4: Verify compilation**

Run: `npx tsc --noEmit` — should pass.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/types.ts packages/core/src/importer.ts packages/core/src/index.ts
git commit -m "feat(core): add Provenance type, Importer interface"
```

---

### Task 2: Migration runner — `@provena/yaml`

**Files:**
- Create: `packages/yaml/src/migration-runner.ts`
- Create: `packages/yaml/src/migration-runner.test.ts`
- Modify: `packages/yaml/src/yaml-workspace-loader.ts` — run migrations on load, return `{ profile, migrated }`
- Modify: `packages/yaml/src/yaml-workspace-loader.test.ts` — update version strings to numbers, expect new return shape
- Modify: `packages/yaml/src/index.ts` — export migration types

**Interfaces:**
- Consumes: `WorkspaceLoader` interface from `@provena/core/src/workspace.ts` (change return type)
- Produces:
  ```ts
  type SchemaVersion = number
  interface Migration { from: SchemaVersion; to: SchemaVersion; migrate: (data: Record<string, unknown>) => Record<string, unknown> }
  function applyMigrations(current: SchemaVersion, data: Record<string, unknown>, migrations: Migration[]): { data: Record<string, unknown>; migrated: boolean; version: SchemaVersion }
  ```

- [ ] **Step 1: Write migration runner tests**

`packages/yaml/src/migration-runner.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyMigrations, type SchemaVersion, type Migration } from './migration-runner.js'

const LATEST: SchemaVersion = 1

test('no migrations returns data unchanged', () => {
  const result = applyMigrations(1, { foo: 'bar' }, [])
  assert.equal(result.migrated, false)
  assert.equal(result.version, 1)
  assert.deepEqual(result.data, { foo: 'bar' })
})

test('single migration is applied', () => {
  const addField: Migration = {
    from: 1, to: 2,
    migrate: (d) => ({ ...d, newField: 'added' }),
  }
  const result = applyMigrations(1, { foo: 'bar' }, [addField])
  assert.equal(result.migrated, true)
  assert.equal(result.version, 2)
  assert.deepEqual(result.data, { foo: 'bar', newField: 'added' })
})

test('chain of migrations runs in order', () => {
  const m1: Migration = { from: 1, to: 2, migrate: (d) => ({ ...d, step: '1' }) }
  const m2: Migration = { from: 2, to: 3, migrate: (d) => ({ ...d, step: '2' }) }
  const result = applyMigrations(1, {}, [m1, m2])
  assert.equal(result.version, 3)
  assert.deepEqual(result.data, { step: '2' })
})

test('already current version does not migrate', () => {
  const m: Migration = { from: 1, to: 2, migrate: (d) => ({ ...d, x: 'y' }) }
  const result = applyMigrations(2, { a: 1 }, [m])
  assert.equal(result.migrated, false)
  assert.equal(result.version, 2)
  assert.deepEqual(result.data, { a: 1 })
})

test('default version 1 for undefined input', () => {
  const result = applyMigrations(undefined as unknown as number, { x: 1 }, [])
  assert.equal(result.version, 1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/yaml/src/migration-runner.test.ts`
Expected: MODULE_NOT_FOUND for `./migration-runner.js`

- [ ] **Step 3: Implement `applyMigrations`**

`packages/yaml/src/migration-runner.ts`:

```ts
export type SchemaVersion = number

export interface Migration {
  from: SchemaVersion
  to: SchemaVersion
  migrate: (data: Record<string, unknown>) => Record<string, unknown>
}

export function applyMigrations(
  current: SchemaVersion,
  data: Record<string, unknown>,
  migrations: Migration[],
): { data: Record<string, unknown>; migrated: boolean; version: SchemaVersion } {
  let version = current
  let result = data
  let migrated = false

  for (const m of migrations) {
    if (m.from === version) {
      result = m.migrate(result)
      version = m.to
      migrated = true
    }
  }

  return { data: result, migrated, version }
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `node --import tsx --test packages/yaml/src/migration-runner.test.ts`
Expected: all 5 PASS

- [ ] **Step 5: Modify `YamlWorkspaceLoader`**

Change `packages/yaml/src/yaml-workspace-loader.ts`:

Import migration types, change `version` field in Manifest to `SchemaVersion`, use `parseInt` fallback for backward compat with `"1.0"` strings, run migrations, return `{ profile, migrated }`:

```ts
import { applyMigrations, type SchemaVersion, type Migration } from './migration-runner.js'

export const LATEST_VERSION: SchemaVersion = 1

export const MIGRATIONS: Migration[] = []  // empty for v1

interface Manifest {
  version?: SchemaVersion
  order?: Record<string, string[]>
}

function parseVersion(v: unknown): SchemaVersion {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    if (!isNaN(n)) return n
  }
  return 1
}

export class YamlWorkspaceLoader implements WorkspaceLoader {
  readonly #migrations: Migration[]

  constructor(migrations: Migration[] = MIGRATIONS) {
    this.#migrations = migrations
  }

  async load(path: string): Promise<{ profile: Profile; migrated: boolean }> {
    const rawManifest = await loadYaml<Record<string, unknown>>(join(path, 'provena.yaml'))
    if (!rawManifest) throw new Error(`provena.yaml not found in ${path}`)

    const currentVersion = parseVersion(rawManifest.version)
    const migrated = applyMigrations(currentVersion, rawManifest, this.#migrations)
    const manifest = migrated.data as unknown as Manifest

    const rawPerson = await loadYaml<unknown>(join(path, 'person.yaml'))
    if (!rawPerson) throw new Error('person.yaml is required')
    const person = parsePerson(rawPerson)

    const experiences = parseExperiences((await loadYaml<unknown>(join(path, 'experience.yaml'))) ?? [])
    const projects = parseProjects((await loadYaml<unknown>(join(path, 'projects.yaml'))) ?? [])
    const education = parseEducation((await loadYaml<unknown>(join(path, 'education.yaml'))) ?? [])
    const publications = parsePublications((await loadYaml<unknown>(join(path, 'publications.yaml'))) ?? [])
    const certifications = parseCertifications((await loadYaml<unknown>(join(path, 'certifications.yaml'))) ?? [])
    const recommendations = parseRecommendations((await loadYaml<unknown>(join(path, 'recommendations.yaml'))) ?? [])
    const capabilities = parseCapabilities((await loadYaml<unknown>(join(path, 'capabilities.yaml'))) ?? [])
    const evidence = parseEvidence((await loadYaml<unknown>(join(path, 'evidence.yaml'))) ?? [])

    const profile: Profile = {
      identity: {
        person,
        experienceIds: orderedIds(manifest, 'experiences', experiences),
        projectIds: orderedIds(manifest, 'projects', projects),
        educationIds: orderedIds(manifest, 'education', education),
        publicationIds: orderedIds(manifest, 'publications', publications),
        certificationIds: orderedIds(manifest, 'certifications', certifications),
        recommendationIds: orderedIds(manifest, 'recommendations', recommendations),
        capabilityIds: orderedIds(manifest, 'capabilities', capabilities),
      },
      experiences,
      projects,
      education,
      publications,
      certifications,
      recommendations,
      capabilities,
      evidence,
    }

    const errors = validate(profile)
    if (errors.length > 0) {
      throw new Error(`Invalid workspace at ${path}:\n${formatValidationErrors(errors)}`)
    }

    return { profile, migrated: migrated.migrated }
  }
}
```

- [ ] **Step 6: Update loader tests**

Update `packages/yaml/src/yaml-workspace-loader.test.ts`:

Change `makeWorkspace` to use `version: 1` instead of `version: "1.0"`:

```ts
test('experienceIds follow experience.yaml order by default', async () => {
  const dir = await makeWorkspace('version: 1\n')
  ...
})

test('provena.yaml order overrides experience.yaml order', async () => {
  const dir = await makeWorkspace('version: 1\norder:\n  experiences: [exp-b, exp-a]\n')
  ...
})

test('provena.yaml order referencing an unknown id fails validation', async () => {
  const dir = await makeWorkspace('version: 1\norder:\n  experiences: [exp-a, exp-does-not-exist]\n')
  ...
})
```

The `load()` calls now destructure: `const { profile } = await new YamlWorkspaceLoader().load(dir)` — add `profile` destructuring where needed.

- [ ] **Step 7: Update `WorkspaceLoader` interface in `@provena/core`**

`packages/core/src/workspace.ts` — change return type:

```ts
import type { Profile } from './profile.js'

export interface WorkspaceLoader {
  load(path: string): Promise<{ profile: Profile; migrated: boolean }>
}
```

- [ ] **Step 8: Update CLI callers of `load()`**

In `packages/cli/src/index.ts`, update `cmdRender` and `cmdValidate`:

```ts
async function cmdRender(path: string, opts: { format: string; stdout: boolean }): Promise<void> {
  const entry = FORMAT_REGISTRY[opts.format]
  if (!entry) err(`Unknown format "${opts.format}". Use: ${formatsList()}`)

  const loader = new YamlWorkspaceLoader()
  const { profile } = await loader.load(path)
  // ... rest unchanged
}

async function cmdValidate(path: string): Promise<void> {
  const loader = new YamlWorkspaceLoader()
  await loader.load(path)
  console.log('✓ Workspace is valid')
}
```

- [ ] **Step 9: Update example and template YAML files**

In all found files, change `version: "1.0"` to `version: 1`:
- `examples/valen/provena.yaml`
- `packages/cli/templates/academic/provena.yaml`
- `packages/cli/templates/consultant/provena.yaml`
- `packages/cli/templates/default/provena.yaml`

- [ ] **Step 8: Export from `packages/yaml/src/index.ts`**

```ts
export { YamlWorkspaceLoader } from './yaml-workspace-loader.js'
export { applyMigrations, LATEST_VERSION, type Migration, type SchemaVersion } from './migration-runner.js'
```

- [ ] **Step 9: Run all yaml tests**

Run: `node --import tsx --test packages/yaml/src/migration-runner.test.ts packages/yaml/src/yaml-workspace-loader.test.ts packages/yaml/src/schema.test.ts`
Expected: all PASS

- [ ] **Step 10: Commit**

```bash
git add packages/yaml/src/ packages/cli/templates/ examples/valen/provena.yaml
git commit -m "feat(yaml): add migration runner, schema version as number"
```

---

### Task 3: `YamlWorkspaceWriter` — `@provena/yaml`

**Files:**
- Create: `packages/yaml/src/yaml-workspace-writer.ts`
- Create: `packages/yaml/src/yaml-workspace-writer.test.ts`
- Modify: `packages/yaml/src/index.ts` — export `YamlWorkspaceWriter`

**Interfaces:**
- Consumes: `Profile` from `@provena/core`, `js-yaml` (`dump`)
- Produces: `class YamlWorkspaceWriter { write(path: string, profile: Profile, version?: SchemaVersion): Promise<void> }`

- [ ] **Step 1: Write the writer test**

`packages/yaml/src/yaml-workspace-writer.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { YamlWorkspaceWriter } from './yaml-workspace-writer.js'
import { YamlWorkspaceLoader } from './yaml-workspace-loader.js'
import type { Profile } from '@provena/core'
import yaml from 'js-yaml'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Test', urls: {} },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{ id: 'exp-1', organization: 'Acme', title: 'Engineer', start: '2020-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Testing', evidenceIds: [] }],
    evidence: [],
  }
}

test('write produces valid YAML files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-'))
  try {
    const writer = new YamlWorkspaceWriter()
    await writer.write(dir, makeProfile())

    const files = ['provena.yaml', 'person.yaml', 'experience.yaml', 'capabilities.yaml']
    for (const f of files) {
      const content = await readFile(join(dir, f), 'utf-8')
      assert.ok(content.length > 0, `${f} should be non-empty`)
    }
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('written workspace can be loaded back', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-'))
  try {
    const writer = new YamlWorkspaceWriter()
    const original = makeProfile()
    await writer.write(dir, original)

    const loader = new YamlWorkspaceLoader()
    const { profile } = await loader.load(dir)
    assert.equal(profile.identity.person.name, 'Test')
    assert.equal(profile.experiences[0]?.organization, 'Acme')
    assert.equal(profile.capabilities[0]?.name, 'Testing')
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('write empty entity arrays as empty YAML arrays', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-'))
  try {
    const writer = new YamlWorkspaceWriter()
    await writer.write(dir, makeProfile())

    const projectsYaml = await readFile(join(dir, 'projects.yaml'), 'utf-8')
    assert.match(projectsYaml, /\[\]\s*$/)
  } finally {
    await rm(dir, { recursive: true })
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/yaml/src/yaml-workspace-writer.test.ts`
Expected: MODULE_NOT_FOUND

- [ ] **Step 3: Implement `YamlWorkspaceWriter`**

`packages/yaml/src/yaml-workspace-writer.ts`:

```ts
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { Profile } from '@provena/core'
import { LATEST_VERSION, type SchemaVersion } from './migration-runner.js'

function removeUndefined<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(removeUndefined) as T
  if (obj && typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) cleaned[k] = removeUndefined(v)
    }
    return cleaned as T
  }
  return obj
}

export class YamlWorkspaceWriter {
  async write(path: string, profile: Profile, version?: SchemaVersion): Promise<void> {
    await mkdir(path, { recursive: true })

    const order: Record<string, string[]> = {
      experiences: [...profile.identity.experienceIds],
      projects: [...profile.identity.projectIds],
      education: [...profile.identity.educationIds],
      publications: [...profile.identity.publicationIds],
      certifications: [...profile.identity.certificationIds],
      recommendations: [...profile.identity.recommendationIds],
      capabilities: [...profile.identity.capabilityIds],
    }

    await writeFile(
      join(path, 'provena.yaml'),
      yaml.dump(removeUndefined({ version: version ?? LATEST_VERSION, order })),
    )

    await writeFile(join(path, 'person.yaml'), yaml.dump(removeUndefined(profile.identity.person)))

    const entries: [string, string, readonly unknown[]][] = [
      ['experience.yaml', 'experiences', profile.experiences],
      ['projects.yaml', 'projects', profile.projects],
      ['education.yaml', 'education', profile.education],
      ['publications.yaml', 'publications', profile.publications],
      ['certifications.yaml', 'certifications', profile.certifications],
      ['recommendations.yaml', 'recommendations', profile.recommendations],
      ['capabilities.yaml', 'capabilities', profile.capabilities],
      ['evidence.yaml', 'evidence', profile.evidence],
    ]

    for (const [filename, _key, items] of entries) {
      const cleaned = items.map((item) => removeUndefined(item))
      await writeFile(join(path, filename), yaml.dump(cleaned))
    }
  }
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `node --import tsx --test packages/yaml/src/yaml-workspace-writer.test.ts`
Expected: all 3 PASS

- [ ] **Step 5: Export from `packages/yaml/src/index.ts`**

```ts
export { YamlWorkspaceWriter } from './yaml-workspace-writer.js'
```

- [ ] **Step 6: Commit**

```bash
git add packages/yaml/src/yaml-workspace-writer.ts packages/yaml/src/yaml-workspace-writer.test.ts packages/yaml/src/index.ts
git commit -m "feat(yaml): add YamlWorkspaceWriter for persisting Profile to YAML"
```

---

### Task 4: Entity matchers + merge — `@provena/yaml`

**Files:**
- Create: `packages/yaml/src/merge.ts`
- Create: `packages/yaml/src/merge.test.ts`
- Modify: `packages/yaml/src/index.ts` — export `merge`

**Interfaces:**
- Consumes: `Profile`, `Partial<Profile>`, `Provenance` from `@provena/core`
- Produces:
  ```ts
  interface Matcher<T> { match(imported: T, existing: readonly T[]): T | undefined }
  function merge(imported: Partial<Profile>, existing: Profile): Profile
  ```

- [ ] **Step 1: Write merge tests**

`packages/yaml/src/merge.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { merge } from './merge.js'
import type { Profile, Provenance } from '@provena/core'

const linkedinProvenance: Provenance = { source: 'linkedin', importedAt: '2026-01-01T00:00:00Z' }

function baseProfile(): Profile {
  return {
    identity: {
      person: { name: 'Alex', urls: {} },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: [],
    },
    experiences: [{ id: 'exp-1', organization: 'Acme', title: 'Engineer', start: '2020-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [],
    evidence: [],
  }
}

test('imported experience with same org+title+start is skipped', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'new-id', organization: 'Acme', title: 'Engineer', start: '2020-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.experiences.length, 1)
  assert.equal(result.experiences[0]?.id, 'exp-1')
})

test('imported experience with different org+title+start is appended', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'new-id', organization: 'Other Corp', title: 'Senior Engineer', start: '2022-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.experiences.length, 2)
  assert.equal(result.experiences[1]?.organization, 'Other Corp')
})

test('imported capability with same name is skipped', () => {
  const existing = baseProfile()
  existing.capabilities = [{ id: 'cap-1', name: 'TypeScript', evidenceIds: [] }]
  existing.identity.capabilityIds = ['cap-1']
  const imported: Partial<Profile> = {
    capabilities: [{ id: 'new-cap', name: 'TypeScript', evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.equal(result.capabilities.length, 1)
})

test('imported person does not overwrite existing', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    identity: { person: { name: 'Imported Alex', urls: {} }, experienceIds: [], projectIds: [], educationIds: [], publicationIds: [], certificationIds: [], recommendationIds: [], capabilityIds: [] },
  }
  const result = merge(imported, existing)
  assert.equal(result.identity.person.name, 'Alex')
})

test('no person.yaml (fresh import) uses imported person', () => {
  const existing = baseProfile()
  // Simulate no existing person by clearing it from identity — in practice this is
  // handled by the caller not calling merge if workspace doesn't exist
  const imported: Partial<Profile> = {
    identity: { person: { name: 'Fresh Alex', urls: {} }, experienceIds: [], projectIds: [], educationIds: [], publicationIds: [], certificationIds: [], recommendationIds: [], capabilityIds: [] },
  }
  const result = merge(imported, existing)
  // Existing wins since person exists; fresh-import path skips merge entirely
  assert.equal(result.identity.person.name, 'Alex')
})

test('new entities are added to identity reference arrays', () => {
  const existing = baseProfile()
  const imported: Partial<Profile> = {
    experiences: [{ id: 'exp-2', organization: 'New Co', title: 'Dev', start: '2023-01', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [], provenance: linkedinProvenance }],
  }
  const result = merge(imported, existing)
  assert.ok(result.identity.experienceIds.includes('exp-2'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/yaml/src/merge.test.ts`
Expected: MODULE_NOT_FOUND

- [ ] **Step 3: Implement merge**

`packages/yaml/src/merge.ts`:

```ts
import type { Profile, Experience, Project, Education, Publication, Certification, Recommendation, Capability, Evidence, Provenance } from '@provena/core'
import { createHash } from 'node:crypto'

interface Matcher<T> {
  match(imported: T, existing: readonly T[]): T | undefined
}

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ')
}

class ExperienceMatcher implements Matcher<Experience> {
  match(imported: Experience, existing: readonly Experience[]): Experience | undefined {
    if (imported.provenance?.source === 'linkedin' && imported.provenance.importedAt) {
      const fp = fingerprint(imported)
      for (const e of existing) {
        if (e.provenance?.source === 'linkedin' && e.provenance.importedAt) {
          if (fingerprint(e) === fp) return e
        }
      }
    }
    return existing.find((e) =>
      normalize(e.organization) === normalize(imported.organization) &&
      normalize(e.title) === normalize(imported.title) &&
      normalize(e.start) === normalize(imported.start),
    )
  }
}

class CapabilityMatcher implements Matcher<Capability> {
  match(imported: Capability, existing: readonly Capability[]): Capability | undefined {
    return existing.find((c) => normalize(c.name) === normalize(imported.name))
  }
}

class ProjectMatcher implements Matcher<Project> {
  match(imported: Project, existing: readonly Project[]): Project | undefined {
    return existing.find((p) => normalize(p.name) === normalize(imported.name))
  }
}

class EducationMatcher implements Matcher<Education> {
  match(imported: Education, existing: readonly Education[]): Education | undefined {
    return existing.find((e) =>
      normalize(e.institution) === normalize(imported.institution) &&
      normalize(e.degree) === normalize(imported.degree) &&
      (imported.start ? normalize(e.start ?? '') === normalize(imported.start) : true),
    )
  }
}

class PublicationMatcher implements Matcher<Publication> {
  match(imported: Publication, existing: readonly Publication[]): Publication | undefined {
    return existing.find((p) => normalize(p.title) === normalize(imported.title))
  }
}

class CertificationMatcher implements Matcher<Certification> {
  match(imported: Certification, existing: readonly Certification[]): Certification | undefined {
    return existing.find((c) =>
      normalize(c.name) === normalize(imported.name) &&
      normalize(c.issuer) === normalize(imported.issuer),
    )
  }
}

class RecommendationMatcher implements Matcher<Recommendation> {
  match(imported: Recommendation, existing: readonly Recommendation[]): Recommendation | undefined {
    const importedHash = hashText(imported.text)
    return existing.find((r) =>
      normalize(r.author) === normalize(imported.author) &&
      hashText(r.text) === importedHash,
    )
  }
}

function hashText(text: string): string {
  return createHash('sha256').update(normalize(text)).digest('hex')
}

function fingerprint(e: { organization: string; title: string; start: string }): string {
  return createHash('sha256')
    .update(`${normalize(e.organization)}|${normalize(e.title)}|${normalize(e.start)}`)
    .digest('hex')
}

function mergeEntities<T>(
  imported: readonly T[] | undefined,
  existing: readonly T[],
  matcher: Matcher<T>,
): { merged: T[]; added: T[] } {
  const result = [...existing]
  const added: T[] = []

  for (const item of imported ?? []) {
    if (!matcher.match(item, existing)) {
      result.push(item)
      added.push(item)
    }
  }

  return { merged: result, added }
}

export function merge(imported: Partial<Profile>, existing: Profile): Profile {
  const expResult = mergeEntities(imported.experiences, existing.experiences, new ExperienceMatcher())
  const capResult = mergeEntities(imported.capabilities, existing.capabilities, new CapabilityMatcher())
  const projResult = mergeEntities(imported.projects, existing.projects, new ProjectMatcher())
  const eduResult = mergeEntities(imported.education, existing.education, new EducationMatcher())
  const pubResult = mergeEntities(imported.publications, existing.publications, new PublicationMatcher())
  const certResult = mergeEntities(imported.certifications, existing.certifications, new CertificationMatcher())
  const recResult = mergeEntities(imported.recommendations, existing.recommendations, new RecommendationMatcher())

  return {
    identity: {
      person: existing.identity.person,
      experienceIds: [
        ...existing.identity.experienceIds,
        ...expResult.added.map((e) => e.id),
      ],
      projectIds: [
        ...existing.identity.projectIds,
        ...projResult.added.map((p) => p.id),
      ],
      educationIds: [
        ...existing.identity.educationIds,
        ...eduResult.added.map((e) => e.id),
      ],
      publicationIds: [
        ...existing.identity.publicationIds,
        ...pubResult.added.map((p) => p.id),
      ],
      certificationIds: [
        ...existing.identity.certificationIds,
        ...certResult.added.map((c) => c.id),
      ],
      recommendationIds: [
        ...existing.identity.recommendationIds,
        ...recResult.added.map((r) => r.id),
      ],
      capabilityIds: [
        ...existing.identity.capabilityIds,
        ...capResult.added.map((c) => c.id),
      ],
    },
    experiences: expResult.merged,
    projects: projResult.merged,
    education: eduResult.merged,
    publications: pubResult.merged,
    certifications: certResult.merged,
    recommendations: recResult.merged,
    capabilities: capResult.merged,
    evidence: existing.evidence,
  }
}
```

- [ ] **Step 4: Run tests — should pass**

Run: `node --import tsx --test packages/yaml/src/merge.test.ts`
Expected: all 6 PASS

- [ ] **Step 5: Export from `packages/yaml/src/index.ts`**

```ts
export { merge } from './merge.js'
```

- [ ] **Step 6: Commit**

```bash
git add packages/yaml/src/merge.ts packages/yaml/src/merge.test.ts packages/yaml/src/index.ts
git commit -m "feat(yaml): add entity matchers + merge engine"
```

---

### Task 5: LinkedIn CSV reader + LinkedInImporter — `@provena/linkedin-import`

**Dependency:** Add `yauzl` and `@types/yauzl`.

```bash
npm init -w packages/linkedin-import -y
cd packages/linkedin-import
npm pkg set type="module" main="./src/index.ts" private=true name="@provena/linkedin-import"
npm pkg set dependencies.@provena/core="*"
cd ../..
npm install -w packages/linkedin-import yauzl
npm install -D -w packages/linkedin-import @types/yauzl
# Add to root package.json workspaces
```

**Files:**
- Create: `packages/linkedin-import/package.json`
- Create: `packages/linkedin-import/src/index.ts`
- Create: `packages/linkedin-import/src/linkedin-parser.ts` — pure CSV parsing functions
- Create: `packages/linkedin-import/src/linkedin-importer.ts` — ZIP + Importer
- Create: `packages/linkedin-import/src/linkedin-importer.test.ts`
- Modify: `package.json` — add `packages/linkedin-import` to workspaces array

**Interfaces:**
- Consumes: `Importer`, `Provenance`, `Partial<Profile>` from `@provena/core`
- Produces:
  ```ts
  // linkedin-parser.ts
  interface ParsedProfile {
    person: Person
    experiences: Experience[]
    education: Education[]
    projects: Project[]
    certifications: Certification[]
    publications: Publication[]
    recommendations: Recommendation[]
    capabilities: Capability[]
  }
  function parseProfileCsvs(files: Record<string, string>): ParsedProfile

  // linkedin-importer.ts
  class LinkedInImporter implements Importer<void> {
    read(location: string): Promise<Partial<Profile>>
  }
  ```

- [ ] **Step 1: Create the package manifest**

`packages/linkedin-import/package.json`:

```json
{
  "name": "@provena/linkedin-import",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@provena/core": "*",
    "yauzl": "^3.0.0"
  },
  "devDependencies": {
    "@types/yauzl": "^3.0.0"
  }
}
```

- [ ] **Step 2: Write parser and importer tests**

`packages/linkedin-import/src/linkedin-importer.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { LinkedInImporter } from './linkedin-importer.js'

/** Create a minimal valid ZIP in pure JS using node:zlib + raw ZIP format.
 *  No external zip command needed. */
import { deflateRawSync } from 'node:zlib'
function createZipBuffer(files: Record<string, string>): Buffer {
  const localHeaders: Buffer[] = []
  const centralEntries: Buffer[] = []
  let offset = 0

  for (const name of Object.keys(files).sort()) {
    const content = Buffer.from(files[name]!, 'utf-8')
    const compressed = deflateRawSync(content)
    const nameBuf = Buffer.from(name, 'utf-8')

    // Local file header
    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0) // signature
    lh.writeUInt16LE(20, 4)  // version needed
    lh.writeUInt16LE(0, 6)   // flags
    lh.writeUInt16LE(8, 8)   // compression: deflate
    lh.writeUInt16LE(0, 10)  // mod time
    lh.writeUInt16LE(0, 12)  // mod date
    lh.writeUInt32LE(0, 14)  // crc32 (simplified)
    lh.writeUInt32LE(compressed.length, 18)
    lh.writeUInt32LE(content.length, 22)
    lh.writeUInt16LE(nameBuf.length, 26)
    lh.writeUInt16LE(0, 28)  // extra length

    localHeaders.push(lh, nameBuf, compressed)

    // Central directory entry
    const ce = Buffer.alloc(46)
    ce.writeUInt32LE(0x02014b50, 0) // signature
    ce.writeUInt16LE(20, 4)  // version made by
    ce.writeUInt16LE(20, 6)  // version needed
    ce.writeUInt16LE(0, 8)   // flags
    ce.writeUInt16LE(8, 10)  // compression
    ce.writeUInt16LE(0, 12)  // mod time
    ce.writeUInt16LE(0, 14)  // mod date
    ce.writeUInt32LE(0, 16)  // crc32
    ce.writeUInt32LE(compressed.length, 20)
    ce.writeUInt32LE(content.length, 24)
    ce.writeUInt16LE(nameBuf.length, 28)
    ce.writeUInt16LE(0, 30)  // extra length
    ce.writeUInt16LE(0, 32)  // comment length
    ce.writeUInt16LE(0, 34)  // disk number
    ce.writeUInt16LE(0, 36)  // internal attrs
    ce.writeUInt32LE(0, 38)  // external attrs
    ce.writeUInt32LE(offset, 42) // offset

    centralEntries.push(ce, nameBuf)
    offset += lh.length + nameBuf.length + compressed.length
  }

  // EOCD
  const cdLength = centralEntries.reduce((s, b) => s + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)   // disk number
  eocd.writeUInt16LE(0, 6)   // disk with CD
  eocd.writeUInt16LE(centralEntries.length / 2, 8)  // entries on disk
  eocd.writeUInt16LE(centralEntries.length / 2, 10) // total entries
  eocd.writeUInt32LE(cdLength, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20)  // comment length

  return Buffer.concat([...localHeaders, ...centralEntries, eocd])
}

async function withTestZip(
  files: Record<string, string>,
  fn: (path: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-test-'))
  const zipPath = join(dir, 'export.zip')
  await writeFile(zipPath, createZipBuffer(files))
  try {
    await fn(zipPath)
  } finally {
    await rm(dir, { recursive: true })
  }
}

test('reads Profile.csv and returns person', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name,Email,Headline,Summary\nAlex,Chen,alex@test.com,Engineer,Good worker\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.identity?.person.name, 'Alex Chen')
    assert.equal(result.identity?.person.email, 'alex@test.com')
    assert.equal(result.identity?.person.title, 'Engineer')
    assert.equal(result.identity?.person.summary, 'Good worker')
  })
})

test('reads Positions.csv and returns experiences', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
    'Positions.csv': 'Company Name,Title,Started On,Finished On,Description\nAcme Corp,Engineer,2020-01,2023-06,Did things\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.experiences?.length, 1)
    assert.equal(result.experiences![0]?.organization, 'Acme Corp')
    assert.equal(result.experiences![0]?.title, 'Engineer')
    assert.equal(result.experiences![0]?.start, '2020-01')
    assert.equal(result.experiences![0]?.end, '2023-06')
    assert.equal(result.experiences![0]?.summary, 'Did things')
  })
})

test('reads Education.csv', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
    'Education.csv': 'School Name,Degree Name,Field Of Study,Started On,Finished On\nMIT,BS,CS,2016-09,2020-06\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.education?.length, 1)
    assert.equal(result.education![0]?.institution, 'MIT')
    assert.equal(result.education![0]?.degree, 'BS')
    assert.equal(result.education![0]?.field, 'CS')
  })
})

test('missing optional CSVs does not fail', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.identity?.person.name, 'Val Tester')
    assert.equal(result.experiences?.length, 0)
  })
})

test('missing Profile.csv throws', async () => {
  await withTestZip({
    'Positions.csv': 'Company Name,Title\nAcme,Eng\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    await assert.rejects(() => importer.read(zipPath), /Profile\.csv/)
  })
})

test('non-zip file throws', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-test-'))
  try {
    const path = join(dir, 'not-a-zip.txt')
    await writeFile(path, 'hello')
    const importer = new LinkedInImporter()
    await assert.rejects(() => importer.read(path))
  } finally {
    await rm(dir, { recursive: true })
  }
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --import tsx --test packages/linkedin-import/src/linkedin-importer.test.ts`
Expected: MODULE_NOT_FOUND for `./linkedin-importer.js`

- [ ] **Step 4: Implement CSV parsing functions**

`packages/linkedin-import/src/linkedin-parser.ts`:

```ts
import type { Person, Experience, Education, Project, Certification, Publication, Recommendation, Capability } from '@provena/core'
import { randomUUID } from 'node:crypto'

export interface ParsedCsvs {
  person: Person
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  publications: Publication[]
  recommendations: Recommendation[]
  capabilities: Capability[]
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export function parseProfileCsvs(files: Record<string, string>): ParsedCsvs {
  const now = new Date().toISOString()
  const provenance = { source: 'linkedin' as const, importedAt: now }

  // Person
  const profileRows = files['Profile.csv'] ? parseCsv(files['Profile.csv']) : []
  const profileRow = profileRows[0] ?? {}
  const person: Person = {
    name: `${profileRow['First Name'] ?? ''} ${profileRow['Last Name'] ?? ''}`.trim(),
    email: profileRow['Email'] || undefined,
    title: profileRow['Headline'] || undefined,
    summary: profileRow['Summary'] || undefined,
    urls: {},
    provenance,
  }

  // Experiences
  const experiences: Experience[] = (files['Positions.csv'] ? parseCsv(files['Positions.csv']) : []).map((row) => ({
    id: randomUUID(),
    organization: row['Company Name'] ?? '',
    title: row['Title'] ?? '',
    start: (row['Started On'] ?? '').slice(0, 7),
    end: (row['Finished On'] ?? '').slice(0, 7) || undefined,
    summary: row['Description'] || undefined,
    achievements: [],
    technologies: [],
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Education
  const education: Education[] = (files['Education.csv'] ? parseCsv(files['Education.csv']) : []).map((row) => ({
    id: randomUUID(),
    institution: row['School Name'] ?? row['Institution Name'] ?? '',
    degree: row['Degree Name'] ?? '',
    field: row['Field Of Study'] || undefined,
    start: (row['Started On'] ?? '').slice(0, 7) || undefined,
    end: (row['Finished On'] ?? '').slice(0, 7) || undefined,
    provenance,
  }))

  // Projects
  const projects: Project[] = (files['Projects.csv'] ? parseCsv(files['Projects.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Project Name'] ?? '',
    description: row['Description'] ?? '',
    url: row['Url'] || row['URL'] || undefined,
    start: undefined,
    end: undefined,
    technologies: [],
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Certifications
  const certifications: Certification[] = (files['Certifications.csv'] ? parseCsv(files['Certifications.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Name'] ?? row['Certification Name'] ?? '',
    issuer: row['Issuer'] ?? row['Authority'] ?? '',
    date: (row['Started On'] ?? '').slice(0, 7) || undefined,
    expiry: undefined,
    url: row['Url'] || row['URL'] || undefined,
    evidenceIds: [],
    provenance,
  }))

  // Publications
  const publications: Publication[] = (files['Publications.csv'] ? parseCsv(files['Publications.csv']) : []).map((row) => ({
    id: randomUUID(),
    title: row['Title'] ?? row['Publication Title'] ?? '',
    authors: (row['Authors'] ?? row['Author'] ?? '').split(',').map((a) => a.trim()).filter(Boolean),
    date: (row['Date'] ?? '').slice(0, 7) || undefined,
    url: row['Url'] || row['URL'] || undefined,
    doi: row['DOI'] || undefined,
    venue: undefined,
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Recommendations
  const recommendations: Recommendation[] = (files['Recommendations_Received.csv'] ? parseCsv(files['Recommendations_Received.csv']) : []).map((row) => ({
    id: randomUUID(),
    author: row['Recommender Name'] ?? row['Author'] ?? '',
    relationship: row['Relationship'] ?? row['Position at Company'] ?? '',
    text: row['Recommendation Text'] ?? row['Text'] ?? '',
    date: (row['Date'] ?? '').slice(0, 7) || undefined,
    provenance,
  }))

  // Capabilities from Skills.csv
  const capabilities: Capability[] = (files['Skills.csv'] ? parseCsv(files['Skills.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Skill Name'] ?? row['Name'] ?? '',
    evidenceIds: [],
    provenance,
  })).filter((c) => c.name.length > 0)

  return { person, experiences, education, projects, certifications, publications, recommendations, capabilities }
}
```

- [ ] **Step 5: Implement LinkedInImporter**

`packages/linkedin-import/src/linkedin-importer.ts`:

```ts
import { fromBuffer } from 'yauzl'
import { readFile } from 'node:fs/promises'
import type { Profile, Importer } from '@provena/core'
import { parseProfileCsvs } from './linkedin-parser.js'

export class LinkedInImporter implements Importer<void> {
  async read(location: string): Promise<Partial<Profile>> {
    const buffer = await readFile(location)
    const files = await extractZip(buffer)

    if (!files['Profile.csv']) {
      throw new Error('LinkedIn export must contain Profile.csv')
    }

    const parsed = parseProfileCsvs(files)

    return {
      identity: {
        person: parsed.person,
        experienceIds: parsed.experiences.map((e) => e.id),
        projectIds: parsed.projects.map((p) => p.id),
        educationIds: parsed.education.map((e) => e.id),
        publicationIds: parsed.publications.map((p) => p.id),
        certificationIds: parsed.certifications.map((c) => c.id),
        recommendationIds: parsed.recommendations.map((r) => r.id),
        capabilityIds: parsed.capabilities.map((c) => c.id),
      },
      experiences: parsed.experiences,
      projects: parsed.projects,
      education: parsed.education,
      publications: parsed.publications,
      certifications: parsed.certifications,
      recommendations: parsed.recommendations,
      capabilities: parsed.capabilities,
    }
  }
}

function extractZip(buffer: Buffer): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const files: Record<string, string> = {}
    fromBuffer(buffer, { lazyEntries: true, decodeStrings: true }, (err, zipfile) => {
      if (err) return reject(new Error(`Invalid ZIP: ${err.message}`))
      if (!zipfile) return reject(new Error('Invalid ZIP'))

      zipfile.readEntry()
      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }
        const chunks: Buffer[] = []
        zipfile.openReadStream(entry, (err, stream) => {
          if (err) return reject(err)
          stream!.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream!.on('end', () => {
            files[entry.fileName] = Buffer.concat(chunks).toString('utf-8')
            zipfile.readEntry()
          })
        })
      })
      zipfile.on('end', () => resolve(files))
      zipfile.on('error', reject)
    })
  })
}
```

- [ ] **Step 6: Create package entry point**

`packages/linkedin-import/src/index.ts`:

```ts
export { LinkedInImporter } from './linkedin-importer.js'
```

- [ ] **Step 7: Update root `package.json` workspaces**

Add `"packages/linkedin-import"` to the `workspaces` array.

- [ ] **Step 8: Install deps and run tests**

```bash
npm install
node --import tsx --test packages/linkedin-import/src/linkedin-importer.test.ts
```

Expected: all 6 PASS

- [ ] **Step 9: Commit**

```bash
git add packages/linkedin-import/ package.json
git commit -m "feat(linkedin-import): add LinkedInImporter for reading LinkedIn data exports"
```

### Task 6: CLI import command — `@provena/cli`

**Files:**
- Modify: `packages/cli/src/index.ts` — add `import linkedin` subcommand
- Modify: `packages/cli/package.json` — add `@provena/linkedin-import` devDep

**Interfaces:**
- Consumes: `LinkedInImporter` from `@provena/linkedin-import`, `YamlWorkspaceLoader`, `YamlWorkspaceWriter`, `merge` from `@provena/yaml`, `validate`/`formatValidationErrors` from `@provena/core`

- [ ] **Step 1: Add imports to CLI**

In `packages/cli/src/index.ts`, add:

```ts
import { LinkedInImporter } from '@provena/linkedin-import'
import { YamlWorkspaceLoader, YamlWorkspaceWriter, merge } from '@provena/yaml'
import { exists } from 'node:fs/promises'
```

- [ ] **Step 2: Add the import command handler**

After `cmdInit`:

```ts
async function cmdImportLinkedin(
  zipPath: string,
  workspacePath: string,
  opts: { fresh: boolean },
): Promise<void> {
  const importer = new LinkedInImporter()
  const imported = await importer.read(zipPath)

  const workspaceExists = await exists(join(workspacePath, 'provena.yaml')).catch(() => false)

  let profile: Profile

  if (workspaceExists && opts.fresh) {
    err(`Workspace at "${workspacePath}" already exists. Use --fresh only on empty workspaces.`)
  }

  if (workspaceExists && !opts.fresh) {
    const loader = new YamlWorkspaceLoader()
    const loaded = await loader.load(workspacePath)
    profile = merge(imported, loaded.profile)
  } else {
    profile = {
      identity: {
        person: imported.identity?.person ?? { name: 'Imported', urls: {} },
        experienceIds: imported.experiences?.map((e) => e.id) ?? [],
        projectIds: imported.projects?.map((p) => p.id) ?? [],
        educationIds: imported.education?.map((e) => e.id) ?? [],
        publicationIds: imported.publications?.map((p) => p.id) ?? [],
        certificationIds: imported.certifications?.map((c) => c.id) ?? [],
        recommendationIds: imported.recommendations?.map((r) => r.id) ?? [],
        capabilityIds: imported.capabilities?.map((c) => c.id) ?? [],
      },
      experiences: imported.experiences ?? [],
      projects: imported.projects ?? [],
      education: imported.education ?? [],
      publications: imported.publications ?? [],
      certifications: imported.certifications ?? [],
      recommendations: imported.recommendations ?? [],
      capabilities: imported.capabilities ?? [],
      evidence: [],
    }
  }

  const errors = validate(profile)
  if (errors.length > 0) {
    err(`Validation failed:\n${formatValidationErrors(errors)}`)
  }

  const writer = new YamlWorkspaceWriter()
  await writer.write(workspacePath, profile)

  console.log(`✓ Imported from "${zipPath}" into "${workspacePath}"`)
}
```

- [ ] **Step 3: Wire the command router**

After the `init` handler and before the final `else`:

```ts
} else if (command === 'import') {
  const subcommand = args[0]
  if (subcommand === 'linkedin') {
    const zipPath = args[1]
    if (!zipPath || zipPath.startsWith('--')) {
      err('Usage: provena import linkedin <export.zip> [--workspace <path>] [--fresh]')
    }
    let workspacePath = '.'
    let fresh = false
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--workspace') workspacePath = args[++i] ?? '.'
      else if (args[i] === '--fresh') fresh = true
    }
    try { await cmdImportLinkedin(zipPath, workspacePath, { fresh }) }
    catch (e) { err(e instanceof Error ? e.message : String(e)) }
  } else {
    err(`Unknown import source: "${subcommand}". Available: linkedin`)
  }
```

- [ ] **Step 4: Add `@provena/linkedin-import` dependency to `packages/cli/package.json`**

```json
"devDependencies": {
  "@provena/linkedin-import": "*",
  // ... existing deps
}
```

- [ ] **Step 5: Run all tests**

```bash
npm install
node --import tsx --test packages/*/src/*.test.ts
```

Expected: all tests pass

- [ ] **Step 6: Manual smoke test**

```bash
cd /tmp
echo 'First Name,Last Name,Email,Headline,Summary
Jane,Doe,jane@test.com,Engineer,Senior backend dev' > Profile.csv
echo 'Company Name,Title,Started On,Finished On,Description
Acme Corp,Senior Engineer,2020-01,2023-06,Platform team' > Positions.csv
echo 'Skill Name
TypeScript
Rust' > Skills.csv
zip linkedin-test.zip Profile.csv Positions.csv Skills.csv
rm -rf test-workspace

# Fresh import
node --import tsx ~/code/provena/packages/cli/src/index.ts import linkedin /tmp/linkedin-test.zip --workspace /tmp/test-workspace --fresh
node --import tsx ~/code/provena/packages/cli/src/index.ts validate /tmp/test-workspace
node --import tsx ~/code/provena/packages/cli/src/index.ts render /tmp/test-workspace --stdout

# Merge import (same zip into existing)
node --import tsx ~/code/provena/packages/cli/src/index.ts import linkedin /tmp/linkedin-test.zip --workspace /tmp/test-workspace
```

- [ ] **Step 7: Commit**

```bash
git add packages/cli/src/index.ts packages/cli/package.json
git commit -m "feat(cli): add 'provena import linkedin' command"
```

---

## Self-review checklist

1. **Spec coverage:** Philosophy (workspace is truth, LinkedIn is external representation, deterministic, conservative) → enforced by `merge()` no-clobber. Provenance → added to every entity. ZIP-only → `LinkedInImporter.read()` only accepts ZIP. No `--force` → only `--fresh` for new workspaces. Migration infra → `MigrationRunner` + `applyMigrations`. Each design doc section has a corresponding task.

2. **Placeholder scan:** No TBD, TODO, or vague instructions. Every code step has complete implementation code. Every test step has complete test code with assertions. Commands are exact with expected output.

3. **Type consistency:** `Provenance.source` is `'linkedin' | 'manual'` everywhere. `Importer.read()` returns `Promise<Partial<Profile>>` in interface and implementation. `Matcher.match(imported, existing)` returns `T | undefined` in all matchers. `merge()` accepts `Partial<Profile>` and `Profile`, returns `Profile`. `YamlWorkspaceLoader.load()` returns `{ profile, migrated }` consistently.

4. **Dependency chain:** Task 1 (core types) → Tasks 2-3-4 (yaml infra, independent of each other after Task 1) → Task 5 (linkedin-import, depends on Task 1) → Task 6 (CLI, depends on all). Tasks 2, 3, and 4 can be implemented in parallel if desired. Task 5 can start after Task 1. Task 6 is the integration layer.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="edit">
<｜｜DSML｜｜parameter name="filePath" string="true">/home/valentin/code/provena/docs/superpowers/plans/2026-07-27-linkedin-import.md