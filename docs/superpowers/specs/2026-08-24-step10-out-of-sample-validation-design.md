# Step 10 — Independent Out-of-Sample Falsification & Validation Design

> **Strict Experimental Rule:** The Decision Engine, `OCCUPATIONAL_CONTEXT_KNOWLEDGE` pack, and evaluation policies remain **100% FROZEN**. Zero code modifications are permitted during OOS evaluation.

---

## 1. Executive Summary

Step 9 successfully eliminated 23 adversarial false positives on Corpus v2 ($60\%$ Attention Reduction, $100\%$ Precision, $0\%$ MOR).

**Step 10** tests **out-of-sample generalizability** by evaluating the frozen decision engine against an independent validation dataset (**Corpus v3 / OOS**) featuring roles and job titles never seen during Step 9 development.

---

## 2. Experimental Setup

```text
                           DEVELOPMENT (Step 9)
                  Corpus v2 (55 Border-Case Items)
                                   │
                                   ▼
                   OCCUPATIONAL_CONTEXT_KNOWLEDGE
                                   │
                                   ▼
                         ENGINE STRICTLY FROZEN
─────────────────────────────────────────────────────────────────
                            VALIDATION (Step 10)
                 Corpus v3 / Out-of-Sample (50+ Items)
            ├── Cloud Architect vs Solutions Consulting
            ├── Technical Product Manager (TPM)
            ├── Developer Advocate / Developer Relations
            ├── Sales Engineer / Solutions Engineer
            ├── Edge Computing & IoT Specialist
            ├── Security Auditor vs DevSecOps
            └── Data Platform vs BI Analyst
                                   │
                                   ▼
               runOutOfSampleValidationBenchmark(...)
                                   │
                                   ▼
              Transportability & Generalization Report
```

---

## 3. Independent Out-of-Sample Dataset Composition (Corpus v3)

The dataset in `packages/core/src/fixtures/verdict-ground-truth-oos.ts` contains 50+ annotated real opportunities with explicit ground truth labels (`WORTH_ATTENTION`, `NOT_WORTH`, `UNRESOLVED`):

- **In-Profile Target Roles (`WORTH_ATTENTION`)**: Senior Cloud Platform Engineer, Staff SRE, Principal Distributed Systems Architect, Security Infrastructure Engineer, Data Platform Architect.
- **Out-of-Profile Border Cases (`NOT_WORTH`)**: Technical Product Manager, Developer Advocate, Sales Engineer, Technical Writer, IT Procurement Specialist, Customer Success Manager, Office Manager, Business Intelligence Analyst.
- **Ambiguous / Border Roles (`UNRESOLVED`)**: Edge Computing IoT Architect, Solution Consulting Director.

---

## 4. Benchmark Telemetry Engine: `packages/core/src/attention-validation-oos.ts`

```typescript
export interface OOSValidationBenchmarkResult {
  readonly inSampleCorpusMetrics: AttentionValidationMetrics
  readonly outOfSampleCorpusMetrics: AttentionValidationMetrics
  readonly transportability: {
    readonly reductionRetention: number // v3 Reduction / v2 Reduction
    readonly precisionRetention: number // v3 Precision / v2 Precision
    readonly morDelta: number
  }
  readonly oosFailures: readonly {
    readonly id: string
    readonly title: string
    readonly expected: string
    readonly actual: string
    readonly failureCategory: 'UNSEEN_ROLE_CONTEXT' | 'DOMAIN_MISALIGNMENT' | 'LEVEL_AMBIGUITY'
    readonly notes?: string
  }[]
}
```

---

## 5. Success & Transportability Criteria

- **Safety Guardrail Invariant**: $\text{MOR} \le 5.0\%$ (striving for $0.0\%$, $FN = 0$).
- **Transportability Targets**:
  - $\text{Attention Precision} \ge 80.0\%$
  - $\text{Attention Reduction} \ge 50.0\%$
- **Out-of-Sample Audit**: Log and classify all OOS failures without mutating engine code during Step 10 execution.
