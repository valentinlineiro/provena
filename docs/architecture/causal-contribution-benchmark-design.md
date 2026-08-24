# Causal-Contribution Knowledge Promotion Benchmark — Design

**Status:** Design only. Not implemented, not validated, not wired to any code.
**Decision this implements:** [`ADR-003`](adr/ADR-003-knowledge-promotion-mechanism.md) → REDESIGN
**Card:** CARD-008
**Supersedes (once implemented and validated):** the isolated-pack methodology used in CARD-002/CARD-004, whose blindness was diagnosed in CARD-007.

---

## Why the old design failed, restated as a design constraint

CARD-007 found the pack's causal signal survives as far as `evaluateOpportunity`'s per-item `verdict` field (`coverage`-driven `apply` vs. `consider`), but is discarded at the aggregation step: `runVerdictQualityBenchmark` treats `apply` and `consider` as the same "surfaced" outcome, and `skip` is produced only by `checkCompensation`/`checkWorkMode`/`checkRoles`/`checkAvoid` — none of which read the knowledge pack.

**This means one thing is true regardless of how the benchmark harness is redesigned, unless `evaluateOpportunity` itself changes:** the three old §3 metrics (`missedOpportunityRate`, `attentionReduction`, `attentionPrecision` — all computed from the surfaced/silenced split) will **remain structurally insensitive to any knowledge pack**. This card is explicitly forbidden from changing `evaluateOpportunity`, so this design does not try to make those three metrics pack-sensitive. Instead it treats them as a **non-regression guardrail** (still computed, still must not get worse) and builds the actual causal-contribution signal from the two things CARD-007 showed *do* respond to the pack: `coverage` and per-item `verdict` (specifically the `apply`↔`consider` axis).

## Procedure

Two comparison shapes, matching the two situations this mechanism needs to serve:

```text
Evaluating a NEW candidate pack X (not yet promoted):

   Baseline B (currently promoted v1 set)     B + X
              │                                 │
              └──────────────┬──────────────────┘
                             ▼
                        Δ(B, B+X)

Re-auditing an ALREADY-PROMOTED pack X (already inside B):

   B (includes X)          B − X (X removed)
              │                 │
              └────────┬────────┘
                       ▼
                  Δ(B−X, B)
```

Both shapes run the same underlying comparison: two composite recognizers, one with `X` and one without, evaluated over the same OOS corpus (`VERDICT_GROUND_TRUTH_DATASET_OOS`, Corpus v3 — reused, not replaced), producing one `Δ` record.

`B` (baseline composite) is defined as **the currently promoted `Operational Knowledge Version`'s pack set** — today, `{DEFAULT_SOFTWARE_KNOWLEDGE}` — not production's `packages/provena-web/src/index.ts` wiring, which CARD-003 already documented as diverged from the governed set. Anchoring `B` to the governed set (not to whatever production happens to run) keeps this mechanism self-consistent with the promotion contract instead of inheriting production's drift.

## What each run computes

For each of the two composites (`B` and `B±X`), run `runOutOfSampleValidationBenchmark`-equivalent evaluation but capture **per-item** results, not just the aggregate:

```ts
interface PerItemResult {
  readonly itemId: string
  readonly groundTruth: 'WORTH_ATTENTION' | 'NOT_WORTH' | 'UNRESOLVED'
  readonly coverage: number
  readonly verdict: 'apply' | 'consider' | 'skip' | 'dismissed' | 'abstain'
}
```

## The causal-contribution metrics (new)

Computed by diffing the two composites' `PerItemResult[]` arrays item-by-item:

| Metric | Definition | What it captures |
|---|---|---|
| `coverageDelta` | mean over items of `\|coverage_with_X − coverage_without_X\|` where either run had `recognized > 0` | Magnitude of the pack's effect on requirement-matching, direction-blind |
| `coverageIncrease` *(added during CARD-009 implementation)* | mean of the signed positive deltas only (items where `coverage_with_X > coverage_without_X`) | How much the pack adds, isolated from regressions |
| `coverageDecrease` *(added during CARD-009 implementation)* | mean magnitude of the signed negative deltas only (items where `coverage_with_X < coverage_without_X`) | How much the pack removes — without this, `coverageDelta` alone makes an improvement and a regression of equal size indistinguishable, which a PR review on CARD-009 caught before merge |
| `verdictTransitionCount` | count of items where `verdict_with_X ≠ verdict_without_X` | How many items the pack actually moves, on the axis CARD-007 showed is pack-sensitive (chiefly `consider`↔`apply`) |
| `verdictTransitionDirection` | breakdown of transitions by direction (e.g. `consider→apply: N`, `apply→consider: M`) | Whether the pack's effect is "more confident surfacing" or noise/regression |
| `coincidentGroundTruthAlignment` | of items with a verdict transition, the fraction where the transition moved *toward* the item's ground truth (`consider→apply` on a `WORTH_ATTENTION` item counts as aligned) | Whether the pack's causal effect is directionally correct, not just present |

## Guardrail metrics (monitored, not discriminating — carried over from §3)

Still computed on `B` and `B+X` (or `B−X` and `B`), for non-regression only:

- `missedOpportunityRate` (must stay ≤5% on both composites)
- `attentionReduction`, `attentionPrecision` (must not regress when `X` is added)

These are explicitly **not** the signal that decides eligibility under this design — CARD-007 showed they cannot move due to a knowledge pack under the current `evaluateOpportunity`. They exist only to catch a pack that somehow makes the *criteria*-driven guardrail worse indirectly (e.g. by interacting with title/JD text matched by `checkAvoid`) — an edge case worth guarding even though it isn't the pack's primary channel of effect.

## Proposed acceptance shape (to be calibrated, not finalized here)

A candidate pack `X` is a causal-contribution candidate for promotion if, on `Δ(B, B+X)`:

1. `verdictTransitionCount > 0` — the pack must move at least one item's verdict on Corpus v3 OOS. (Exact minimum-count or percentage threshold: **TBD**, needs calibration against a second corpus once implemented — asserting a specific number here without empirical basis would repeat the mistake this redesign exists to fix.)
2. `coincidentGroundTruthAlignment` is not below some floor (e.g. transitions should skew toward correct, not random) — **exact floor TBD**, same reason.
3. Guardrail metrics on `B+X` do not regress relative to `B` (`missedOpportunityRate` does not increase, `attentionReduction`/`attentionPrecision` do not decrease).
4. Scale requirement carried over from old §3: corpus ≥50 items (already satisfied, Corpus v3 has 52).

This design deliberately leaves (1) and (2)'s numeric thresholds open rather than inventing plausible-looking numbers — CARD-001's old §3 thresholds looked precise and machine-checked but were gating a blind instrument. A future implementation card should calibrate these against at least one pack already known (from CARD-007's traced items) to have a real, ground-truth-aligned effect, before locking a number into a hard gate.

## Relationship to CARD-001's contract

This design does not replace `knowledge-promotion-contract.md` outright — it proposes replacing §3's three metrics and their thresholds with the causal-contribution metrics above, while keeping §1, §2 (eligibility preconditions: OOS corpus, `composeKnowledge` usage) and §4 (invariants: Protocol v1 determinism, frozen-platform boundary) intact. Formally editing CARD-001's contract text is implementation-card work, not done here.

## Explicitly out of scope for this card

- Implementing `PerItemResult` capture, the diff/delta computation, or any new benchmark engine code.
- Modifying `evaluateOpportunity`, `runVerdictQualityBenchmark`, or `runAttentionValidationAtScale`.
- Re-evaluating `SYSTEMS_INFRA_KNOWLEDGE` (already "eligible per old §3", now known weak evidence), `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, or `DATA_AGENTIC_KNOWLEDGE` with either the old or the new mechanism.
- Changing `Operational Knowledge Version`.
- Calibrating or locking the numeric thresholds proposed above.
- Patching the old benchmark's threshold values as a shortcut — this design is the alternative to that shortcut, not a wrapper around it.
