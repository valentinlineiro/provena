# Explicit Decision Context Vocabulary Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove implicit hardcoded leadership terms (`'technical-leadership'`, `'lead'`, `'leadership'`) from `cvProjector` in `@provena/core`, ensuring relevance vocabulary originates strictly from `DecisionContext.emphasize` (or `profile.preferences.interests` fallback).

**Architecture:** Update `cvProjector` vocabulary resolution logic in `packages/core/src/cv-projector.ts`, update unit tests to verify that `cvProjector` does not inject implicit terms, update Decision Context test fixtures that target Staff roles to explicitly pass leadership terms when intended, and re-run the audit experiment to record the empirical impact on the selection matrix.

**Tech Stack:** TypeScript, Vitest, `@provena/core`.

## Global Constraints

- cvProjector MUST NOT inject implicit relevance vocabulary.
- Relevance vocabulary is taken from `DecisionContext.emphasize` when explicitly provided (`context.emphasize ?? profile.preferences?.interests ?? []`).
- An explicit empty array `emphasize: []` means zero emphasis terms.
- Follow TDD: write failing unit test, verify failure, implement change, verify pass, commit.

---

### Task 1: Refactor `cvProjector` Vocabulary Resolution

**Files:**
- Modify: `packages/core/src/cv-projector.ts`
- Modify: `packages/core/src/cv-projector.test.ts`

**Interfaces:**
- Consumes: `CVContext.emphasize`, `Profile.preferences.interests`.
- Produces: `cvProjector()` with explicit vocabulary authority.

- [ ] **Step 1: Write failing test verifying zero implicit vocabulary injection**

In `packages/core/src/cv-projector.test.ts`:
```typescript
it('does not inject implicit leadership terms when emphasize is explicitly provided', () => {
  // Pass emphasize: ['Spring'] and verify that 'lead' or 'leadership' in bullet text does not trigger relevance stem hits for leadership group
})

it('uses empty vocabulary when emphasize is explicitly empty array []', () => {
  // Pass emphasize: [] and verify relevanceVocab is empty
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: FAIL (implicit leadership terms were previously injected).

- [ ] **Step 3: Update `cvProjector` vocabulary resolution**

In `packages/core/src/cv-projector.ts`:
```typescript
// Replace:
const relevanceVocab = [
  ...(context.emphasize ?? profile.preferences?.interests ?? []),
  'technical-leadership',
  'lead',
  'leadership',
]

// With:
const relevanceVocab = context.emphasize ?? profile.preferences?.interests ?? []
```

- [ ] **Step 4: Run tests to verify it passes**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full test suite & update existing tests if needed**

Run: `npm test`
Expected: PASS (Update any legacy test assertions if they relied on implicit leadership injection).

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/cv-projector.ts packages/core/src/cv-projector.test.ts
git commit -m "fix(core): remove implicit leadership vocabulary injection from cvProjector"
```

---

### Task 2: Re-run Audit Experiment & Document Empirical Baseline Comparison

**Files:**
- Modify: `packages/core/test/audit-contributions-experiment.test.ts`
- Update: `docs/research/2026-08-03-contribution-projection-audit.md`

**Interfaces:**
- Consumes: Refactored `cvProjector`.
- Produces: Updated empirical audit report comparing Baseline `commit 4d30c21` vs Explicit Vocabulary Authority (`Task 1`).

- [ ] **Step 1: Re-run audit experiment script**

Run: `npx vitest run packages/core/test/audit-contributions-experiment.test.ts`
Expected: PASS (Generates updated audit report file).

- [ ] **Step 2: Record empirical matrix comparison in `docs/research/2026-08-03-contribution-projection-audit.md`**

Compare selection results for `summa-ai-assisted-engineering` across Backend and Research contexts, verifying if the false positive matches dropped as hypothesized.

- [ ] **Step 3: Run full typecheck and workspace test suite**

Run: `npm run typecheck && npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add docs/research/2026-08-03-contribution-projection-audit.md packages/core/test/audit-contributions-experiment.test.ts
git commit -m "docs(research): update audit report with empirical impact of explicit vocabulary authority"
```

---

## Plan Self-Review

1. **Spec Coverage:**
   - Remove implicit leadership vocabulary: Task 1.
   - Enforce explicit `DecisionContext.emphasize` / `profile.preferences.interests` fallback: Task 1.
   - Re-run 4-context audit and document comparison: Task 2.
2. **Placeholder scan:** Clean. No TODOs or vague steps.
3. **Type consistency:** Identical function signatures and interfaces across all tasks.
