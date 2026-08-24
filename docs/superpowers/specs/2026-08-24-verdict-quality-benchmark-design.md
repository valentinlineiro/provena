# Verdict Quality Empirical Benchmark & Ground Truth Experiment Design

> **Invariant & Goal:** Determine whether the +44 pp increase in Market Recognition v1 causally translates into higher Verdict Precision, lower Missed Opportunity Rate, and reduced unnecessary Abstention without modifying the underlying profile or universal decision protocol.

---

## 1. Executive Summary

Having validated **Market Recognition v1** (increasing requirement recognition from 55% to 99% with 0% false positives), the next bottleneck is **Verdict Quality**.

This experiment establishes an empirical ground-truth benchmark to measure whether richer market requirement models produce demonstrably better decision verdicts (`APPLY` / `CONSIDER` / `SKIP` / `ABSTAIN`).

---

## 2. Confusion Matrix & Metric Definitions

### Evaluation Matrix

| | Ground Truth: Worth Attention (Pos) | Ground Truth: Not Worth (Neg) |
| :--- | :---: | :---: |
| **APPLY / CONSIDER** | True Positive ($TP$) | False Positive ($FP$) |
| **SKIP** | False Negative ($FN$) | True Negative ($TN$) |
| **ABSTAIN** | Unresolved Positive | Unresolved Negative |

### Derived Metrics

1. **Decision Accuracy**: $\frac{TP + TN}{TP + TN + FP + FN}$ (Over decided opportunities)
2. **Precision**: $\frac{TP}{TP + FP}$
3. **Recall**: $\frac{TP}{TP + FN}$
4. **False Positive Rate (FPR)**: $\frac{FP}{FP + TN}$
5. **Missed Opportunity Rate (MOR)** *(Primary Risk Metric)*: $\frac{FN}{TP + FN}$
   - *Core Guarantee*: Provena must not interrupt candidates with noise, but must NEVER miss high-fit opportunities.
6. **Abstention Rate**: $\frac{ABSTAIN}{\text{Total Opportunities}}$
7. **Abstention Precision**: $\frac{\text{True Evidence Gaps in ABSTAIN}}{ABSTAIN}$
   - Distinguishes valid abstentions (missing profile capabilities/evidence) from invalid abstentions caused by unparsed market prose.

---

## 3. Causal A/B Experiment Setup

```text
                       Frozen Opportunity Corpus
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
          Baseline Recognizer           Expanded Recognizer v1
        (DEFAULT_KNOWLEDGE)              (DEFAULT + SYSTEMS + FINTECH)
                    │                             │
                    ▼                             ▼
          MarketModel (Baseline)         MarketModel (Expanded v1)
                    │                             │
                    ▼                             ▼
          evaluateOpportunity(...)        evaluateOpportunity(...)
                    │                             │
                    ▼                             ▼
            Verdict Baseline              Verdict Expanded v1
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                         Ground Truth Evaluator
                                   │
                                   ▼
                         Causal Delta Report
```

### Success Signal Targets
- **Decision Precision ($\uparrow$)**: Increased accuracy in surfacing relevant opportunities.
- **Missed Opportunity Rate ($\downarrow$)**: Reduced rate of false skips on valid opportunities.
- **Unnecessary Abstention ($\downarrow$)**: Fewer abstentions caused by missing market pattern vocabulary.

---

## 4. Architecture & Interface Design

### New Benchmark Service: `packages/core/src/verdict-benchmark.ts`

```typescript
export interface GroundTruthOpportunity {
  readonly id: string
  readonly jd: string
  readonly groundTruth: 'WORTH_ATTENTION' | 'NOT_WORTH' | 'UNRESOLVED'
}

export interface VerdictBenchmarkMetrics {
  readonly accuracy: number
  readonly precision: number
  readonly recall: number
  readonly falsePositiveRate: number
  readonly missedOpportunityRate: number
  readonly abstentionRate: number
  readonly abstentionPrecision: number
  readonly counts: {
    tp: number
    fp: number
    tn: number
    fn: number
    abstain: number
  }
}

export interface VerdictCausalDelta {
  readonly baseline: VerdictBenchmarkMetrics
  readonly expanded: VerdictBenchmarkMetrics
  readonly delta: {
    precision: number
    missedOpportunityRate: number
    abstentionRate: number
    accuracy: number
  }
}
```

---

## 5. Experiment Execution Plan

1. **Ground Truth Fixtures**: Create `packages/core/src/fixtures/verdict-ground-truth.ts` containing 20+ annotated real opportunities with human ground-truth labels.
2. **Benchmark Engine**: Implement `runVerdictQualityBenchmark` and `compareVerdictQuality`.
3. **Causal Report Script**: Run baseline vs expanded v1 comparison to verify causal impact of market knowledge on decision quality.
