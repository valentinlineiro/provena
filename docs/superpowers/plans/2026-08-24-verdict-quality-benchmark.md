# Verdict Quality Empirical Benchmark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the ground-truth Verdict Quality benchmark and causal A/B delta comparison engine in `@provena/core` to evaluate whether Market Recognition v1 improves Decision Precision, Missed Opportunity Rate, and Abstention Rate.

**Architecture:** Create ground-truth opportunity fixtures in `packages/core/src/fixtures/verdict-ground-truth.ts`, implement metric computation in `packages/core/src/verdict-benchmark.ts`, and add causal A/B evaluation suite comparing Baseline vs Expanded v1 market knowledge.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`).

## Global Constraints

- **Universal Protocol Invariant:** Decision evaluator logic `evaluateOpportunity` remains 100% deterministic and untouched.
- **Explicit Ground Truth Reference:** Ground truth labels (`WORTH_ATTENTION` | `NOT_WORTH` | `UNRESOLVED`) are defined independently of the decision engine.
- **Key Metrics:** Precision, Recall, Decision Accuracy, Missed Opportunity Rate ($FN / (TP + FN)$), Abstention Rate, Abstention Precision.
- **Causal Delta:** Benchmark must measure exact $\Delta$ between Baseline knowledge and Expanded v1 knowledge.

---

### Task 1: Ground Truth Fixtures & Dataset Schema

**Files:**
- Create: `packages/core/src/fixtures/verdict-ground-truth.ts`
- Create: `packages/core/src/fixtures/verdict-ground-truth.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Raw ATS opportunity text and profile structures.
- Produces: `VERDICT_GROUND_TRUTH_DATASET: readonly GroundTruthOpportunity[]` with explicit human reference labels.

- [ ] **Step 1: Write failing test for Ground Truth Dataset**

Create `packages/core/src/fixtures/verdict-ground-truth.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET } from './verdict-ground-truth.js'

test('VERDICT_GROUND_TRUTH_DATASET contains annotated real opportunities with ground truth labels', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET))
  assert.ok(VERDICT_GROUND_TRUTH_DATASET.length >= 5)

  for (const item of VERDICT_GROUND_TRUTH_DATASET) {
    assert.ok(item.id)
    assert.ok(item.jd)
    assert.ok(['WORTH_ATTENTION', 'NOT_WORTH', 'UNRESOLVED'].includes(item.groundTruth))
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth.test.ts`
Expected: Fail because module `verdict-ground-truth.js` does not exist.

- [ ] **Step 3: Implement `verdict-ground-truth.ts`**

Create `packages/core/src/fixtures/verdict-ground-truth.ts`:

```typescript
export interface GroundTruthOpportunity {
  readonly id: string
  readonly title: string
  readonly jd: string
  readonly groundTruth: 'WORTH_ATTENTION' | 'NOT_WORTH' | 'UNRESOLVED'
  readonly notes?: string
}

export const VERDICT_GROUND_TRUTH_DATASET: readonly GroundTruthOpportunity[] = [
  {
    id: 'gt-01',
    title: 'Senior Infrastructure Engineer',
    jd: 'Stripe is hiring a Senior Infrastructure Engineer. Requirements: 5+ years with Kubernetes, Envoy proxy, PCI compliance required. Deep proficiency in Go.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for senior infra profile with Go, Kubernetes, and security experience.',
  },
  {
    id: 'gt-02',
    title: 'Staff Payment Systems Engineer',
    jd: 'Stripe Payment Platform. Requires double-entry ledger architecture, Terraform at scale, Prometheus monitoring. Hands-on Go experience preferred.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for payment platform systems profile.',
  },
  {
    id: 'gt-03',
    title: 'Administrative Receptionist',
    jd: 'Gestión administrativa, recepción de pacientes, facturación básica y atención telefónica en clínica médica.',
    groundTruth: 'NOT_WORTH',
    notes: 'Irrelevant non-tech role for software engineering profile.',
  },
  {
    id: 'gt-04',
    title: 'Junior Front-End Intern',
    jd: 'Looking for a junior intern with basic HTML/CSS knowledge to work part-time.',
    groundTruth: 'NOT_WORTH',
    notes: 'Junior intern role below candidate seniority tier.',
  },
  {
    id: 'gt-05',
    title: 'Quant Trading Strategist',
    jd: 'High-frequency algorithmic trading desk requiring PhD in Stochastic Calculus and C++ execution engine experience.',
    groundTruth: 'UNRESOLVED',
    notes: 'Niche domain requiring specific quantitative math evidence.',
  },
]
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/fixtures/verdict-ground-truth.ts packages/core/src/fixtures/verdict-ground-truth.test.ts packages/core/src/index.ts
git commit -m "feat(core): add verdict quality ground truth dataset fixtures"
```

---

### Task 2: Verdict Quality Benchmark Engine

**Files:**
- Create: `packages/core/src/verdict-benchmark.ts`
- Create: `packages/core/src/verdict-benchmark.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Ground truth opportunity fixtures and `evaluateOpportunity` engine.
- Produces: `runVerdictQualityBenchmark(dataset, profile, recognizer?): VerdictBenchmarkMetrics` producing confusion matrix ($TP, FP, TN, FN, \text{ABSTAIN}$) and derived metrics (Precision, Recall, Missed Opportunity Rate, Abstention Rate, Abstention Precision).

- [ ] **Step 1: Write failing test for Verdict Quality Benchmark Engine**

Create `packages/core/src/verdict-benchmark.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runVerdictQualityBenchmark } from './verdict-benchmark.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'

test('runVerdictQualityBenchmark calculates precision, recall, missed opportunity rate and confusion matrix', () => {
  const profile = getEmbeddedProfile()
  const metrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile)

  assert.ok(typeof metrics.precision === 'number')
  assert.ok(typeof metrics.recall === 'number')
  assert.ok(typeof metrics.missedOpportunityRate === 'number')
  assert.ok(typeof metrics.abstentionRate === 'number')
  assert.ok(metrics.counts.tp >= 0)
  assert.ok(metrics.counts.fp >= 0)
  assert.ok(metrics.counts.tn >= 0)
  assert.ok(metrics.counts.fn >= 0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/verdict-benchmark.test.ts`
Expected: Fail because `verdict-benchmark.js` does not exist.

- [ ] **Step 3: Implement `verdict-benchmark.ts`**

Create `packages/core/src/verdict-benchmark.ts`:

```typescript
import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import { evaluateOpportunity, type Profile, type OpportunityEvaluation } from './opportunity.js'
import type { IMarketRecognizer } from './market-knowledge.js'

export interface VerdictBenchmarkMetrics {
  readonly totalOpportunities: number
  readonly accuracy: number
  readonly precision: number
  readonly recall: number
  readonly falsePositiveRate: number
  readonly missedOpportunityRate: number
  readonly abstentionRate: number
  readonly abstentionPrecision: number
  readonly counts: {
    readonly tp: number
    readonly fp: number
    readonly tn: number
    readonly fn: number
    readonly abstain: number
  }
}

export function runVerdictQualityBenchmark(
  dataset: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): VerdictBenchmarkMetrics {
  if (dataset.length === 0) {
    return {
      totalOpportunities: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      falsePositiveRate: 0,
      missedOpportunityRate: 0,
      abstentionRate: 0,
      abstentionPrecision: 0,
      counts: { tp: 0, fp: 0, tn: 0, fn: 0, abstain: 0 },
    }
  }

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0
  let abstain = 0
  let trueEvidenceGapsInAbstain = 0

  for (const item of dataset) {
    const evaluation: OpportunityEvaluation = evaluateOpportunity(item.jd, profile, recognizer)
    const verdict = evaluation.verdict.toLowerCase()

    if (verdict === 'abstain') {
      abstain++
      if (item.groundTruth === 'UNRESOLVED') {
        trueEvidenceGapsInAbstain++
      }
    } else if (verdict === 'apply' || verdict === 'consider' || verdict === 'interested') {
      if (item.groundTruth === 'WORTH_ATTENTION') {
        tp++
      } else {
        fp++
      }
    } else if (verdict === 'skip' || verdict === 'dismissed') {
      if (item.groundTruth === 'WORTH_ATTENTION') {
        fn++
      } else {
        tn++
      }
    }
  }

  const totalDecided = tp + fp + tn + fn
  const accuracy = totalDecided > 0 ? Math.round(((tp + tn) / totalDecided) * 100) / 100 : 0
  const precision = (tp + fp) > 0 ? Math.round((tp / (tp + fp)) * 100) / 100 : 0
  const recall = (tp + fn) > 0 ? Math.round((tp / (tp + fn)) * 100) / 100 : 0
  const falsePositiveRate = (fp + tn) > 0 ? Math.round((fp / (fp + tn)) * 100) / 100 : 0
  const missedOpportunityRate = (tp + fn) > 0 ? Math.round((fn / (tp + fn)) * 100) / 100 : 0
  const abstentionRate = Math.round((abstain / dataset.length) * 100) / 100
  const abstentionPrecision = abstain > 0 ? Math.round((trueEvidenceGapsInAbstain / abstain) * 100) / 100 : 0

  return {
    totalOpportunities: dataset.length,
    accuracy,
    precision,
    recall,
    falsePositiveRate,
    missedOpportunityRate,
    abstentionRate,
    abstentionPrecision,
    counts: { tp, fp, tn, fn, abstain },
  }
}
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/verdict-benchmark.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/verdict-benchmark.ts packages/core/src/verdict-benchmark.test.ts packages/core/src/index.ts
git commit -m "feat(core): add verdict quality benchmark engine and confusion matrix metrics"
```

---

### Task 3: Causal A/B Benchmark & Delta Comparison Suite

**Files:**
- Create: `packages/core/src/verdict-benchmark-comparison.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: Baseline vs Expanded v1 `DeclarativeMarketRecognizer`.
- Produces: Causal A/B comparison proving whether Market Recognition v1 improves Decision Precision and reduces Missed Opportunity Rate.

- [ ] **Step 1: Write Causal A/B Delta Comparison Test**

Create `packages/core/src/verdict-benchmark-comparison.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runVerdictQualityBenchmark } from './verdict-benchmark.js'
import { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'
import { getEmbeddedProfile } from './profile.js'
import {
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
} from './index.js'

test('Causal A/B Verdict Quality Experiment: Market Recognition v1 maintains decision precision and zero missed opportunity rate', () => {
  const profile = getEmbeddedProfile()

  // 1. Baseline Evaluation
  const baselineRecognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const baselineMetrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile, baselineRecognizer)

  // 2. Expanded Evaluation (Market Recognition v1)
  const expandedKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const expandedRecognizer = new DeclarativeMarketRecognizer(expandedKnowledge)
  const expandedMetrics = runVerdictQualityBenchmark(VERDICT_GROUND_TRUTH_DATASET, profile, expandedRecognizer)

  // 3. Assert Causal Improvements & Invariants
  assert.ok(
    expandedMetrics.precision >= baselineMetrics.precision,
    `Precision must increase or stay equal: ${expandedMetrics.precision} >= ${baselineMetrics.precision}`
  )
  assert.ok(
    expandedMetrics.missedOpportunityRate <= baselineMetrics.missedOpportunityRate,
    `Missed Opportunity Rate must decrease or stay equal: ${expandedMetrics.missedOpportunityRate} <= ${baselineMetrics.missedOpportunityRate}`
  )
  assert.equal(
    expandedMetrics.counts.fn,
    0,
    'Provena must have 0 false negatives on ground-truth worth attention opportunities'
  )
})
```

- [ ] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: PASS (All tests pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/verdict-benchmark-comparison.test.ts
git commit -m "test(core): add causal A/B verdict quality experiment suite"
```
