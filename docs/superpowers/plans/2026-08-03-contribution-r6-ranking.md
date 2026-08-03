# Contribution-Level R6 & Scope Ranking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor R6 evaluation in `@provena/core` to evaluate `Contribution` objects directly using structured signals (`summary`, `outcome`, `technologies`, resolved `capabilities`) and lexicographical `Scope` ranking before terminal formatting, then execute the experimental audit to compare against baseline `607b4d1`.

**Architecture:** Add `rankContributions()` and `evaluateContribution()` in `packages/core/src/cv-projector.ts`, utilizing a lexicographical tuple (`semanticClassRank`, `hits`, `scopeLevelRank`, `roleRank`, `evidenceClassRank`, `canonicalIndex`). Update `cvProjector` selection to compute `ExperienceContribution` from candidate contributions, budget top ranked contributions, and format selected items terminally.

**Tech Stack:** TypeScript, Vitest, `@provena/core`.

## Global Constraints

- Preserve exact TypeScript types and immutability (`readonly`).
- Follow TDD: write failing unit tests for lexicographical ranking and invariants, implement minimum code, verify pass, commit.
- Invariant 1: If $H = 0$, contribution is classified as `Historical` regardless of `Scope`.
- Invariant 2: `Core` strictly outranks `Supporting` regardless of `Scope`. Between contributions with equal `semanticClass` and equal $H$, `organization + initiator` outranks `team + contributor`.
- Terminal Formatting: Formatting of contribution strings occurs only AFTER ranking and budgeting.

---

### Task 1: Contribution Evaluation & Ranking Functions

**Files:**
- Modify: `packages/core/src/cv-projector.ts`
- Modify: `packages/core/src/cv-projector.test.ts`

**Interfaces:**
- Produces: `evaluateContribution()`, `rankContributions()`, `ContributionSortTuple` in `packages/core/src/cv-projector.ts`.

- [ ] **Step 1: Write failing unit tests for Contribution ranking and invariants**

In `packages/core/src/cv-projector.test.ts`:
```typescript
describe('Contribution-level R6 & Scope Ranking', () => {
  it('classifies H=0 as Historical regardless of Scope', () => {
    // Test that a contribution with 0 hits and scope: organization + initiator ranks Historical
  })

  it('ranks Core over Supporting regardless of Scope', () => {
    // Core + team outranks Supporting + organization
  })

  it('ranks higher Scope level and Role when semantic class and H are equal', () => {
    // Equal H, equal class: organization + initiator > team + contributor
  })

  it('resolves capabilityIds to Capability names for semantic matching', () => {
    // Capability name match contributes to H
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: FAIL (`evaluateContribution` / `rankContributions` not defined).

- [ ] **Step 3: Implement `evaluateContribution` and `rankContributions`**

In `packages/core/src/cv-projector.ts`:
- Define numeric helpers: `scopeLevelRank(level?: ScopeLevel): number`, `roleRank(role?: ContributionRole): number`.
- `evaluateContribution(contrib: Contribution, activeVocab: ReadonlySet<number>, capabilitiesMap: Map<string, Capability>): ContributionEvaluation`:
  - Calculate `hits` $H$ across `summary`, `outcome?.summary`, `technologies`, and linked `Capability.name`s.
  - Determine `semanticClass`: $H \ge 2 \implies \text{Core}$, $H = 1 \implies \text{Supporting}$, $H = 0 \implies \text{Historical}$.
  - Calculate `evidenceClassRank`: `classifyEvidence(contrib.outcome?.summary ?? contrib.summary).valueOf()`.
- `rankContributions(contribs: readonly Contribution[], vocab: readonly string[], capabilities: readonly Capability[]): EvaluatedContribution[]`:
  - Build `capabilitiesMap`.
  - Compute sort tuple for each contribution.
  - Sort using lexicographical comparison.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/cv-projector.ts packages/core/src/cv-projector.test.ts
git commit -m "feat(core): implement Contribution-level R6 semantic evaluation and lexicographical Scope ranking"
```

---

### Task 2: Refactor `cvProjector` Selection Loop & Experience Derivation

**Files:**
- Modify: `packages/core/src/cv-projector.ts`
- Modify: `packages/core/src/cv-projector.test.ts`

**Interfaces:**
- Consumes: `rankContributions()`, `Profile.capabilities`.
- Produces: Updated `cvProjector()` loop deriving `ExperienceContribution` before budget, selecting top contributions, and formatting terminally.

- [ ] **Step 1: Write failing test for experience contribution derivation & terminal formatting**

In `packages/core/src/cv-projector.test.ts`:
```typescript
it('derives experience contribution from max contribution rank before budget cap', () => {
  // Experience with 3 Core contributions has ExperienceContribution = Core
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `cvProjector()` selection loop**

In `packages/core/src/cv-projector.ts`:
- Pass `profile.capabilities` into `rankContributions()`.
- For each experience:
  - Find matching `expContributions`.
  - If `expContributions.length > 0`:
    - Rank contributions using `rankContributions()`.
    - Determine `experienceContribution`: max `semanticClassRank` among candidate contributions.
    - Select top $N$ non-Historical contributions up to `CONTRIBUTION_BUDGET[experienceContribution]`.
    - Format selected contributions terminally (`${summary} (Outcome: ${outcome.summary})`).
  - If `expContributions.length === 0`:
    - Fall back to legacy string `experienceContribution()` and legacy `achievements`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run packages/core/src/cv-projector.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/cv-projector.ts packages/core/src/cv-projector.test.ts
git commit -m "refactor(core): integrate Contribution-level R6 ranking in cvProjector selection pipeline"
```

---

### Task 3: Execute Audit Experiment & Record Empirical Comparison

**Files:**
- Modify: `packages/core/test/audit-contributions-experiment.test.ts`
- Update: `docs/research/2026-08-03-contribution-projection-audit.md`

**Interfaces:**
- Consumes: Updated `cvProjector`.
- Produces: Executed audit test and updated empirical comparison report against baseline `607b4d1`.

- [ ] **Step 1: Execute audit experiment test script**

Run: `npx vitest run packages/core/test/audit-contributions-experiment.test.ts`
Expected: PASS (Generates updated audit report file).

- [ ] **Step 2: Review generated matrix and add comparison section against baseline `607b4d1`**

Inspect generated report in `docs/research/2026-08-03-contribution-projection-audit.md` and document the exact empirical differences between baseline `607b4d1` and new Contribution-level R6.

- [ ] **Step 3: Run full repository test suite and typecheck**

Run: `npm run typecheck && npm test`
Expected: PASS (0 errors, 144+ passing tests).

- [ ] **Step 4: Commit**

```bash
git add docs/research/2026-08-03-contribution-projection-audit.md packages/core/test/audit-contributions-experiment.test.ts
git commit -m "docs(research): update audit report with empirical results of Contribution-level R6"
```

---

## Plan Self-Review

1. **Spec Coverage:**
   - Contribution evaluation & hits matching (summary, outcome, technologies, capability names): Task 1.
   - Lexicographical tuple ranking & invariants: Task 1.
   - Experience contribution derivation before budget cap: Task 2.
   - Terminal formatting: Task 2.
   - Experimental audit comparison against `607b4d1`: Task 3.
2. **Placeholder scan:** Clean. No TODOs or vague steps.
3. **Type consistency:** Identical function signatures and interfaces across all tasks.
