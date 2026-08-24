# Attention Validation at Scale & Product Telemetry Design

> **Core Product Guarantee:** Provena silences continuous market noise (high Attention Reduction) without hiding relevant career opportunities (Missed Opportunity Rate $\approx 0\%$).

---

## 1. Executive Summary

Having established the **Engineering Contracts** for both the Attention Inbox UI and the Decision Engine, the final phase shifts from architectural instrumentation to **Attention Validation at Scale**.

This experiment evaluates Provena's core value proposition (*"Helping to look less"*) by measuring human attention reduction, attention precision, and missed opportunity rate over a large-scale real ATS opportunity corpus (Stripe / Greenhouse feeds).

---

## 2. Telemetry Metric Definitions

```text
Continuous Market Stream (500+ JDs)
                 │
                 ▼
        Provena Decision Engine
                 │
        ┌────────┴────────┐
        ▼                 ▼
   Silenced Noise    Surfaced Inbox
(SKIP / UNRESOLVED) (APPLY / CONSIDER)
```

| Metric | Target | Formula / Description |
| :--- | :---: | :--- |
| **Attention Reduction** | **High ($>75\%$)** | $\frac{\text{Total} - (\text{APPLY} + \text{CONSIDER})}{\text{Total}}$ — Percentage of market noise silenced |
| **Attention Precision** | **High ($>80\%$)** | $\frac{TP}{\text{APPLY} + \text{CONSIDER}}$ — Percentage of surfaced items that are genuinely `WORTH_ATTENTION` |
| **Missed Opportunity Rate (MOR)** | **$\approx 0\%$** | $\frac{FN}{TP + FN}$ — Critical invariant: zero false skips on high-fit opportunities |
| **Abstention Precision** | **High ($>85\%$)** | $\frac{\text{True Evidence Gaps in ABSTAIN}}{\text{ABSTAIN}}$ — Ratio of valid abstentions due to profile gaps |

---

## 3. Scaled Ground-Truth Dataset Architecture

Expand `VERDICT_GROUND_TRUTH_DATASET` in `packages/core/src/fixtures/verdict-ground-truth.ts` to include 50+ annotated real opportunities spanning diverse ATS role families:
- **Engineering & Infra**: Staff/Senior Backend, Distributed Systems, Cloud Infra, Security, Data Platform.
- **Adjacent Roles**: Frontend, Mobile, QA/Testing, Engineering Management.
- **Irrelevant Roles**: Operations, Facilities, Legal, Sales, Admin, HR, Internships.

Each entry carries a deterministic human reference label:
- `WORTH_ATTENTION`: High candidate fit (Senior/Staff Infra, Backend, Distributed Systems).
- `NOT_WORTH`: Irrelevant domain, misaligned level, or non-matching role family.
- `UNRESOLVED`: Requires candidate profile evidence expansion or niche qualification check.

---

## 4. Telemetry Report Service

Implement `packages/core/src/attention-validation.ts`:

```typescript
export interface AttentionValidationMetrics {
  readonly totalEvaluated: number
  readonly silencedCount: number
  readonly surfacedCount: number
  readonly attentionReduction: number
  readonly attentionPrecision: number
  readonly missedOpportunityRate: number
  readonly abstentionPrecision: number
  readonly matrix: {
    readonly tp: number
    readonly fp: number
    readonly tn: number
    readonly fn: number
    readonly abstain: number
  }
}

export function runAttentionValidationAtScale(
  corpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): AttentionValidationMetrics
```

---

## 5. Experiment Execution Strategy

1. **Dataset Scaling**: Expand ground-truth dataset in `packages/core/src/fixtures/verdict-ground-truth.ts`.
2. **Attention Telemetry Service**: Implement `runAttentionValidationAtScale` in `packages/core/src/attention-validation.ts`.
3. **Scaled Empirical Benchmark**: Run empirical validation test verifying that Provena achieves $>75\%$ Attention Reduction while preserving $\text{MOR} = 0\%$.
