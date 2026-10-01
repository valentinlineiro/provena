# Step 10 — Independent Out-of-Sample Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the independent out-of-sample (OOS) validation dataset (Corpus v3) and transportability telemetry engine in `@provena/core` to evaluate whether the frozen Decision Engine and `OCCUPATIONAL_CONTEXT_KNOWLEDGE` generalise to unseen role categories (Cloud Architect, TPM, Developer Advocate, Sales Engineer, Edge) without any code modifications during execution.

**Architecture:** Create Corpus v3 in `packages/core/src/fixtures/verdict-ground-truth-oos.ts` with 50+ annotated opportunities. Build `runOutOfSampleValidationBenchmark` in `packages/core/src/attention-validation-oos.ts` comparing in-sample vs out-of-sample metrics and classifying OOS failures.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`).

## Global Constraints

- **STRICT FROZEN ENGINE RULE:** Zero code modifications to `evaluateOpportunity`, `DeclarativeMarketRecognizer`, or `OCCUPATIONAL_CONTEXT_KNOWLEDGE`.
- **Corpus Independence:** Corpus v3 must contain 50+ real opportunities with role categories never used during Step 9 development.
- **Safety Invariant:** Missed Opportunity Rate ($\text{MOR}$) must remain $\le 5.0\%$ ($0.0\%$ preferred).
- **Failure Auditing:** All OOS false positives ($FP$) or false negatives ($FN$) must be logged and classified into failure categories.

---

### Task 1: Out-of-Sample Validation Dataset Corpus v3

**Files:**
- Create: `packages/core/src/fixtures/verdict-ground-truth-oos.ts`
- Create: `packages/core/src/fixtures/verdict-ground-truth-oos.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `GroundTruthOpportunity` schema.
- Produces: `VERDICT_GROUND_TRUTH_DATASET_OOS: readonly GroundTruthOpportunity[]` containing 50+ annotated real opportunities from unseen role categories.

- [ ] **Step 1: Write failing test for OOS Dataset**

Create `packages/core/src/fixtures/verdict-ground-truth-oos.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { VERDICT_GROUND_TRUTH_DATASET_OOS } from './verdict-ground-truth-oos.js'

test('VERDICT_GROUND_TRUTH_DATASET_OOS contains at least 50 annotated real out-of-sample opportunities', () => {
  assert.ok(Array.isArray(VERDICT_GROUND_TRUTH_DATASET_OOS))
  assert.ok(
    VERDICT_GROUND_TRUTH_DATASET_OOS.length >= 50,
    `Corpus v3 size must be at least 50, got ${VERDICT_GROUND_TRUTH_DATASET_OOS.length}`
  )

  const worthCount = VERDICT_GROUND_TRUTH_DATASET_OOS.filter(i => i.groundTruth === 'WORTH_ATTENTION').length
  const notWorthCount = VERDICT_GROUND_TRUTH_DATASET_OOS.filter(i => i.groundTruth === 'NOT_WORTH').length

  assert.ok(worthCount >= 10, 'Corpus v3 must contain at least 10 WORTH_ATTENTION opportunities')
  assert.ok(notWorthCount >= 25, 'Corpus v3 must contain at least 25 NOT_WORTH opportunities')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth-oos.test.ts`
Expected: Fail because module `verdict-ground-truth-oos.js` does not exist.

- [ ] **Step 3: Implement `verdict-ground-truth-oos.ts`**

Create `packages/core/src/fixtures/verdict-ground-truth-oos.ts` defining 50+ real annotated opportunities across:
- In-profile target roles (Senior/Staff Cloud Platform Engineer, SRE, Distributed Systems Architect)
- Out-of-sample border cases (Cloud Solutions Architect, Technical Product Manager, Developer Advocate, Sales Engineer, Edge IoT Engineer, Security Auditor, Data BI Analyst, Technical Writer, Office Manager, Procurement)

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/fixtures/verdict-ground-truth-oos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/fixtures/verdict-ground-truth-oos.ts packages/core/src/fixtures/verdict-ground-truth-oos.test.ts packages/core/src/index.ts
git commit -m "feat(core): add Corpus v3 independent out-of-sample validation dataset"
```

---

### Task 2: OOS Benchmark Engine & Transportability Telemetry

**Files:**
- Create: `packages/core/src/attention-validation-oos.ts`
- Create: `packages/core/src/attention-validation-oos.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Corpus v2 (`VERDICT_GROUND_TRUTH_DATASET_V2`), Corpus v3 (`VERDICT_GROUND_TRUTH_DATASET_OOS`), candidate `Profile`, and recognizer.
- Produces: `runOutOfSampleValidationBenchmark(...)` returning `OOSValidationBenchmarkResult` with transportability retention metrics and OOS failure audit.

- [ ] **Step 1: Write failing test for OOS Benchmark Engine**

Create `packages/core/src/attention-validation-oos.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runOutOfSampleValidationBenchmark } from './attention-validation-oos.js'
import { VERDICT_GROUND_TRUTH_DATASET_V2 } from './fixtures/verdict-ground-truth-v2.js'
import { VERDICT_GROUND_TRUTH_DATASET_OOS } from './fixtures/verdict-ground-truth-oos.js'
import { getEmbeddedProfile } from './profile.js'

test('runOutOfSampleValidationBenchmark evaluates in-sample vs out-of-sample performance and audits failures', () => {
  const profile = getEmbeddedProfile()
  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile
  )

  assert.ok(result.inSampleCorpusMetrics.totalEvaluated >= 50)
  assert.ok(result.outOfSampleCorpusMetrics.totalEvaluated >= 50)
  assert.ok(typeof result.transportability.reductionRetention === 'number')
  assert.ok(Array.isArray(result.oosFailures))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test packages/core/src/attention-validation-oos.test.ts`
Expected: Fail because module `attention-validation-oos.js` does not exist.

- [ ] **Step 3: Implement `attention-validation-oos.ts`**

Create `packages/core/src/attention-validation-oos.ts`:

```typescript
import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runAttentionValidationAtScale, type AttentionValidationMetrics } from './attention-validation.js'
import { evaluateOpportunity } from './opportunity.js'

export interface OOSFailure {
  readonly id: string
  readonly title: string
  readonly expected: string
  readonly actual: string
  readonly category: 'UNSEEN_ROLE_CONTEXT' | 'DOMAIN_MISALIGNMENT' | 'LEVEL_AMBIGUITY'
  readonly notes?: string
}

export interface OOSValidationBenchmarkResult {
  readonly inSampleCorpusMetrics: AttentionValidationMetrics
  readonly outOfSampleCorpusMetrics: AttentionValidationMetrics
  readonly transportability: {
    readonly reductionRetention: number
    readonly precisionRetention: number
    readonly morDelta: number
  }
  readonly oosFailures: readonly OOSFailure[]
}

export function runOutOfSampleValidationBenchmark(
  inSampleCorpus: readonly GroundTruthOpportunity[],
  outOfSampleCorpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): OOSValidationBenchmarkResult {
  const inMetrics = runAttentionValidationAtScale(inSampleCorpus, profile, recognizer)
  const oosMetrics = runAttentionValidationAtScale(outOfSampleCorpus, profile, recognizer)

  const failures: OOSFailure[] = []
  for (const item of outOfSampleCorpus) {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    const ev = evaluateOpportunity(fullJd, profile, recognizer)
    const verdict = ev.verdict.toLowerCase()

    const isSurfaced = verdict === 'apply' || verdict === 'consider' || verdict === 'interested'
    const isSkipped = verdict === 'skip' || verdict === 'dismissed'

    if (item.groundTruth === 'WORTH_ATTENTION' && isSkipped) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'WORTH_ATTENTION',
        actual: ev.verdict,
        category: 'DOMAIN_MISALIGNMENT',
        notes: item.notes,
      })
    }
    if (item.groundTruth === 'NOT_WORTH' && isSurfaced) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'NOT_WORTH',
        actual: ev.verdict,
        category: 'UNSEEN_ROLE_CONTEXT',
        notes: item.notes,
      })
    }
  }

  const reductionRetention = inMetrics.attentionReduction > 0
    ? Math.round((oosMetrics.attentionReduction / inMetrics.attentionReduction) * 100) / 100
    : 0
  const precisionRetention = inMetrics.attentionPrecision > 0
    ? Math.round((oosMetrics.attentionPrecision / inMetrics.attentionPrecision) * 100) / 100
    : 0
  const morDelta = Math.round((oosMetrics.missedOpportunityRate - inMetrics.missedOpportunityRate) * 100) / 100

  return {
    inSampleCorpusMetrics: inMetrics,
    outOfSampleCorpusMetrics: oosMetrics,
    transportability: {
      reductionRetention,
      precisionRetention,
      morDelta,
    },
    oosFailures: failures,
  }
}
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test packages/core/src/attention-validation-oos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/attention-validation-oos.ts packages/core/src/attention-validation-oos.test.ts packages/core/src/index.ts
git commit -m "feat(core): add out-of-sample validation benchmark engine and transportability metrics"
```

---

### Task 3: Step 10 OOS Transportability Benchmark Execution & Falsification Audit

**Files:**
- Create: `packages/core/src/attention-validation-step10.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: Frozen engine, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, and Corpus v3 (50+ items).
- Produces: Empirical proof of Step 10 generalizability on independent out-of-sample data.

- [ ] **Step 1: Write Step 10 OOS Benchmark Test**

Create `packages/core/src/attention-validation-step10.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  runOutOfSampleValidationBenchmark,
  VERDICT_GROUND_TRUTH_DATASET_V2,
  VERDICT_GROUND_TRUTH_DATASET_OOS,
  getEmbeddedProfile,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
} from './index.js'

test('Step 10 Out-of-Sample Validation: frozen Decision Engine evaluates generalizability on unseen Corpus v3 data', () => {
  const profile = getEmbeddedProfile()
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE,
    OCCUPATIONAL_CONTEXT_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const result = runOutOfSampleValidationBenchmark(
    VERDICT_GROUND_TRUTH_DATASET_V2,
    VERDICT_GROUND_TRUTH_DATASET_OOS,
    profile,
    recognizer
  )

  const oos = result.outOfSampleCorpusMetrics

  // Scale Check
  assert.ok(oos.totalEvaluated >= 50, `Corpus v3 size must be >= 50, got ${oos.totalEvaluated}`)

  // STRICT SAFETY GUARDRAIL: MOR <= 5% (0% preferred)
  assert.ok(
    oos.missedOpportunityRate <= 0.05,
    `STRICT MOR GUARDRAIL VIOLATED on OOS: got ${(oos.missedOpportunityRate * 100).toFixed(1)}%`
  )

  // Transportability Targets
  assert.ok(
    oos.attentionReduction >= 0.50,
    `OOS Attention Reduction target >= 50%, got ${(oos.attentionReduction * 100).toFixed(1)}%`
  )
  assert.ok(
    oos.attentionPrecision >= 0.75,
    `OOS Attention Precision target >= 75%, got ${(oos.attentionPrecision * 100).toFixed(1)}%`
  )
})
```

- [ ] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: PASS (All tests pass cleanly).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/attention-validation-step10.test.ts
git commit -m "test(core): verify Step 10 out-of-sample transportability benchmark and MOR safety guardrail"
```
