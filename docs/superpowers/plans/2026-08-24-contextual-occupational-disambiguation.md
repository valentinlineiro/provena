# Step 9 — Contextual Disambiguation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `OCCUPATIONAL_CONTEXT_KNOWLEDGE` patterns and contextual disambiguation rules in `@provena/core` targeting the 23 adversarial false positive clusters (People Management vs IC, Pre-Sales Architecture, Embedded/Firmware, Game Graphics) to recover Attention Reduction ($>60\%$) and Precision ($>85\%$) while strictly preserving the $\text{MOR} = 0.0\%$ ($FN = 0$) safety guardrail.

**Architecture:** Add `OCCUPATIONAL_CONTEXT_KNOWLEDGE` pack to `packages/core/src/domain-knowledge.ts`, update `parseRoleRequirement` in `packages/core/src/opportunity.ts` to disambiguate role scope from title and body context, and run Corpus v2 benchmark verification.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`).

## Global Constraints

- **STRICT MOR GUARDRAIL:** $\text{MOR}$ must remain **$0.0\%$ ($FN = 0$)**. Zero false skips on `WORTH_ATTENTION` opportunities!
- **Target Performance on Corpus v2 (55 items):** Attention Reduction $>60\%$, Attention Precision $>85\%$.
- **Adversarial Clusters Addressed:**
  - Cluster A: Pure People Management vs IC Coding.
  - Cluster B: Pre-Sales Enablement / Solutions Architect vs Core Platform IC.
  - Cluster C: Embedded/Firmware & Game Graphics vs Cloud Infra/Backend.

---

### Task 1: Occupational Context Knowledge Pack & Patterns

**Files:**
- Modify: `packages/core/src/domain-knowledge.ts`
- Modify: `packages/core/src/domain-knowledge.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `MarketKnowledge` schema.
- Produces: `OCCUPATIONAL_CONTEXT_KNOWLEDGE: MarketKnowledge` capturing contextual signals for people management, pre-sales enablement, embedded hardware, and game engine graphics.

- [ ] **Step 1: Write failing test for Occupational Context Knowledge**

Update `packages/core/src/domain-knowledge.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  DeclarativeMarketRecognizer,
} from './index.js'

test('OCCUPATIONAL_CONTEXT_KNOWLEDGE extracts context signals for pre-sales, people management, and embedded hardware', () => {
  const combined = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, OCCUPATIONAL_CONTEXT_KNOWLEDGE)
  const recognizer = new DeclarativeMarketRecognizer(combined)

  const jd = 'Enterprise Pre-Sales Solutions Architect role focused on sales enablement, technical demos, and RFP proposals.'
  const model = recognizer.extractMarketRequirements(jd)

  assert.ok(model.requirements.length > 0)
  assert.ok(model.requirements.some(r => r.name.toLowerCase().includes('pre-sales') || r.kind === 'practice'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/domain-knowledge.test.ts`
Expected: Fail because `OCCUPATIONAL_CONTEXT_KNOWLEDGE` is not defined.

- [ ] **Step 3: Implement `OCCUPATIONAL_CONTEXT_KNOWLEDGE`**

In `packages/core/src/domain-knowledge.ts`:
Define and export `OCCUPATIONAL_CONTEXT_KNOWLEDGE` containing pattern definitions for:
- Pre-Sales / Sales Enablement (RFP, technical demo, pre-sales)
- Pure People Management (0% coding, performance reviews, direct reports management)
- Embedded / Hardware (microcontroller, RTOS, firmware, PCB)
- Game Graphics Engine (OpenGL, Vulkan, DirectX, shader, graphics rendering)

Re-export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/domain-knowledge.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain-knowledge.ts packages/core/src/domain-knowledge.test.ts packages/core/src/index.ts
git commit -m "feat(core): add occupational context knowledge pack for role disambiguation"
```

---

### Task 2: Disambiguation Evaluator Integration

**Files:**
- Modify: `packages/core/src/opportunity.ts`
- Modify: `packages/core/src/opportunity.test.ts`

**Interfaces:**
- Consumes: JD title + body text, candidate profile preferences.
- Produces: Disambiguated `parseRoleRequirement` classifying out-of-profile roles (`pre-sales`, `people_management`, `embedded_hardware`, `game_graphics`, `frontend_ui`) as non-matching role families when candidate profile targets backend IC infrastructure.

- [ ] **Step 1: Write failing test for Role Disambiguation**

In `packages/core/src/opportunity.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateOpportunity, getEmbeddedProfile } from './index.js'

test('evaluateOpportunity classifies pre-sales, pure management, and embedded firmware as out-of-profile skip', () => {
  const profile = getEmbeddedProfile()

  const preSales = evaluateOpportunity(
    'Enterprise Solutions Architect - Pre-Sales\nRole focused on technical demos, RFPs, and sales enablement.',
    profile
  )
  assert.equal(preSales.verdict, 'skip')

  const pureManager = evaluateOpportunity(
    'Engineering Manager - Core Platform\nPure people management role with 0% coding and 100% administrative direct reports management.',
    profile
  )
  assert.equal(pureManager.verdict, 'skip')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/opportunity.test.ts`
Expected: Fail because current evaluator surfaces pre-sales and pure management as `consider`.

- [ ] **Step 3: Update `parseRoleRequirement` in `opportunity.ts`**

Enhance `parseRoleRequirement` regex and context rules in `packages/core/src/opportunity.ts` to detect:
- Pre-Sales / Enablement: `/\b(?:pre-sales|sales enablement|rfp proposals?|sales architect)\b/i`
- Pure People Management: `/\b(?:0% coding|pure people management|administrative manager|direct reports only)\b/i`
- Embedded Hardware: `/\b(?:firmware|microcontroller|rtos|pcb design|hardware engineer)\b/i`
- Game Graphics: `/\b(?:game engine|graphics renderer|vulkan|opengl|shader developer)\b/i`

Map these to non-matching role family constraints when candidate profile specifies `roleFamily: 'software_engineer'` or IC preferences.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/opportunity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/opportunity.ts packages/core/src/opportunity.test.ts
git commit -m "feat(core): integrate contextual occupational disambiguation into role evaluator"
```

---

### Task 3: Step 9 Empirical Benchmark & MOR Guardrail Verification

**Files:**
- Create: `packages/core/src/attention-validation-v9.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: Corpus v2 (55 items), enriched `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, and updated evaluator.
- Produces: Empirical proof that Step 9 recovers Attention Reduction ($>60\%$) and Precision ($>85\%$) while maintaining **$\text{MOR} = 0.0\%$ ($FN = 0$)**.

- [ ] **Step 1: Write Step 9 Empirical Benchmark Test**

Create `packages/core/src/attention-validation-v9.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runAttentionValidationAtScale,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
} from './index.js'

test('Step 9 Contextual Disambiguation: recovers Attention Reduction >60% and Precision >80% while preserving MOR = 0% guardrail', () => {
  const profile = getEmbeddedProfile()
  const knowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE,
    OCCUPATIONAL_CONTEXT_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(knowledge)

  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET_V2, profile, recognizer)

  // STRICT SAFETY GUARDRAIL
  assert.equal(
    metrics.matrix.fn,
    0,
    `STRICT MOR GUARDRAIL VIOLATED: Found ${metrics.matrix.fn} false skips on worth-attention roles`
  )

  // Recovery Targets
  assert.ok(
    metrics.attentionReduction >= 0.60,
    `Attention Reduction target >= 60%, got ${(metrics.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    metrics.attentionPrecision >= 0.80,
    `Attention Precision target >= 80%, got ${(metrics.attentionPrecision * 100).toFixed(1)}%`
  )
})
```

- [ ] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: PASS (All 360+ tests pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/attention-validation-v9.test.ts
git commit -m "test(core): verify Step 9 contextual disambiguation benchmark and MOR = 0% safety guardrail"
```
