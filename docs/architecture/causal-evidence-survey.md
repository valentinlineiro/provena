# Causal Evidence Survey — Raw Data, No Threshold

**Card:** CARD-010
**Instrument:** [`runCausalContributionBenchmark`](../../packages/core/src/causal-contribution-benchmark.ts) (CARD-009, direction-corrected per PR #11 review)
**Status:** Evidence only. No thresholds set, no criteria calibrated, no pack promoted, no eligibility declared.

---

## Why 7 points, not 1

CARD-009 demonstrated the redesigned instrument works on a single pair (`SYSTEMS_INFRA_KNOWLEDGE`). Calibrating a promotion threshold from that one data point would overfit the criterion to the first case observed — the same mistake CARD-001's original §3 thresholds made (they looked precise and machine-checked while gating an instrument later shown, in CARD-005, to be blind). This card runs the instrument against every pack currently in the codebase, plus a negative control, before any threshold is proposed.

## Method

All 7 comparisons use the same baseline `B = {DEFAULT_SOFTWARE_KNOWLEDGE}` — the currently promoted `Operational Knowledge Version 1` set (CARD-003) — against `B + X` for each candidate `X`, over `VERDICT_GROUND_TRUTH_DATASET_OOS` (Corpus v3, 52 items). `EMPTY` (`patterns: []`) is not a candidate pack — it is the negative control: what the instrument reports when no real knowledge is added. Its result is the baseline the other six should be judged against, once a threshold is proposed.

## Raw results

| Comparison (`B + X`) | `coverageIncrease` | `coverageDecrease` | `verdictTransitionCount` | `verdictTransitionDirection` | `coincidentGroundTruthAlignment` |
|---|---|---|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | 0 | 0.5 | 1 | `apply→consider: 1` | 0 |
| `FINTECH_PLATFORM_KNOWLEDGE` | 1 | 0 | 1 | `consider→apply: 1` | 1 |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | 1 | 0 | 0 | (none) | 0 |
| `MLOPS_KNOWLEDGE` | 0.2 | 0 | 0 | (none) | 0 |
| `DATA_AGENTIC_KNOWLEDGE` | 0 | 0 | 0 | (none) | 0 |
| `ADMIN_KNOWLEDGE` | 0 | 0 | 0 | (none) | 0 |
| `EMPTY` (negative control) | 0 | 0 | 0 | (none) | 0 |

(`coverageDelta`, the direction-blind magnitude, is omitted from this table since `coverageIncrease`/`coverageDecrease` carry strictly more information — see PR #11's fix.)

## What this survey already shows, without calibrating anything

- **The regression test passes: `EMPTY` produces exactly zero on every causal metric.** This is the sanity check the old instrument failed (CARD-005: `EMPTY` scored identically to every real pack on the old §3 metrics). The redesign holds under its first real audit.
- **`DATA_AGENTIC_KNOWLEDGE` and `ADMIN_KNOWLEDGE` are indistinguishable from `EMPTY` on this corpus** — zero effect on every metric. This is not evidence they are bad packs; it is evidence Corpus v3's 52 OOS items don't contain job descriptions their patterns would match. A future corpus with data/agentic-AI or admin/HR postings might show a different result. Not investigated further here (out of scope).
- **`SYSTEMS_INFRA_KNOWLEDGE` is the only comparison with a *misaligned* transition** (`coincidentGroundTruthAlignment: 0` on its one transition) — it moved a `WORTH_ATTENTION` item's verdict *away* from correct (`apply→consider`, a confidence regression). This is a genuinely negative signal a promotion criterion would need to weigh, not just "did something move."
- **`OCCUPATIONAL_CONTEXT_KNOWLEDGE` and `MLOPS_KNOWLEDGE` show coverage movement (`coverageIncrease` 1 and 0.2 respectively) with zero verdict transitions.** The pack changed the underlying signal without crossing the `apply`/`consider` threshold for any item — a case the old instrument (pre-CARD-007) could never have surfaced at all, since it only ever saw the post-threshold verdict.
- **`FINTECH_PLATFORM_KNOWLEDGE` is the only comparison with a positive, ground-truth-aligned transition** (`consider→apply`, `coincidentGroundTruthAlignment: 1`) — the one result that looks, on this raw evidence alone, most like what a "good" candidate should produce.

None of the above is a promotion decision. It is the shape of the evidence a future calibration card would need to reason about — and it already shows the seven packs are not interchangeable, which is itself the point of building this instrument.

## Explicitly out of scope for this card

- Proposing or fixing any numeric threshold for `verdictTransitionCount`, `coincidentGroundTruthAlignment`, or the coverage metrics.
- Declaring any pack eligible or promoting any pack.
- Investigating why `DATA_AGENTIC_KNOWLEDGE`/`ADMIN_KNOWLEDGE` show zero effect on this corpus.
- Modifying the benchmark engine (no defect was found that blocked measurement — all 7 runs completed cleanly).
