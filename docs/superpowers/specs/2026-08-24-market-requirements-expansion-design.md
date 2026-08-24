# Market Requirements & Pattern Recognition Expansion Design

> **Contract Invariant:** Adding market knowledge may increase recognition, but must not alter the universal decision protocol.

## 1. Executive Summary

Provena's Decision Engine relies on `extractMarketRequirements` to transform unformatted job descriptions (JDs) into structured `MarketModel` requirements. To convert 575+ raw opportunities into a small number of actionable decisions, the decision engine requires high requirement recognition, low false-positive noise, and precise qualifier preservation.

This design establishes an empirical, data-driven methodology for expanding market pattern vocabulary via modular `MarketKnowledge` packs without coupling core evaluation logic to specific domain taxonomies.

---

## 2. Core Architecture & Invariants

```text
Raw JD Prose
    │
    ▼
Composable Knowledge Packs ──► composeKnowledge(...)
    │
    ▼
extractMarketRequirements(jd)
    │
    ▼
MarketModel {
  requirements: MarketRequirement[],
  qualifiers: RequirementQualifier[],
  metrics: { recognitionCoverage, falsePositiveRate, qualifierPreservation }
}
```

### Invariants
1. **Universal Protocol Isolation**: `extractMarketRequirements` is agnostic to which `MarketKnowledge` packs are supplied. Knowledge packs are interchangeable inputs to `DeclarativeMarketRecognizer`.
2. **Deterministic Evaluation**: Pattern matching and qualifier parsing rely strictly on pure deterministic rules without external LLM calls or side effects.
3. **Immutability of Decision Engine**: Adding or modifying a `MarketKnowledge` pack increases recognition capability but never alters the fundamental decision rules (APPLY / CONSIDER / SKIP).

---

## 3. Metric Suite for Empirical Expansion

Every pattern expansion attempt on a real corpus (e.g. Stripe / Greenhouse) must be benchmarked using the 3-part metric suite:

| Metric | Target / Constraint | Formula / Verification |
| :--- | :--- | :--- |
| **Recognition Coverage** | **Increase (↑)** | Percentage of requirement prose recognized by active patterns |
| **False Positive Rate** | **Stable or Decrease (↔/↓)** | Frequency of incorrect concept matches or overly broad regex captures |
| **Qualifier Preservation** | **Increase (↑)** | Capture rate of critical qualifiers (`proficiency`, `scale`, `duration`, `constraint_type`: *required* vs *preferred*) |

### Qualifier Preservation Schema
Qualifiers enrich matched concepts with actionable decision context:
- `proficiency`: e.g. "deep proficiency", "expert-level", "hands-on experience"
- `scale`: e.g. "at scale", "production-grade", "high load"
- `duration`: e.g. "5+ years", "multiple systems"
- `constraint_type`: e.g. "required", "preferred", "nice to have"
- `context`: e.g. "in distributed environment", "for financial systems"

---

## 4. Modular Knowledge Packs

Knowledge packs are decoupled declarations of concept patterns:

```typescript
export interface MarketPatternDefinition {
  readonly id: string
  readonly concept: string
  readonly kind: 'capability' | 'constraint' | 'domain' | 'practice'
  readonly matchers: readonly (string | RegExp)[]
  readonly tags?: readonly string[]
}

export interface MarketKnowledge {
  readonly name: string
  readonly version: string
  readonly patterns: readonly MarketPatternDefinition[]
}
```

Example composability:
```typescript
const activeKnowledge = composeKnowledge(
  DEFAULT_SOFTWARE_KNOWLEDGE,
  SYSTEMS_KNOWLEDGE,
  FINTECH_KNOWLEDGE
)
const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)
```

---

## 5. Empirical Gap Extraction Workflow

Pattern expansion proceeds empirically rather than speculatively:

1. **Corpus Sampling**: Run baseline `extractMarketRequirements` against real ATS corpus (e.g. 500+ Stripe job descriptions).
2. **Gap Clustering**: Identify recurring unparsed requirement phrases and sentence fragments.
3. **Candidate Pattern Formulation**: Draft modular patterns and qualifier rules targeting identified clusters.
4. **Before/After Benchmark**: Run validation benchmark verifying:
   - Recognition Coverage ↑
   - False Positive Rate ↔/↓
   - Qualifier Preservation ↑
5. **Regression Verification**: Verify zero disruption to baseline protocol tests.

---

## 6. Testing & Acceptance Criteria

- **Contract Tests**: `extractMarketRequirements` unit tests verifying deterministic parsing and qualifier retention.
- **Composability Tests**: Verification that custom knowledge packs plug into `DeclarativeMarketRecognizer` seamlessly.
- **Empirical Benchmark**: Benchmark report comparing baseline vs expanded pattern performance on the Stripe corpus.
