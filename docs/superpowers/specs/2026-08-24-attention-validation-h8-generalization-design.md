# H8 — Attention Reduction Generalization & Stress Benchmark Design

> **Hypothesis H8:** The frozen Decision Engine maintains substantial Attention Reduction ($>60\%$), high Attention Precision ($>80\%$), and low Missed Opportunity Rate ($\text{MOR} \approx 0\%$) when subjected to Corpus v2 containing high border-case pressure and market noise, without modifying any underlying engine logic or decision policies.

---

## 1. Executive Summary

Step 7 established **Attention Validation v1** on a 32-opportunity corpus ($66\%$ Attention Reduction, $100\%$ Attention Precision, $0\%$ MOR). 

**Step 8** shifts from baseline measurement to **falsification testing**. With all engine components frozen, Corpus v2 introduces 50+ diverse, real-world opportunities featuring deliberate border cases, ambiguous seniorities, hybrid roles, stack equivalences, and subtle requirement dealbreakers designed to challenge the decision engine.

---

## 2. Frozen Engine Architecture

```text
                  FROZEN ENGINE & CONTRACTS
─────────────────────────────────────────────────────────────
• UI Presentation Contract           • Telemetry Metrics
• Market Recognition v1 Patterns     • Universal Decision Protocol
• Decision Policy (APPLY/SKIP/etc)   • Qualifier Schema
─────────────────────────────────────────────────────────────
                             │
                             ▼
              Corpus v2 (50+ Opportunity Stream)
            ├── 1. Near-Profile Matches
            ├── 2. Partially Compatible Stack Roles
            ├── 3. Ambiguous Seniority Cues
            ├── 4. Hybrid / Multi-Domain JDs
            └── 5. Subtle Constraint Dealbreakers
                             │
                             ▼
                 H8 Stress Benchmark Engine
                             │
                             ▼
             Falsification & Generalization Report
```

---

## 3. Corpus v2 Dataset Composition (50+ Items)

| Category | Description | Primary Stress Test |
| :--- | :--- | :--- |
| **Near-Profile Matches** | Staff/Principal Systems Engineer, Kernel Engineer | Distinguishes deep infra capabilities |
| **Partially Compatible** | SRE Lead, Platform Ops Manager, Tech Lead Manager | Tests trade-off between IC engineering vs management |
| **Ambiguous Seniority** | "Senior/Lead/Staff" multi-level postings | Tests role-level requirement parsing |
| **Hybrid Roles** | Solutions Architect + Hands-on Coding | Evaluates capability sufficiency thresholds |
| **Equivalent Tech Stacks** | Java/C++ High Frequency Trading vs Go/Rust Distributed Systems | Tests signal-matching vs rigid keyword matching |
| **Subtle Dealbreakers** | Mandatory 5-day on-site relocation, clearance required | Tests constraint-type enforcement (`required` vs `preferred`) |
| **Irrelevant / Noise** | Administrative, Sales, Marketing, Legal, Facilities | Tests noise silencing consistency |

---

## 4. Benchmark Service: `packages/core/src/attention-validation-v2.ts`

```typescript
export interface GeneralizationBenchmarkResult {
  readonly v1CorpusMetrics: AttentionValidationMetrics
  readonly v2CorpusMetrics: AttentionValidationMetrics
  readonly delta: {
    readonly attentionReductionDelta: number
    readonly precisionDelta: number
    readonly missedOpportunityRateDelta: number
  }
  readonly borderCaseFailures: readonly {
    readonly id: string
    readonly title: string
    readonly category: string
    readonly expected: string
    readonly actual: string
  }[]
}
```

---

## 5. Acceptance & Falsification Criteria

- **Hypothesis Supported**: If Corpus v2 achieves:
  - $\text{Attention Reduction} \ge 60\%$
  - $\text{Attention Precision} \ge 80\%$
  - $\text{Missed Opportunity Rate (MOR)} \le 5\%$ (0 false skips preferred)
- **Falsification Trigger**: If $\text{MOR} > 10\%$ or $\text{Attention Precision} < 65\%$, identify exact border case failure categories to guide future policy development.
