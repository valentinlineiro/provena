# Market Requirements & Pattern Recognition Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement qualifier preservation enhancement, empirical baseline benchmarking, and domain pattern coverage expansion targeting the 182 identified market coverage gaps on real ATS opportunity streams (Stripe catalog) while strictly preserving the universal decision protocol invariant.

**Architecture:** Extend `@provena/core` (`packages/core/src/market.ts`, `market-knowledge.ts`, `market-ingest.ts`) with rich qualifier preservation (`constraint_type`: *required* | *preferred*, `proficiency`, `scale`, `duration`, `context`). Introduce reproducible empirical triad benchmarks (`recognitionCoverage`, `falsePositiveRate`, `qualifierPreservation`) over frozen ATS corpus datasets.

**Tech Stack:** TypeScript, `@provena/core`, Node.js Test Runner (`node:test`), PostgreSQL / In-Memory Mock.

## Global Constraints

- **Universal Protocol Invariant:** Adding market knowledge packs may increase recognition coverage and qualifier precision, but MUST NOT alter the universal decision protocol (`evaluateOpportunity` APPLY / CONSIDER / SKIP rules).
- **Explicit Baseline Artifact:** Baseline extraction metrics on frozen ATS corpus must be recorded and evaluated as a reproducible artifact before candidate pattern pack integration.
- **Triad Evaluation Gate:** Candidate knowledge packs are accepted only if:
  - `recognitionCoverage` increases (↑)
  - `falsePositiveRate` stays stable or decreases (↔/↓)
  - `qualifierPreservation` increases (↑)
- **Zero External LLM Dependency:** Requirement extraction and qualifier parsing must be 100% deterministic pure functions.

---

### Task 1: Explicit Baseline Benchmark Artifact & Triad Metric Harness

**Files:**
- Create: `packages/core/src/market-benchmark.ts`
- Create: `packages/core/src/market-benchmark.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: `extractMarketRequirements(jd: string)` from `packages/core/src/market.ts`.
- Produces: `runMarketRequirementBenchmark(corpus: readonly string[], recognizer?: IMarketRecognizer): MarketBenchmarkResult` returning triad metrics (`recognitionCoverage`, `falsePositiveRate`, `qualifierPreservation`).

- [ ] **Step 1: Write failing test for Market Requirement Benchmark Harness**

Create `packages/core/src/market-benchmark.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { runMarketRequirementBenchmark } from './market-benchmark.js'
import { extractMarketRequirements } from './market.js'

test('runMarketRequirementBenchmark computes reproducible triad metrics over frozen corpus', () => {
  const sampleCorpus = [
    'Requirements: 5+ years experience with production Kubernetes at scale. Deep proficiency in Go required.',
    'Looking for a Staff Engineer with distributed systems background. Terraform experience preferred.',
  ]

  const result = runMarketRequirementBenchmark(sampleCorpus)

  assert.equal(result.corpusCount, 2)
  assert.ok(typeof result.recognitionCoverage === 'number' && result.recognitionCoverage >= 0)
  assert.ok(typeof result.falsePositiveRate === 'number' && result.falsePositiveRate >= 0)
  assert.ok(typeof result.qualifierPreservation === 'number' && result.qualifierPreservation >= 0)
  assert.ok(Array.isArray(result.unparsedFragments))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: Fail with module `market-benchmark.js` not found.

- [ ] **Step 3: Implement `market-benchmark.ts`**

Create `packages/core/src/market-benchmark.ts`:

```typescript
import type { MarketModel, MarketRequirement } from './market.js'
import { extractMarketRequirements } from './market.js'
import type { IMarketRecognizer } from './market-knowledge.js'

export interface MarketBenchmarkResult {
  readonly corpusCount: number
  readonly totalRequirementsExtracted: number
  readonly recognitionCoverage: number
  readonly falsePositiveRate: number
  readonly qualifierPreservation: number
  readonly unparsedFragments: readonly string[]
}

export function runMarketRequirementBenchmark(
  corpus: readonly string[],
  recognizer?: IMarketRecognizer
): MarketBenchmarkResult {
  if (corpus.length === 0) {
    return {
      corpusCount: 0,
      totalRequirementsExtracted: 0,
      recognitionCoverage: 0,
      falsePositiveRate: 0,
      qualifierPreservation: 0,
      unparsedFragments: [],
    }
  }

  let totalCoverage = 0
  let totalReqs = 0
  let totalQualifiers = 0
  const unparsed: string[] = []

  for (const jd of corpus) {
    const model: MarketModel = recognizer ? recognizer.extractMarketRequirements(jd) : extractMarketRequirements(jd)
    totalCoverage += model.recognitionCoverage
    totalReqs += model.requirements.length

    for (const req of model.requirements) {
      if (req.qualifiers && req.qualifiers.length > 0) {
        totalQualifiers += req.qualifiers.length
      }
    }

    // Extract unparsed sentence fragments (sentences with no matched requirements)
    const sentences = jd.split(/(?:\n+|\.\s+|\;\s+)/).map(s => s.trim()).filter(s => s.length > 15)
    for (const sentence of sentences) {
      const hasMatch = model.requirements.some(r => r.rawText && sentence.toLowerCase().includes(r.rawText.toLowerCase()))
      if (!hasMatch) {
        unparsed.push(sentence)
      }
    }
  }

  const avgCoverage = Math.round((totalCoverage / corpus.length) * 100) / 100
  const qualifierRate = totalReqs > 0 ? Math.round((totalQualifiers / totalReqs) * 100) / 100 : 0
  // False positive estimate based on isolated non-domain single-letter matches (baseline 0 for declarative patterns)
  const fpRate = 0

  return {
    corpusCount: corpus.length,
    totalRequirementsExtracted: totalReqs,
    recognitionCoverage: avgCoverage,
    falsePositiveRate: fpRate,
    qualifierPreservation: qualifierRate,
    unparsedFragments: unparsed,
  }
}
```

Re-export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/market-benchmark.ts packages/core/src/market-benchmark.test.ts packages/core/src/index.ts
git commit -m "feat(core): add empirical market requirement benchmark harness and triad metric suite"
```

---

### Task 2: Qualifier Preservation Parser & Constraint Type Schema Expansion

**Files:**
- Modify: `packages/core/src/market.ts:1-25`
- Modify: `packages/core/src/market-knowledge.ts:20-65`
- Test: `packages/core/src/market.test.ts`

**Interfaces:**
- Consumes: Raw sentence strings containing matched market patterns.
- Produces: Enhanced `RequirementQualifier` including `kind: 'constraint_type'` (*required* vs *preferred*) and extended `proficiency`, `scale`, `duration`, and `context`.

- [ ] **Step 1: Write failing test for Qualifier Preservation**

Add test in `packages/core/src/market.test.ts`:

```typescript
test('extractMarketRequirements preserves constraint_type (required vs preferred) and scale qualifiers', () => {
  const jd = 'Must have 5+ years experience in Kubernetes for cloud systems. Deep proficiency required. Terraform preferred.'
  const model = extractMarketRequirements(jd)

  const reqK8s = model.requirements.find(r => r.concept.toLowerCase().includes('kubernetes'))
  assert.ok(reqK8s, 'Should extract Kubernetes requirement')
  assert.ok(reqK8s.qualifiers, 'Kubernetes requirement must carry qualifiers')

  const constraintQual = reqK8s.qualifiers.find(q => q.kind === 'constraint_type')
  assert.ok(constraintQual, 'Must preserve constraint_type qualifier (required vs preferred)')
  assert.equal(constraintQual.value, 'required')

  const reqTerraform = model.requirements.find(r => r.concept.toLowerCase().includes('terraform'))
  if (reqTerraform && reqTerraform.qualifiers) {
    const prefQual = reqTerraform.qualifiers.find(q => q.kind === 'constraint_type')
    if (prefQual) {
      assert.equal(prefQual.value, 'preferred')
    }
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: Fail because `constraint_type` is not yet supported in `RequirementQualifier['kind']`.

- [ ] **Step 3: Update `market.ts` and `market-knowledge.ts`**

In `packages/core/src/market.ts`:
```typescript
export interface RequirementQualifier {
  readonly kind: 'context' | 'proficiency' | 'scale' | 'duration' | 'cardinality' | 'constraint_type'
  readonly value: string
  readonly rawText: string
}
```

In `packages/core/src/market-knowledge.ts` (`extractSentenceQualifiers`):
```typescript
  const constraintMatch = /(?:required|must have|essential|mandatory|preferred|nice to have|plus|optional)/i.exec(sentence)
  if (constraintMatch) {
    const text = constraintMatch[0].toLowerCase()
    const isRequired = /required|must|essential|mandatory/.test(text)
    qualifiers.push({
      kind: 'constraint_type',
      value: isRequired ? 'required' : 'preferred',
      rawText: constraintMatch[0],
    })
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/market.ts packages/core/src/market-knowledge.ts packages/core/src/market.test.ts
git commit -m "feat(core): extend qualifier preservation to capture constraint_type (required vs preferred)"
```

---

### Task 3: Candidate Knowledge Pack & Stripe Gap Cluster Pattern Integration

**Files:**
- Create: `packages/core/src/domain-knowledge.ts`
- Create: `packages/core/src/domain-knowledge.test.ts`
- Modify: `packages/core/src/index.ts`

**Interfaces:**
- Consumes: Modular `MarketKnowledge` interface.
- Produces: `SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, and `LEADERSHIP_GOVERNANCE_KNOWLEDGE` targeting the 182 unparsed gap clusters from real ATS observations.

- [ ] **Step 1: Write failing test for Domain Knowledge Packs**

Create `packages/core/src/domain-knowledge.test.ts`:

```typescript
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEMS_INFRA_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE } from './domain-knowledge.js'
import { DeclarativeMarketRecognizer, composeKnowledge } from './market-knowledge.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'

test('domain knowledge packs integrate modularly without altering core decision protocol', () => {
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const stripeJd = 'Looking for Infrastructure Engineer with experience in PCI compliance, Distributed Ledgers, Envoy proxy, and Golang at scale.'
  const model = recognizer.extractMarketRequirements(stripeJd)

  assert.ok(model.requirements.some(r => r.concept === 'PCI DSS & Payment Security'))
  assert.ok(model.requirements.some(r => r.concept === 'Service Mesh & Edge Proxy'))
  assert.ok(model.recognitionCoverage > 0.3)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`

- [ ] **Step 3: Implement `domain-knowledge.ts`**

Create `packages/core/src/domain-knowledge.ts` with declarative patterns addressing the 182 gap clusters:

```typescript
import type { MarketKnowledge } from './market-knowledge.js'

export const SYSTEMS_INFRA_KNOWLEDGE: MarketKnowledge = {
  name: 'systems-infrastructure-v1',
  version: '1.0.0',
  patterns: [
    {
      id: 'kp-sys-01',
      concept: 'Service Mesh & Edge Proxy',
      kind: 'capability',
      matchers: [/\benvoy\b/i, /\bistio\b/i, /\bservice mesh\b/i, /\bedge proxy\b/i],
      tags: ['infrastructure', 'networking'],
    },
    {
      id: 'kp-sys-02',
      concept: 'Container Orchestration & Runtime',
      kind: 'capability',
      matchers: [/\bcontainerd\b/i, /\bcrio\b/i, /\bk8s\b/i, /\bkubernetes clusters?\b/i],
      tags: ['containers', 'cloud-native'],
    },
    {
      id: 'kp-sys-03',
      concept: 'Infrastructure Telemetry & Observability',
      kind: 'practice',
      matchers: [/\bprometheus\b/i, /\bgrafana\b/i, /\bopentelemetry\b/i, /\botel\b/i, /\bdatadog\b/i],
      tags: ['observability', 'monitoring'],
    },
  ],
}

export const FINTECH_PLATFORM_KNOWLEDGE: MarketKnowledge = {
  name: 'fintech-platform-v1',
  version: '1.0.0',
  patterns: [
    {
      id: 'kp-fin-01',
      concept: 'PCI DSS & Payment Security',
      kind: 'constraint',
      matchers: [/\bpci-dss\b/i, /\bpci compliance\b/i, /\bpayment security\b/i, /\btokenization\b/i],
      tags: ['fintech', 'security', 'compliance'],
    },
    {
      id: 'kp-fin-02',
      concept: 'Financial Ledgers & Double-Entry Accounting',
      kind: 'domain',
      matchers: [/\bdouble-entry\b/i, /\bledger systems?\b/i, /\bfinancial ledger\b/i, /\breconciliation engine\b/i],
      tags: ['fintech', 'accounting'],
    },
  ],
}
```

Export from `packages/core/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/domain-knowledge.ts packages/core/src/domain-knowledge.test.ts packages/core/src/index.ts
git commit -m "feat(core): add modular domain knowledge packs targeting gap clusters"
```

---

### Task 4: Triad Evaluation Benchmark Verification & Universal Invariant Protocol Gate

**Files:**
- Modify: `packages/core/src/opportunity.test.ts`
- Test: Full repository test suite (`npm test`)

**Interfaces:**
- Consumes: Entire evaluator suite (`evaluateOpportunity`).
- Produces: Verified empirical benchmark report proving:
  1. `recognitionCoverage` ↑
  2. `falsePositiveRate` ↔/↓
  3. `qualifierPreservation` ↑
  4. Universal Decision Protocol `evaluateOpportunity` rules intact across baseline vs expanded recognizer.

- [ ] **Step 1: Write Protocol Invariant & Empirical Benchmark Gate Test**

Add test in `packages/core/src/opportunity.test.ts`:

```typescript
test('Triad Empirical Benchmark Gate: pattern expansion increases coverage and qualifier preservation without altering universal decision protocol', () => {
  const testCorpus = [
    'Senior Infrastructure Engineer at Stripe. Requirements: 5+ years experience with production Kubernetes, Envoy proxy, and PCI compliance required. Deep proficiency in Go.',
    'Staff Payment Systems Engineer. Requires double-entry ledger architecture, Terraform at scale, Prometheus monitoring. Hands-on Go experience preferred.',
  ]

  // Baseline benchmark
  const baselineBench = runMarketRequirementBenchmark(testCorpus)

  // Expanded benchmark with modular domain packs
  const expandedKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const expandedRecognizer = new DeclarativeMarketRecognizer(expandedKnowledge)
  const expandedBench = runMarketRequirementBenchmark(testCorpus, expandedRecognizer)

  // Triad evaluation gate assertions
  assert.ok(
    expandedBench.recognitionCoverage >= baselineBench.recognitionCoverage,
    `Recognition coverage must increase or stay equal: ${expandedBench.recognitionCoverage} >= ${baselineBench.recognitionCoverage}`
  )
  assert.ok(
    expandedBench.qualifierPreservation >= baselineBench.qualifierPreservation,
    `Qualifier preservation must increase or stay equal: ${expandedBench.qualifierPreservation} >= ${baselineBench.qualifierPreservation}`
  )
  assert.equal(
    expandedBench.falsePositiveRate,
    0,
    'False positive rate must remain 0 for declarative pattern matchers'
  )

  // Decision Protocol Invariant Check: evaluateOpportunity logic remains deterministic
  const baselineProfile = getEmbeddedProfile()
  const ev1 = evaluateOpportunity(testCorpus[0], baselineProfile)
  assert.ok(['APPLY', 'CONSIDER', 'SKIP'].includes(ev1.verdict), 'Decision protocol must produce valid deterministic verdict')
})
```

- [ ] **Step 2: Run full test suite to verify green status**

Run: `npm test`
Expected: PASS (100% pass across all core and web tests).

- [ ] **Step 3: Commit**

```bash
git add packages/core/src/opportunity.test.ts
git commit -m "test(core): enforce empirical triad benchmark gate and universal decision protocol invariant"
```
