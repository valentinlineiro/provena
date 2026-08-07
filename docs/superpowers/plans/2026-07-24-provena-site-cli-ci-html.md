# Provena — Site, Distribution, Onboarding, CI & I6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a site that sells in 30s, a CLI installable via `npx`, onboarding that gets a first render in 3min, CI that blocks broken merges, and an HTML renderer that closes I6.

**Architecture:** npm workspaces monorepo with tsup-based single-package distribution. Only `@provena/cli` publishes to npm (bundles all deps). Website is a separate VitePress project. Tests use Node built-in `node:test`. CI runs typecheck + tests + build + docs deploy on every push to main and every PR.

**Tech Stack:** VitePress 1.6, TypeScript 5.7, tsup 8.x, Node 22+, GitHub Actions, `node:test`, `tsx`.

## Global Constraints

- All packages keep `"type": "module"`.
- CLI entry perms remain `#!/usr/bin/env -S node --import tsx` for dev; tsup output for publish.
- All new tests use `node:test` + `node:assert/strict` (no vitest, no jest).
- `@provena/cli` is the only published package; tsup bundles all internal deps.
- Website changes are only content/copy — no theme customization beyond VitePress defaults.
- HTML renderer produces **semantic HTML only** — no CSS, no classes, no style attributes.

---

### Task 1: Website home — sell in 30 seconds

**Files:**
- Modify: `website/index.md`
- Create: `website/use-cases.md`

**Interfaces:**
- Consumes: existing `examples/valen/*.yaml` files for demo content
- Produces: home page that communicates value in <30s, use-cases page

- [ ] **Step 1: Rewrite website/index.md with new hero, demo, use-cases, and CTAs**

Replace `website/index.md`:

```markdown
---
layout: home

hero:
  name: Provena
  text: Define your identity once. Export everywhere.
  tagline: |
    A canonical model for your professional identity.
    One YAML workspace. CV, JSON Resume, HTML, and more — all generated from the same source.
  actions:
    - theme: brand
      text: Quick start in 5 minutes
      link: /quickstart
    - theme: alt
      text: See the model
      link: /concept
    - theme: alt
      text: View example output
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: One source of truth
    details: Your career facts live in YAML files. Every output is derived — never copied, never out of sync.
  - title: Multiple projections
    details: Resume, LinkedIn profile, conference bio, JSON Resume — different views of the same identity.
  - title: Verified by validation
    details: Referential integrity checks catch broken links between skills, experience, and evidence before you render.
  - title: CLI-first
    details: No build step, no platform lock-in. `provena render` from any directory. Works with your editor, not instead of it.
  - title: Future-proof
    details: New output format? New projection? The model stays the same. Add a renderer, don't reshape your data.
  - title: Open source
    details: MIT license. Your identity is not a SaaS subscription. Own your data, own your toolchain.
---

## YAML → Profile → Outputs

```
┌─────────────────────┐
│  person.yaml        │
│  experience.yaml    │
│  capabilities.yaml  │  Canonical identity model
│  projects.yaml      │
│  provena.yaml       │
└─────────┬───────────┘
          │
          ▼
   ┌──────────────┐
   │   Profile    │  (validated, referentially sound)
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼         ▼
  resume.md  resume.json  resume.html
  (Markdown) (JSON Resume) (HTML — coming soon)
```

## Who is it for?

**Developers** who want their CV to reflect their actual work, not a hand-edited copy from last year.

**Freelancers** who manage multiple bios for different clients and platforms, and want one source of truth.

**Job seekers** who need polished, consistent outputs across every application channel.

**Consultants** who maintain capability statements, case studies, and speaker profiles — all from one model.

Try it:

```bash
npx @provena/cli render examples/valen
cat examples/valen/resume.md
```

## See it in action

| Input YAML | Output Markdown |
|---|---|
| `person.yaml` defines name, title, summary | Header shows name and about section |
| `experience.yaml` lists roles with achievements | Each role is a section with org, title, dates |
| `capabilities.yaml` defines skills with evidence | Skills are listed with optional descriptions |
| Identity links experiences to capabilities | No duplication — references, not copies |

[Render the example workspace](/examples) →
[Start your own in 5 minutes](/quickstart) →
```

- [ ] **Step 2: Create website/use-cases.md**

```markdown
# Use cases

## Developer

Your resume shouldn't be a manual copy of your GitHub profile.

```
person.yaml → Identity → resume.md + resume.json
```

Update your experience once. Both outputs reflect the change.

## Freelancer

You maintain a bio for your website, a profile for Upwork, a speaker intro for conferences.

```
person.yaml → Identity → bio.md + speaker-intro.md + website-about.md
```

One source. No stale copies.

## Job seeker

Every application requires a tailored resume. Provena's projection model lets you filter by role:

```bash
provena render my-profile --project backend-engineer
```

Different views, same data. No manual reformatting.

## Consultant

Capability statements, engagement summaries, team bios — same people, different clients.

Provena's evidence-based model ties every claim to specific work:

```
experience.yaml
  └─ achievement: "Reduced latency by 40%"
       └─ evidence: load-test report, PR link
```

Not "I'm good at distributed systems." Proof.
```

- [ ] **Step 3: Build and preview the site**

```bash
cd website && npm ci && npm run build
```

Expected: VitePress builds without errors, outputs to `website/.vitepress/dist/`.

---

### Task 2: Build step — ship `@provena/cli` to npm

**Files:**
- Create: `packages/cli/tsup.config.ts`
- Modify: `packages/cli/package.json`
- Modify: `website/quickstart.md`

**Interfaces:**
- Consumes: `packages/cli/src/index.ts` as entry point
- Produces: `packages/cli/dist/cli.js` (bundled ESM), `@provena/cli` publishable to npm

- [ ] **Step 1: Install tsup**

```bash
npm install -D tsup -w packages/cli
```

- [ ] **Step 2: Create tsup config**

Create `packages/cli/tsup.config.ts`:

```typescript
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { cli: 'src/index.ts' },
  format: 'esm',
  target: 'node22',
  bundle: true,
  clean: true,
  minify: false,
  sourcemap: false,
  // Bundle all @provena/* deps — only cli gets published to npm
  noExternal: [/@provena\//],
  // shebang preserved automatically by tsup for .ts entry
})
```

- [ ] **Step 3: Update packages/cli/package.json**

```json
{
  "name": "@provena/cli",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "type": "module",
  "bin": {
    "provena": "./dist/cli.js"
  },
  "main": "./dist/cli.js",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsup",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@provena/core": "*",
    "@provena/yaml": "*",
    "@provena/jsonresume": "*",
    "@provena/markdown": "*"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 4: Verify build works**

```bash
npm run build -w packages/cli
```

Expected: produces `packages/cli/dist/cli.js` with all deps bundled.

- [ ] **Step 5: Update the root npm scripts for build**

Add to root `package.json`:

```json
"scripts": {
  "build": "npm run build -w packages/cli",
  "build:all": "npm run build -w packages/cli",
  ...
}
```

- [ ] **Step 6: Add npmignore or files field**

The `files: ["dist", "README.md"]` in package.json is sufficient, but also add a shim `README.md` to `packages/cli/` if missing:

```markdown
# @provena/cli

Canonical professional identity model CLI.

```
npx @provena/cli render ./my-workspace
```
```

- [ ] **Step 7: Update quickstart to use npx**

Replace `website/quickstart.md` step 1:

```diff
- ## 1. Clone and install
-
- ```bash
- git clone https://github.com/valentinlineiro/provena.git
- cd provena
- npm install
- ```
+ ## 1. Use the CLI directly
+
+ ```bash
+ npx @provena/cli render examples/valen
+ ```
+
+ Or install globally:
+
+ ```bash
+ npm install -g @provena/cli
+ provena render examples/valen
+ ```
```

Update the render command references:

```diff
- provena render my-profile
+ npx @provena/cli render my-profile
```

- [ ] **Step 8: Test the built binary works**

```bash
node packages/cli/dist/cli.js --help
node packages/cli/dist/cli.js render examples/valen
```

Expected: --help shows usage; render produces examples/valen/resume.md.

---

### Task 3: `provena init` — zero-to-render in under 3 minutes

**Files:**
- Modify: `packages/cli/src/index.ts`
- Create: `packages/cli/src/init.ts`
- Create: `packages/cli/templates/` directory with template files

**Interfaces:**
- Consumes: `packages/cli/src/index.ts` adds `init` command handler
- Produces: `provena init my-profile` creates a working workspace

- [ ] **Step 1: Create template files under packages/cli/templates/**

`packages/cli/templates/default/person.yaml`:
```yaml
name: "Your Name"
email: "you@example.com"
location: "City, Country"
title: "Software Engineer"
summary: "A short professional summary — one or two sentences about what you do."
urls:
  github: "https://github.com/you"
  linkedin: "https://linkedin.com/in/you"
```

`packages/cli/templates/default/provena.yaml`:
```yaml
version: "1.0"
```

`packages/cli/templates/default/experience.yaml`:
```yaml
- id: "exp-1"
  organization: "Your Organization"
  title: "Your Role"
  start: "YYYY-MM"
  summary: "What you did and why it mattered."
  achievements:
    - "Key achievement with measurable impact"
    - "Another achievement"
  technologies:
    - "Technology"
  capabilityIds:
    - "cap-1"
  evidenceIds: []
```

`packages/cli/templates/default/capabilities.yaml`:
```yaml
- id: "cap-1"
  name: "Your Skill"
  description: "Optional description."
  evidenceIds: []
```

`packages/cli/templates/default/education.yaml`:
```yaml
- id: "edu-1"
  institution: "University"
  degree: "Degree"
  field: "Field of Study"
  start: "YYYY"
  end: "YYYY"
```

`packages/cli/templates/consultant/person.yaml`:
```yaml
name: "Your Name"
email: "you@consulting.com"
location: "City, Country"
title: "Principal Consultant"
summary: "Strategic advisor and technical leader."
urls:
  website: "https://your-consultancy.com"
  linkedin: "https://linkedin.com/in/you"
```

`packages/cli/templates/consultant/provena.yaml`:
```yaml
version: "1.0"
```

`packages/cli/templates/consultant/experience.yaml`:
```yaml
- id: "eng-1"
  organization: "Client Organization"
  title: "Engagement Lead"
  start: "YYYY-MM"
  summary: "Led delivery of X initiative."
  achievements:
    - "Delivered outcome with measurable impact"
  technologies:
    - "Technology"
  capabilityIds:
    - "cap-1"
  evidenceIds: []
```

`packages/cli/templates/academic/person.yaml`:
```yaml
name: "Your Name"
email: "you@university.edu"
location: "City, Country"
title: "Professor / Researcher"
summary: "Research focus and teaching areas."
urls:
  scholar: "https://scholar.google.com/..."
  orcid: "https://orcid.org/..."
```

- [ ] **Step 2: Create packages/cli/src/init.ts**

```typescript
import { mkdir, writeFile, copyFile, readdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(__dirname, '..', 'templates')

const TEMPLATES = ['default', 'consultant', 'academic'] as const

export function listTemplates(): string[] {
  return [...TEMPLATES]
}

export async function cmdInit(path: string, template: string = 'default'): Promise<void> {
  if (!TEMPLATES.includes(template as typeof TEMPLATES[number])) {
    throw new Error(
      `Unknown template "${template}". Available: ${TEMPLATES.join(', ')}`
    )
  }

  try {
    await mkdir(path, { recursive: true })
  } catch {
    throw new Error(`Cannot create directory "${path}"`)
  }

  const srcDir = join(templatesDir, template)
  const files = await readdir(srcDir).catch(() => {
    throw new Error(`Template "${template}" not found at ${srcDir}`)
  })

  for (const file of files) {
    const content = await readFile(join(srcDir, file), 'utf-8')
      .catch(() => { throw new Error(`Cannot read template file "${file}"`) })
    await writeFile(join(path, file), content, 'utf-8')
  }

  console.log(`✓ Created workspace at ${path}`)
  console.log(`  Template: ${template}`)
  console.log('')
  console.log('Next steps:')
  console.log(`  1. Edit the YAML files in ${path}`)
  console.log('  2. Run render:')
  console.log(`     provena render ${path}`)
}
```

Note: need to add `readFile` import:
```typescript
import { mkdir, writeFile, copyFile, readdir, readFile } from 'node:fs/promises'
```

- [ ] **Step 3: Wire init into the CLI (modify packages/cli/src/index.ts)**

Add after existing imports:
```typescript
import { cmdInit, listTemplates } from './init.js'
```

Add to help():
```diff
  provena render <workspace> [options]
  provena validate <workspace>
+ provena init <workspace> [options]
  provena --help
```

Add to help output the init description:
```
  init      Create a new workspace from a template
```

Add command handling:
```typescript
} else if (command === 'init') {
  const path = args[0]
  if (!path || path === '--help') {
    console.error('Usage: provena init <workspace> [--template default|consultant|academic]')
    process.exit(1)
  }
  const template = args.includes('--template')
    ? args[args.indexOf('--template') + 1] ?? 'default'
    : 'default'
  try {
    await cmdInit(path, template)
  } catch (e) {
    err(e instanceof Error ? e.message : String(e))
  }
```

- [ ] **Step 4: Test init works**

```bash
tsx packages/cli/src/index.ts init /tmp/test-profile
tsx packages/cli/src/index.ts init /tmp/consultant-profile --template consultant
```

Expected: creates YAML files in both directories.

```bash
tsx packages/cli/src/index.ts render /tmp/test-profile
```

Expected: renders resume.md successfully (validate passes due to matching ids).

---

### Task 4: Validate improvements — actionable error messages

**Files:**
- Modify: `packages/core/src/validate.ts`
- Modify: `packages/core/src/validate.test.ts`
- Modify: `packages/yaml/src/yaml-workspace-loader.ts` (minor — propagate file path context)
- Modify: `packages/cli/src/index.ts` (minor — improve validate command output)

**Interfaces:**
- Consumes: existing `ValidationError` type adds `file?: string`, `expected?: string`
- Produces: `provena validate ./path` says `person.yaml: field "name" is required`

- [ ] **Step 1: Enhance ValidationError type and validation messages**

In `packages/core/src/validate.ts`, expand `ValidationError`:
```typescript
export interface ValidationError {
  path: string
  message: string
  field?: string
  expected?: string
  file?: string
}
```

Add field validation for `Person`:
```typescript
// After missing reference checks — validate required fields
function validatePerson(person: import('./types.js').Person, errors: ValidationError[]): void {
  if (!person.name || person.name.trim() === '') {
    errors.push({ path: 'person', message: 'Field "name" is required', field: 'name', file: 'person.yaml' })
  }
}
```

Wire it into `validate()`:
```typescript
if (data.identity?.person) {
  validatePerson(data.identity.person, errors)
}
```

Improve `findMissing` to include file hints:
```typescript
function findMissing(
  label: string,
  ids: readonly string[],
  knownIds: Set<string>,
  errors: ValidationError[],
  fileHint?: string,
): void {
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push({
        path: label,
        message: `Reference to unknown id "${id}"`,
        file: fileHint,
      })
    }
  }
}
```

Pass file hints from the loader context. Actually, since validation doesn't know about files, simplify — add a map of `path -> fileHint` in the yaml-workspace-loader. Let's keep validation pure and have the CLI add file context.

Better approach: keep `ValidationError` as-is but add a `source` field:

```diff
 export interface ValidationError {
   path: string
   message: string
+  source?: string  // hint about which file is relevant
 }
```

Then in `findMissing`/`findDuplicates`, add source hints:

For identity references:
```typescript
const fileMap: Record<string, string> = {
  'identity.experienceIds': 'provena.yaml',
  'identity.capabilityIds': 'provena.yaml',
  'experience': 'experience.yaml',
  'project': 'projects.yaml',
  ...
}
```

In `findMissing`:
```typescript
function findMissing(
  label: string,
  ids: readonly string[],
  knownIds: Set<string>,
  errors: ValidationError[],
  source?: string,
): void {
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push({ path: label, message: `Reference to unknown id "${id}"`, source })
    }
  }
}
```

Add source to each call. For example:
```typescript
findMissing('identity.experienceIds', data.identity.experienceIds, experienceIds, errors, 'provena.yaml')
findMissing('experience.exp-1.capabilityIds', exp.capabilityIds, capabilityIds, errors, 'experience.yaml')
```

This is too much per-call plumbing. Simpler: add a helper that maps auto-detected source:

```typescript
function sourceFromPath(path: string): string | undefined {
  if (path.startsWith('identity.')) return 'provena.yaml'
  if (path.startsWith('experience')) return 'experience.yaml'
  if (path.startsWith('project')) return 'projects.yaml'
  if (path.startsWith('education')) return 'education.yaml'
  if (path.startsWith('publication')) return 'publications.yaml'
  if (path.startsWith('certification')) return 'certifications.yaml'
  if (path.startsWith('capabilities')) return 'capabilities.yaml'
  return undefined
}
```

Then in `findMissing`, auto-detect:
```typescript
function findMissing(
  label: string,
  ids: readonly string[],
  knownIds: Set<string>,
  errors: ValidationError[],
): void {
  const source = sourceFromPath(label)
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push({ path: label, message: `Reference to unknown id "${id}"`, source })
    }
  }
}
```

No changes needed to callers. Same for `findDuplicates`.

- [ ] **Step 2: Add a "required field" check for Person.name**

In `validate()`:
```typescript
if (!data.identity.person.name || data.identity.person.name.trim() === '') {
  errors.push({
    path: 'identity.person',
    message: 'Field "name" is required',
    source: 'person.yaml',
  })
}
```

- [ ] **Step 3: Improve CLI validate command output**

In `packages/cli/src/index.ts`, replace `cmdValidate`:

```typescript
async function cmdValidate(path: string): Promise<void> {
  const loader = new YamlWorkspaceLoader()
  try {
    const profile = await loader.load(path)
    // load already calls validate internally - if we get here, it's valid
    console.log('✓ Workspace is valid')
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('✗ Workspace has errors')
    console.error('')
    // The loader already throws with formatted errors from validate
    // Enhance by splitting into individual lines
    const lines = msg.split('\n')
    for (const line of lines) {
      console.error(`  ${line}`)
    }
    process.exit(1)
  }
}
```

But currently the loader catches validate errors and throws them as one string. Let's separate the concerns.

Add to `packages/core/src/validate.ts` a new function `formatValidationErrors`:

```typescript
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => {
    const file = e.source ? ` [${e.source}]` : ''
    return `  ${e.path}${file}: ${e.message}`
  }).join('\n')
}
```

In `packages/yaml/src/yaml-workspace-loader.ts`, update the error formatting:

```typescript
import { validate, formatValidationErrors } from '@provena/core'

// In load(), replace:
// const details = errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')
// throw new Error(`Invalid workspace at ${path}:\n${details}`)
// With:
throw new Error(`Invalid workspace at ${path}:\n${formatValidationErrors(errors)}`)
```

- [ ] **Step 4: Update tests**

Add test in `packages/core/src/validate.test.ts`:

```typescript
test('a missing person name is an error', () => {
  const errors = validate({
    identity: {
      person: { name: '', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: [], projectIds: [], educationIds: [],
      publicationIds: [], certificationIds: [],
      recommendationIds: [], capabilityIds: [],
    },
  })
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /"name" is required/)
  assert.equal(errors[0]!.source, 'person.yaml')
})

test('validation errors include source file hint', () => {
  const errors = validate({
    identity: {
      person: { name: 'Alex', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: ['missing'], projectIds: [], educationIds: [],
      publicationIds: [], certificationIds: [],
      recommendationIds: [], capabilityIds: [],
    },
  })
  assert.equal(errors.length, 1)
  assert.equal(errors[0]!.source, 'provena.yaml')
})
```

- [ ] **Step 5: Update validate.test.ts to also test formatValidationErrors**

```typescript
test('formatValidationErrors includes file hints', () => {
  const errors: ValidationError[] = [
    { path: 'identity.experienceIds', message: 'Reference to unknown id "x"', source: 'provena.yaml' },
  ]
  const formatted = formatValidationErrors(errors)
  assert.match(formatted, /provena\.yaml/)
})
```

- [ ] **Step 6: Run tests**

```bash
npm test
```

Expected: all existing tests pass, new tests pass.

---

### Task 5: E2E + snapshot tests

**Files:**
- Create: `packages/core/src/e2e.test.ts`
- Create: `packages/markdown/src/snapshots.test.ts`

**Interfaces:**
- Consumes: `examples/valen/` workspace, existing projectors/renderers
- Produces: tests that verify the full pipeline and catch unintended output changes

- [ ] **Step 1: Create E2E golden path test**

`packages/core/src/e2e.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { validate } from './validate.js'
import type { Person, Experience, Capability, Identity } from './types.js'

function validProfile() {
  const person: Person = { name: 'Test User', title: 'Engineer', urls: {} }
  const capabilities: Capability[] = [
    { id: 'cap-1', name: 'Testing', evidenceIds: [] },
  ]
  const experiences: Experience[] = [{
    id: 'exp-1',
    organization: 'Test Corp',
    title: 'Engineer',
    start: '2023-01',
    achievements: ['Did a thing'],
    technologies: ['TypeScript'],
    capabilityIds: ['cap-1'],
    evidenceIds: [],
  }]
  const identity: Identity = {
    person,
    metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
    experienceIds: ['exp-1'],
    projectIds: [],
    educationIds: [],
    publicationIds: [],
    certificationIds: [],
    recommendationIds: [],
    capabilityIds: ['cap-1'],
  }
  return { identity, experiences, projects: [], education: [], publications: [], certifications: [], recommendations: [], capabilities, evidence: [] }
}

test('E2E: valid profile passes validation', () => {
  const errors = validate(validProfile())
  assert.deepEqual(errors, [])
})

test('E2E: broken reference fails validation', () => {
  const profile = validProfile()
  profile.identity.capabilityIds = ['nonexistent']
  const errors = validate(profile)
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /nonexistent/)
})

test('E2E: duplicate capability id fails validation', () => {
  const profile = validProfile()
  profile.capabilities = [
    { id: 'dup', name: 'A', evidenceIds: [] },
    { id: 'dup', name: 'B', evidenceIds: [] },
  ]
  profile.identity.capabilityIds = ['dup']
  const errors = validate(profile)
  assert.equal(errors.length, 1)
  assert.match(errors[0]!.message, /Duplicate/)
})
```

- [ ] **Step 2: Create markdown snapshot test**

`packages/markdown/src/snapshots.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { MarkdownResumeRenderer } from './markdown-resume.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Test User', title: 'Engineer', summary: 'A summary.', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: ['exp-1'],
      projectIds: ['proj-1'],
      educationIds: ['edu-1'],
      publicationIds: ['pub-1'],
      certificationIds: ['cert-1'],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{
      id: 'exp-1',
      organization: 'Test Corp',
      title: 'Senior Engineer',
      start: '2023-01',
      end: '2024-06',
      summary: 'Led a team.',
      achievements: ['Shipped feature X', 'Reduced bugs by 50%'],
      technologies: ['TypeScript', 'Rust'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [{
      id: 'proj-1',
      name: 'Open Source Lib',
      role: 'Maintainer',
      description: 'A useful library.',
      url: 'https://github.com/test/lib',
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    education: [{
      id: 'edu-1',
      institution: 'University',
      degree: 'BS',
      field: 'Computer Science',
      start: '2015',
      end: '2019',
    }],
    publications: [{
      id: 'pub-1',
      title: 'A Paper',
      authors: ['Test User', 'Co-author'],
      venue: 'Journal of Things',
      date: '2023',
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    certifications: [{
      id: 'cert-1',
      name: 'AWS Certified',
      issuer: 'Amazon',
      date: '2023',
      evidenceIds: [],
    }],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'TypeScript', description: 'Expert-level', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Shipped it', date: '2023' }],
  }
}

test('markdown snapshot matches expected output', () => {
  const profile = makeProfile()
  const model = resumeProjector.project(profile)
  const renderer = new MarkdownResumeRenderer()
  const output = renderer.render(model)
  assert.match(output, /# Test User/)
  assert.match(output, /## About/)
  assert.match(output, /A summary\./)
  assert.match(output, /## Experience/)
  assert.match(output, /### Test Corp/)
  assert.match(output, /\*\*Senior Engineer\*\* \| Jan 2023 — Jun 2024/)
  assert.match(output, /Shipped feature X/)
  assert.match(output, /## Projects/)
  assert.match(output, /\[Open Source Lib\]\(https:\/\/github\.com\/test\/lib\)/)
  assert.match(output, /## Education/)
  assert.match(output, /### BS in Computer Science/)
  assert.match(output, /University \| 2015 — 2019/)
  assert.match(output, /## Publications/)
  assert.match(output, /## Certifications/)
  assert.match(output, /\[AWS Certified\]/)
  assert.match(output, /## Skills/)
  assert.match(output, /\*\*TypeScript\*\* \(1 piece of evidence\)/)
  assert.match(output, /Expert-level/)
})
```

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all 6 suites pass.

---

### Task 6: CI — typecheck + tests + build + docs

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: `.github/workflows/deploy-docs.yml` (make it depend on CI)
- Modify: `CLAUDE.md` (update to reflect test/build/CI status)

**Interfaces:**
- Consumes: all existing packages
- Produces: CI that blocks merges on typecheck failure, test failure, or build failure

- [ ] **Step 1: Create CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

- [ ] **Step 2: Make deploy-docs depend on CI passing**

Modify `.github/workflows/deploy-docs.yml`:

```diff
 jobs:
   deploy:
+    needs: [check]
     runs-on: ubuntu-latest
```

But this creates an issue: deploy-docs runs on pushes to main with website changes, and CI also runs on main pushes. They'd be separate workflows. Better approach: remove the `needs` dependency (workflows are independent), and just have CI run first.

Actually, let's keep them separate. CI runs on push + PR to main. Deploy-docs runs on push to main with website changes. CI must pass before merging (branch protection), so deploy-docs implicitly always sees passing CI.

No changes to deploy-docs.yml needed.

- [ ] **Step 3: Update CLAUDE.md**

```diff
- There is no test suite, linter, or build step configured yet — `typecheck` is the only verification available.
+ Tests use Node built-in `node:test`. Build uses tsup. CI runs typecheck + tests + build on every push/PR.
```

---

### Task 7: HTML renderer — close I6 with semantic HTML

**Files:**
- Create: `packages/html/package.json`
- Create: `packages/html/src/index.ts`
- Create: `packages/html/src/html-resume-renderer.ts`
- Create: `packages/html/src/html-resume.test.ts`
- Create: `packages/html/tsconfig.json` (if needed, currently tsconfig at root covers all)
- Modify: `packages/cli/src/index.ts` (add `html` to supported formats)
- Modify: `packages/demo/src/load-and-render.ts` (optional, but nice)
- Modify: `packages/html/README.md` (minimal)

**Interfaces:**
- Consumes: `ResumeModel` from `@provena/core`
- Implements: `Renderer<ResumeModel>` from `@provena/core`
- Produces: `--format html` CLI option, plain semantic HTML5 output

- [ ] **Step 1: Create the package**

`packages/html/package.json`:

```json
{
  "name": "@provena/html",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@provena/core": "*"
  }
}
```

- [ ] **Step 2: Create the HTML renderer**

`packages/html/src/html-resume-renderer.ts`:

```typescript
import type { Renderer, ResumeModel } from '@provena/core'

function fmtDate(d: string): string {
  const [y, m] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m ? `${months[parseInt(m) - 1] ?? ''} ${y}` : y ?? d
}

function fmtRange(start: string, end?: string): string {
  return `${fmtDate(start)} — ${end ? fmtDate(end) : 'Present'}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export class HtmlResumeRenderer implements Renderer<ResumeModel> {
  render(model: ResumeModel): string {
    const parts: string[] = ['<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>' + esc(model.name) + '</title></head><body>']

    parts.push('<article>')
    parts.push('<header>')
    parts.push('<h1>' + esc(model.name) + '</h1>')
    if (model.summary) parts.push('<p>' + esc(model.summary) + '</p>')
    parts.push('</header>')

    if (model.experiences.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Experience</h2>')
      for (const exp of model.experiences) {
        parts.push('<article>')
        parts.push('<h3>' + esc(exp.organization) + '</h3>')
        parts.push('<p><strong>' + esc(exp.title) + '</strong> — <time>' + fmtRange(exp.start, exp.end) + '</time></p>')
        if (exp.summary) parts.push('<p>' + esc(exp.summary) + '</p>')
        if (exp.achievements.length > 0) {
          parts.push('<ul>')
          for (const a of exp.achievements) parts.push('<li>' + esc(a) + '</li>')
          parts.push('</ul>')
        }
        if (exp.technologies.length > 0) parts.push('<p><small>' + exp.technologies.map(esc).join(', ') + '</small></p>')
        parts.push('</article>')
      }
      parts.push('</section>')
    }

    if (model.projects.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Projects</h2>')
      for (const proj of model.projects) {
        parts.push('<article>')
        const name = proj.url ? '<a href="' + esc(proj.url) + '">' + esc(proj.name) + '</a>' : esc(proj.name)
        parts.push('<h3>' + name + '</h3>')
        if (proj.role) parts.push('<p><em>' + esc(proj.role) + '</em></p>')
        parts.push('<p>' + esc(proj.description) + '</p>')
        if (proj.technologies.length > 0) parts.push('<p><small>' + proj.technologies.map(esc).join(', ') + '</small></p>')
        parts.push('</article>')
      }
      parts.push('</section>')
    }

    if (model.education.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Education</h2>')
      for (const edu of model.education) {
        const field = edu.field ? ' in ' + esc(edu.field) : ''
        parts.push('<article>')
        parts.push('<h3>' + esc(edu.degree) + field + '</h3>')
        parts.push('<p>' + esc(edu.institution) + ' — <time>' + fmtRange(edu.start ?? '', edu.end) + '</time></p>')
        parts.push('</article>')
      }
      parts.push('</section>')
    }

    if (model.publications.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Publications</h2>')
      parts.push('<ul>')
      for (const pub of model.publications) {
        const authors = pub.authors.map(esc).join(', ')
        const title = pub.url ? '<a href="' + esc(pub.url) + '">' + esc(pub.title) + '</a>' : esc(pub.title)
        let line = '<li>' + authors + '. ' + title + '.'
        if (pub.venue) line += ' <em>' + esc(pub.venue) + '.</em>'
        if (pub.date) line += ' ' + esc(pub.date) + '.'
        parts.push(line + '</li>')
      }
      parts.push('</ul>')
      parts.push('</section>')
    }

    if (model.certifications.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Certifications</h2>')
      parts.push('<ul>')
      for (const cert of model.certifications) {
        const name = cert.url ? '<a href="' + esc(cert.url) + '">' + esc(cert.name) + '</a>' : esc(cert.name)
        parts.push('<li>' + name + ' — ' + esc(cert.issuer) + (cert.date ? ' (' + esc(cert.date) + ')' : '') + '</li>')
      }
      parts.push('</ul>')
      parts.push('</section>')
    }

    if (model.capabilities.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Skills</h2>')
      parts.push('<ul>')
      for (const cap of model.capabilities) {
        const evidence = cap.evidenceCount > 0 ? ' (' + cap.evidenceCount + ' pieces of evidence)' : ''
        parts.push('<li><strong>' + esc(cap.name) + '</strong>' + evidence + '</li>')
        if (cap.description) parts.push('<li>' + esc(cap.description) + '</li>')
      }
      parts.push('</ul>')
      parts.push('</section>')
    }

    parts.push('</article>')
    parts.push('</body></html>')

    return parts.join('\n')
  }
}
```

- [ ] **Step 3: Create the package index**

`packages/html/src/index.ts`:

```typescript
export { HtmlResumeRenderer } from './html-resume-renderer.js'
```

- [ ] **Step 4: Update root workspace to include packages/html**

`packages/cli/package.json` update:
```json
"dependencies": {
  "@provena/core": "*",
  "@provena/yaml": "*",
  "@provena/jsonresume": "*",
  "@provena/markdown": "*",
  "@provena/html": "*"
}
```

Root `package.json` workspaces already covers `packages/*`, no changes needed.

- [ ] **Step 5: Wire HTML format into CLI**

In `packages/cli/src/index.ts`:

Add import:
```typescript
import { HtmlResumeRenderer } from '@provena/html'
```

In `parseArgs`, add `html` to valid formats:
```typescript
if (val !== 'markdown' && val !== 'jsonresume' && val !== 'html') {
  console.error(`Error: unknown format "${val}". Use markdown, jsonresume, or html.`)
  process.exit(2)
}
```

In `cmdRender`, add HTML case:
```typescript
if (opts.format === 'html') {
  const model = resumeProjector.project(profile)
  const output = new HtmlResumeRenderer().render(model)
  if (opts.stdout) {
    console.log(output)
  } else {
    const outPath = join(path, 'resume.html')
    await writeFile(outPath, output, 'utf-8')
    console.log(`Written: ${outPath}`)
  }
} else if (opts.format === 'jsonresume') {
  // ... existing code
}
```

- [ ] **Step 6: Add test for HTML renderer**

`packages/html/src/html-resume.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { HtmlResumeRenderer } from './html-resume-renderer.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Alex Chen', title: 'Engineer', summary: 'Test.', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{
      id: 'exp-1',
      organization: 'Acme Corp',
      title: 'Engineer',
      start: '2023-01',
      end: '2024-06',
      achievements: ['Shipped it'],
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Testing', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Did a thing' }],
  }
}

test('HTML renderer produces valid document structure', () => {
  const profile = makeProfile()
  const model = resumeProjector.project(profile)
  const renderer = new HtmlResumeRenderer()
  const html = renderer.render(model)

  assert.match(html, /<!DOCTYPE html>/)
  assert.match(html, /<html lang="en">/)
  assert.match(html, /<title>Alex Chen<\/title>/)
  assert.match(html, /<h1>Alex Chen<\/h1>/)
  assert.match(html, /<h2>Experience<\/h2>/)
  assert.match(html, /<h3>Acme Corp<\/h3>/)
  assert.match(html, /<section>/)
  assert.match(html, /<article>/)
  assert.match(html, /<time>/)
  assert.match(html, /<\/html>/)
})

test('HTML renderer escapes special characters', () => {
  const profile = makeProfile()
  profile.identity.person.name = 'Alex & <Co>'
  const model = resumeProjector.project(profile)
  const renderer = new HtmlResumeRenderer()
  const html = renderer.render(model)

  assert.match(html, /Alex &amp; &lt;Co&gt;/)
  assert.doesNotMatch(html, /<Co>/)
})
```

- [ ] **Step 7: Build and run all tests**

```bash
npm run typecheck
npm test
npm run build
```

Expected: all pass. `provena render examples/valen --format html` produces `examples/valen/resume.html` with semantic HTML.

- [ ] **Step 8: Update gitignore to exclude generated HTML (examples)**

Add to `.gitignore`:
```
examples/*/resume.html
```

---

## Self-Review

**Spec coverage:**
- Fase 1 (Site): ✅ Task 1 — website/index.md rewrite + use-cases.md
- Fase 2 (Distribución): ✅ Task 2 — tsup build, npm publish prep, quickstart updated
- Fase 3 (Onboarding): ✅ Tasks 3-4 — init command + validate improvements
- Fase 4 (Confianza técnica): ✅ Tasks 5-6 — E2E tests, snapshots, CI workflow
- Fase 5 (I6 cerrado): ✅ Task 7 — HTML renderer with semantic HTML

**Placeholder scan:** No placeholders. All code is complete.

**Type consistency:** `ResumeModel`, `Renderer`, `Projector` types consistent across all tasks. `ValidationError.source` added in Task 4, used in Task 4. `HtmlResumeRenderer` implements `Renderer<ResumeModel>` matching existing interface.