# H8 Generalization & Border-Case Stress Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Corpus v2 dataset fixtures and H8 Generalization stress benchmark in `@provena/core` to challenge the frozen Decision Engine under high border-case market pressure, evaluating whether Attention Reduction ($>60\%$), Attention Precision ($>80\%$), and MOR ($\approx 0\%$) hold up across diverse role families and ambiguous seniorities.

**Architecture:** Create Corpus v2 in `packages/core/src/fixtures/verdict-ground-truth-v2.ts` with 50+ annotated real opportunities. Build `runGeneralizationBenchmarkV2` in `packages/core/src/attention-validation-v2.ts` comparing Corpus v1 vs Corpus v2 performance and auditing border-case failures.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`).

## Global Constraints

- **FROZEN Engine Invariant:** Zero modifications to `evaluateOpportunity`, `DeclarativeMarketRecognizer`, or existing knowledge packs.
- **Corpus v2 Scale:** Must contain at least 50 real annotated opportunities including near-profile matches, stack equivalences, hybrid roles, and ambiguous seniorities.
- **Falsification Auditing:** Border-case failures ($FP$ or $FN$) must be logged with category breakdown to inform future policy iterations.
- **Deterministic:** All calculations must be 100% pure and deterministic.

---

### Task 1: Corpus v2 Border-Case Fixture Dataset

**Files:**
- Create: `packages/core/src/fixtures/verdict-ground-truth-v2.ts`
- Create: `packages/core/src/fixtures/verdict-ground-truth-v2.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `GroundTruthOpportunity` schema.
- Produces: `VERDICT_GROUND_TRUTH_DATASET_V2: readonly GroundTruthOpportunity[]` containing 50+ annotated opportunities with deliberate border cases.

- [ ] **Step 1: Write failing test for Corpus v2 Fixture Dataset**

Create `packages/core/src/fixtures/verdict-ground-truth-v2.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './verdict-ground-truth-v2.js'

test('VERDICT_GROUND_TRUTH_DATASET_V2 contains at least 50 annotated real opportunities with border-case categories', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET_V2))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET_V2.length >= 50,
    `Corpus v2 size must be at least 50, got ${VERDICT_GROUND_TRUTH_DATASET_V2.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET_V2.filter(i => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET_V2.filter(i => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 10, 'Corpus v2 must contain at least 10 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 25, 'Corpus v2 must contain at least 25 NOT_WORTH opportunities')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth-v2.test.ts`
Expected: Fail because module `verdict-ground-truth-v2.js` does not exist.

- [ ] **Step 3: Implement `verdict-ground-truth-v2.ts`**

Create `packages/core/src/fixtures/verdict-ground-truth-v2.ts` defining 50+ real annotated opportunities across:
- Near-profile matches (Kernel, High-Load Distributed Systems)
- Partially compatible (Tech Lead Manager, SRE, Systems Architect)
- Stack equivalences (Java/C++ HFT vs Go/Rust Distributed Infra)
- Hybrid roles (Solutions Architect + Hands-on Coding)
- Ambiguous seniorities (Senior/Lead/Staff)
- Irrelevant / Noise (Facilities, Sales, Marketing, Legal, HR, Admin, Internships)

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth-v2.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/fixtures/verdict-ground-truth-v2.ts packages/core/src/fixtures/verdict-ground-truth-v2.test.ts packages/core/src/index.ts
git commit -m "feat(core): add Corpus v2 fixture dataset with 50+ annotated border-case opportunities"
```

---

### Task 2: H8 Generalization Benchmark Engine

**Files:**
- Create: `packages/core/src/attention-validation-v2.ts`
- Create: `packages/core/src/attention-validation-v2.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Corpus v1 (`VERDICT_GROUND_TRUTH_DATASET`), Corpus v2 (`VERDICT_GROUND_TRUTH_DATASET_V2`), candidate `Profile`, and recognizer.
- Produces: `runGeneralizationBenchmarkV2(...)` returning `GeneralizationBenchmarkResult` with comparative metrics and border-case failure audit.

- [ ] **Step 1: Write failing test for H8 Generalization Benchmark Engine**

Create `packages/core/src/attention-validation-v2.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runGeneralizationBenchmarkV2 } from './attention-validation-v2.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './fixtures/verdict-ground-truth-v2.js'
import { getEmbeddedProfile } from './profile.js'

test('runGeneralizationBenchmarkV2 compares Corpus v1 vs Corpus v2 and audits border-case failures', () => {
  const profile = getEmbeddedProfile()
  const result = runGeneralizationBenchmarkV2(
    VERDICT_GROUND_TRUTH_DATASET,
    VERDICT_GROUND_TRUTH_DATASET_V2,
    profile
  )

  assert.ok(result.v1CorpusMetrics.totalEvaluated >= 30)
  assert.ok(result.v2CorpusMetrics.totalEvaluated >= 50)
  assert.ok(typeof result.delta.attentionReductionDelta === 'number')
  assert.ok(Array.isArray(result.borderCaseFailures))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/attention-validation-v2.test.ts`
Expected: Fail because module `attention-validation-v2.js` does not exist.

- [ ] **Step 3: Implement `attention-validation-v2.ts`**

Create `packages/core/src/attention-validation-v2.ts`:

```typescript
import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runAttentionValidationAtScale, type AttentionValidationMetrics } from './attention-validation.js'
import { evaluateOpportunity } from './opportunity.js'

export interface BorderCaseFailure {
  readonly id: string
  readonly title: string
  readonly expected: string
  readonly actual: string
  readonly notes?: string
}

export interface GeneralizationBenchmarkResult {
  readonly v1CorpusMetrics: AttentionValidationMetrics
  readonly v2CorpusMetrics: AttentionValidationMetrics
  readonly delta: {
    readonly attentionReductionDelta: number
    readonly precisionDelta: number
    readonly missedOpportunityRateDelta: number
  }
  readonly borderCaseFailures: readonly BorderCaseFailure[]
}

export function runGeneralizationBenchmarkV2(
  corpusV1: readonly GroundTruthOpportunity[],
  corpusV2: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): GeneralizationBenchmarkResult {
  const v1Metrics = runAttentionValidationAtScale(corpusV1, profile, recognizer)
  const v2Metrics = runAttentionValidationAtScale(corpusV2, profile, recognizer)

  const failures: BorderCaseFailure[] = []
  for (const item of corpusV2) {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    const ev = evaluateOpportunity(fullJd, profile, recognizer)
    const verdict = ev.verdict.toLowerCase()

    const isSurfaced = verdict === 'apply' || verdict === 'consider' || verdict === 'interested'
    const isSkipped = verdict === 'skip' || verdict === 'dismissed'

    // FN: Worth attention but skipped
    if (item.groundTruth === 'WORTH_ATTENTION' && isSkipped) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'WORTH_ATTENTION',
        actual: ev.verdict,
        notes: item.notes,
      })
    }
    // FP: Not worth attention but surfaced
    if (item.groundTruth === 'NOT_WORTH' && isSurfaced) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'NOT_WORTH',
        actual: ev.verdict,
        notes: item.notes,
      })
    }
  }

  return {
    v1CorpusMetrics: v1Metrics,
    v2CorpusMetrics: v2Metrics,
    delta: {
      attentionReductionDelta: Math.round((v2Metrics.attentionReduction - v1Metrics.attentionReduction) * 100) / 100,
      precisionDelta: Math.round((v2Metrics.attentionPrecision - v1Metrics.attentionPrecision) * 100) / 100,
      missedOpportunityRateDelta: Math.round((v2Metrics.missedOpportunityRate - v1Metrics.missedOpportunityRate) * 100) / 100,
    },
    borderCaseFailures: failures,
  }
}
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/attention-validation-v2.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/attention-validation-v2.ts packages/core/src/attention-validation-v2.test.ts packages/core/src/index.ts
git commit -m "feat(core): add H8 generalization benchmark engine and border-case failure auditing"
```

---

### Task 3: Falsification Suite Execution & H8 Hypothesis Verification

**Files:**
- Create: `packages/core/src/attention-validation-h8.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: `runGeneralizationBenchmarkV2`, `VERDICT_GROUND_TRUTH_DATASET_V2`, frozen Market Recognition v1 recognizer.
- Produces: Empirical validation of Hypothesis H8 over 50+ border-case opportunities: Attention Reduction $\ge 60\%$, Attention Precision $\ge 80\%$, $\text{MOR} \le 5\%$.

- [ ] **Step 1: Write H8 Hypothesis Verification Test**

Create `packages/core/src/attention-validation-h8.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runGeneralizationBenchmarkV2,
  VERDICT_GROUND_TRUTH_DATASET,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('H8 Hypothesis Verification: frozen Decision Engine maintains >60% Attention Reduction and low MOR under Corpus v2 border-case stress', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const result = runGeneralizationBenchmarkV2(
    VERDICT_GROUND_TRUTH_DATASET,
    VERDICT_GROUND_TRUTH_DATASET_V2,
    profile,
    recognizer
  )

  const v2 = result.v2CorpusMetrics

  // Verify scale
  assert.ok(v2.totalEvaluated >= 50, `Corpus v2 must contain >= 50 items, got ${v2.totalEvaluated}`)

  // H8 Hypothesis Core Metrics Check
  assert.ok(
    v2.attentionReduction >= 0.60,
    `H8 Attention Reduction target >= 60%, got ${(v2.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    v2.attentionPrecision >= 0.80,
    `H8 Attention Precision target >= 80%, got ${(v2.attentionPrecision * 100).toFixed(1)}%`
  )
  assert.ok(
    v2.missedOpportunityRate <= 0.05,
    `H8 MOR target <= 5%, got ${(v2.missedOpportunityRate * 100).toFixed(1)}%`
  )
})
```

- [ ] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: PASS (All tests pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/attention-validation-h8.test.ts
git commit -m "test(core): add H8 generalization hypothesis stress verification test"
```
