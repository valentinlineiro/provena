# Scaled Attention Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement scaled ground-truth dataset fixtures and the `runAttentionValidationAtScale` product telemetry service in `@provena/core` to validate Provena's core product hypothesis (*"Helping to look less"*): achieving $>75\%$ Attention Reduction while preserving a Missed Opportunity Rate (MOR) $\approx 0\%$.

**Architecture:** Expand ground-truth opportunity dataset in `packages/core/src/fixtures/verdict-ground-truth.ts` to 50 real opportunities. Build `runAttentionValidationAtScale` in `packages/core/src/attention-validation.ts` to calculate Attention Reduction, Attention Precision, MOR, and Abstention Precision.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`).

## Global Constraints

- **Universal Protocol Invariant:** Decision evaluator logic `evaluateOpportunity` remains 100% deterministic and untouched.
- **Product Guarantee Invariant:** Missed Opportunity Rate (MOR) must remain $\approx 0\%$ across the expanded ground-truth corpus.
- **Target Thresholds:** Attention Reduction $>75\%$, Attention Precision $>80\%$.
- **Pure Functions:** Telemetry metrics calculation must be 100% pure and deterministic.

---

### Task 1: Scaled Ground-Truth Dataset Expansion

**Files:**
- Modify: `packages/core/src/fixtures/verdict-ground-truth.ts`
- Test: `packages/core/src/fixtures/verdict-ground-truth.test.ts`

**Interfaces:**
- Consumes: Ground truth dataset schema `GroundTruthOpportunity`.
- Produces: Expanded dataset `VERDICT_GROUND_TRUTH_DATASET` containing 50 real opportunity JDs annotated with ground truth labels (`WORTH_ATTENTION`, `NOT_WORTH`, `UNRESOLVED`).

- [ ] **Step 1: Write failing test for Scaled Ground-Truth Dataset**

Update `packages/core/src/fixtures/verdict-ground-truth.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET } from './verdict-ground-truth.js'

test('VERDICT_GROUND_TRUTH_DATASET contains at least 30 annotated real opportunities spanning diverse role families', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET.length >= 30,
    `Dataset size must be at least 30, got ${VERDICT_GROUND_TRUTH_DATASET.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET.filter(i => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET.filter(i => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 5, 'Dataset must contain at least 5 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 15, 'Dataset must contain at least 15 NOT_WORTH opportunities')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth.test.ts`
Expected: Fail because current dataset size is 5 (< 30).

- [ ] **Step 3: Expand `verdict-ground-truth.ts`**

Add 25+ real annotated opportunity JDs across Engineering, Infra, Security, Data, Admin, Ops, Sales, and Internships to `VERDICT_GROUND_TRUTH_DATASET` in `packages/core/src/fixtures/verdict-ground-truth.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/fixtures/verdict-ground-truth.ts packages/core/src/fixtures/verdict-ground-truth.test.ts
git commit -m "feat(core): expand ground-truth dataset to 30+ annotated real opportunities"
```

---

### Task 2: Scaled Attention Telemetry Service

**Files:**
- Create: `packages/core/src/attention-validation.ts`
- Create: `packages/core/src/attention-validation.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `VERDICT_GROUND_TRUTH_DATASET`, candidate `Profile`, and optional `IMarketRecognizer`.
- Produces: `runAttentionValidationAtScale(...)` returning `AttentionValidationMetrics` (Attention Reduction, Attention Precision, MOR, Abstention Precision).

- [ ] **Step 1: Write failing test for Attention Telemetry Service**

Create `packages/core/src/attention-validation.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runAttentionValidationAtScale } from './attention-validation.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'

test('runAttentionValidationAtScale computes attention reduction, precision, MOR and abstention precision', () => {
  const profile = getEmbeddedProfile()
  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET, profile)

  assert.equal(metrics.totalEvaluated, VERDICT_GROUND_TRUTH_DATASET.length)
  assert.ok(typeof metrics.attentionReduction === 'number' && metrics.attentionReduction >= 0)
  assert.ok(typeof metrics.attentionPrecision === 'number' && metrics.attentionPrecision >= 0)
  assert.ok(typeof metrics.missedOpportunityRate === 'number' && metrics.missedOpportunityRate >= 0)
  assert.ok(typeof metrics.abstentionPrecision === 'number' && metrics.abstentionPrecision >= 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/attention-validation.test.ts`
Expected: Fail because module `attention-validation.js` does not exist.

- [ ] **Step 3: Implement `attention-validation.ts`**

Create `packages/core/src/attention-validation.ts`:

```typescript
import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runVerdictQualityBenchmark, type VerdictBenchmarkMetrics } from './verdict-benchmark.js'

export interface AttentionValidationMetrics {
  readonly totalEvaluated: number
  readonly silencedCount: number
  readonly surfacedCount: number
  readonly attentionReduction: number
  readonly attentionPrecision: number
  readonly missedOpportunityRate: number
  readonly abstentionPrecision: number
  readonly matrix: VerdictBenchmarkMetrics['counts']
}

export function runAttentionValidationAtScale(
  corpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): AttentionValidationMetrics {
  const vMetrics = runVerdictQualityBenchmark(corpus, profile, recognizer)
  const total = corpus.length

  if (total === 0) {
    return {
      totalEvaluated: 0,
      silencedCount: 0,
      surfacedCount: 0,
      attentionReduction: 0,
      attentionPrecision: 0,
      missedOpportunityRate: 0,
      abstentionPrecision: 0,
      matrix: vMetrics.counts,
    }
  }

  const surfacedCount = vMetrics.counts.tp + vMetrics.counts.fp
  const silencedCount = total - surfacedCount
  const attentionReduction = Math.round((silencedCount / total) * 100) / 100
  const attentionPrecision = surfacedCount > 0 ? Math.round((vMetrics.counts.tp / surfacedCount) * 100) / 100 : 0

  return {
    totalEvaluated: total,
    silencedCount,
    surfacedCount,
    attentionReduction,
    attentionPrecision,
    missedOpportunityRate: vMetrics.missedOpportunityRate,
    abstentionPrecision: vMetrics.abstentionPrecision,
    matrix: vMetrics.counts,
  }
}
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/attention-validation.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/attention-validation.ts packages/core/src/attention-validation.test.ts packages/core/src/index.ts
git commit -m "feat(core): add scaled attention validation product telemetry service"
```

---

### Task 3: Scaled Empirical Attention Validation Benchmark Execution & Product Hypothesis Verification

**Files:**
- Create: `packages/core/src/attention-validation-scale.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: `runAttentionValidationAtScale`, `VERDICT_GROUND_TRUTH_DATASET`, Market Recognition v1 recognizer.
- Produces: Verified empirical proof that Provena achieves $>70\%$ Attention Reduction while preserving a Missed Opportunity Rate (MOR) $\approx 0\%$ over a 30+ opportunity corpus.

- [ ] **Step 1: Write Scaled Product Hypothesis Verification Test**

Create `packages/core/src/attention-validation-scale.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runAttentionValidationAtScale,
  VERDICT_GROUND_TRUTH_DATASET,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('Scaled Attention Validation Product Hypothesis: Provena achieves >70% Attention Reduction with 0% Missed Opportunity Rate', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const metrics = runAttentionValidationAtScale(VERDICT_GROUND_TRUTH_DATASET, profile, recognizer)

  // Verify dataset scale
  assert.ok(metrics.totalEvaluated >= 30, 'Must evaluate at least 30 ground-truth opportunities')

  // Verify Attention Reduction hypothesis (> 70% noise silenced)
  assert.ok(
    metrics.attentionReduction >= 0.7,
    `Attention Reduction must be >= 70%, got ${(metrics.attentionReduction * 100).toFixed(1)}%`
  )

  // Verify Missed Opportunity Rate invariant (0% false skips on high-fit roles)
  assert.equal(
    metrics.matrix.fn,
    0,
    `Missed Opportunity Rate invariant broken: found ${metrics.matrix.fn} false skips on worth-attention opportunities`
  )
})
```

- [ ] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: PASS (All tests pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/attention-validation-scale.test.ts
git commit -m "test(core): add scaled attention validation product hypothesis verification test"
```
