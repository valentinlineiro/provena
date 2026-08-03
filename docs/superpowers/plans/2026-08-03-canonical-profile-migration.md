# Canonical Profile Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove `examples/valen`, update documentation and CLI to reference `profiles/valentin`, migrate unit tests to isolated synthetic fixtures, and add CI check enforcing zero references to `examples/valen`.

**Architecture:** 
- `profiles/valentin` becomes the sole canonical identity for real data, docs, and E2E/integration tests.
- Unit tests use synthetic in-memory/temp workspace builders (`createTestWorkspace`).
- CI check verifies zero occurrences of `examples/valen`.

**Tech Stack:** TypeScript, Node.js (`fs`/`path`), Node test runner.

## Global Constraints

- **Spec Document:** `docs/superpowers/specs/2026-08-03-canonical-profile-migration-design.md`
- **Rule:** Unit tests MUST NOT depend on `profiles/valentin`. Use synthetic fixtures for unit tests.
- **Rule:** `profiles/valentin` must remain loadable using standard public workspace APIs without special-case code.
- **Rule:** 0 occurrences of `examples/valen` in codebase/docs.

---

### Task 1: Create Synthetic Test Workspace Helpers & Migrate Unit Tests

**Files:**
- Create: `packages/core/src/test-utils/createTestWorkspace.ts`
- Modify: `packages/cli/src/index.test.ts` (or any CLI unit tests referencing `examples/valen`)
- Delete: `examples/valen/`

**Interfaces:**
- Produces: `createTestWorkspace(options?: SyntheticWorkspaceOptions): Promise<{ rootDir: string; cleanup: () => void }>`

- [ ] **Step 1: Write `createTestWorkspace` helper in `packages/core/src/test-utils/createTestWorkspace.ts`**

```typescript
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface SyntheticWorkspaceOptions {
  personName?: string;
  title?: string;
}

export async function createTestWorkspace(options: SyntheticWorkspaceOptions = {}) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "provena-test-"));
  const personName = options.personName ?? "Test Person";
  const title = options.title ?? "Software Engineer";

  fs.writeFileSync(
    path.join(tmpDir, "person.yaml"),
    `name: "${personName}"\ntitle: "${title}"\nsummary: "Test summary"\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "experience.yaml"),
    `- id: "exp-1"\n  organization: "Test Org"\n  title: "${title}"\n  start: "2024-01"\n  summary: "Test exp"\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "capabilities.yaml"),
    `- id: "cap-1"\n  name: "Testing"\n  description: "Writing unit tests"\n`,
    "utf-8"
  );
  fs.writeFileSync(
    path.join(tmpDir, "provena.yaml"),
    `version: 1\nidentity:\n  person: person.yaml\n  experiences:\n    - experience.yaml\n  capabilities:\n    - capabilities.yaml\n`,
    "utf-8"
  );

  return {
    rootDir: tmpDir,
    cleanup: () => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };
}
```

- [ ] **Step 2: Update CLI tests to use `createTestWorkspace` instead of `examples/valen`**

Replace references to `examples/valen` in test files with synthetic workspaces.

- [ ] **Step 3: Remove `examples/valen` folder completely**

Run: `rm -rf examples/valen`

- [ ] **Step 4: Run unit tests to verify all tests pass**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/test-utils/ packages/cli/
git rm -r examples/valen
git commit -m "refactor(tests): migrate unit tests to synthetic workspace helpers and remove examples/valen"
```

---

### Task 2: Update Website & Documentation to Reference `profiles/valentin`

**Files:**
- Modify: `website/index.md`
- Modify: `website/quickstart.md`
- Modify: `website/examples.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Update `website/index.md`**

Replace references of `npx @provena/cli render examples/valen` with `npx @provena/cli render profiles/valentin`.

- [ ] **Step 2: Update `website/quickstart.md` and `website/examples.md`**

Replace references to `examples/valen` with `profiles/valentin`.

- [ ] **Step 3: Update `CLAUDE.md`**

Replace any command snippets referencing `examples/valen` with `profiles/valentin`.

- [ ] **Step 4: Commit**

```bash
git add website/ CLAUDE.md
git commit -m "docs: update website and documentation to reference profiles/valentin"
```

---

### Task 3: Integration Test for `profiles/valentin` & CI Zero-Reference Invariant

**Files:**
- Create: `packages/core/src/canonicalProfile.test.ts`
- Create: `scripts/check-no-examples-valen.sh` (or add lint check in `package.json`)
- Modify: `package.json`

- [ ] **Step 1: Write integration test for `profiles/valentin`**

```typescript
// packages/core/src/canonicalProfile.test.ts
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadWorkspace } from "./index.js";

describe("Canonical Profile Integration (profiles/valentin)", () => {
  it("loads profiles/valentin using standard workspace API", async () => {
    const profilePath = path.resolve(process.cwd(), "profiles/valentin");
    const workspace = await loadWorkspace(profilePath);
    assert.equal(workspace.identity.person.name, "Valentín Liñeiro Barea");
    assert.ok(workspace.identity.experiences.length > 0);
  });
});
```

- [ ] **Step 2: Add CI script/check to enforce 0 occurrences of `examples/valen`**

In `package.json`, add script `"lint:no-legacy-examples": "node -e \"const fs=require('fs'), path=require('path'); const grep = (dir) => { fs.readdirSync(dir).forEach(f => { const p = path.join(dir, f); if (f==='node_modules'||f==='.git'||f==='.superpowers'||f==='dist') return; if (fs.statSync(p).isDirectory()) grep(p); else if (fs.readFileSync(p, 'utf8').includes('examples/valen')) { console.error('Forbidden reference to examples/valen in ' + p); process.exit(1); } }); }; grep('.'); console.log('Zero legacy examples/valen references found.');\""`

- [ ] **Step 3: Run `npm run lint:no-legacy-examples`, `npm test`, and `npm run typecheck`**

Run: `npm run lint:no-legacy-examples && npm test && npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add packages/core/src/canonicalProfile.test.ts package.json
git commit -m "ci: add canonical profile integration test and zero legacy reference check"
```

---

## Self-Review Checklist

1. **Spec coverage:** 
   - `examples/valen` removed -> Task 1
   - `profiles/valentin` referenced in docs -> Task 2
   - Synthetic fixtures for unit tests -> Task 1
   - CI 0-reference check & canonical integration test -> Task 3
2. **Placeholder scan:** None found.
3. **Type consistency:** Matches Node test runner and proven domain APIs.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-08-03-canonical-profile-migration.md`. Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** - Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach would you like to take?
