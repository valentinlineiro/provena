# ADR-003 — Isolated-OOS Knowledge Promotion Mechanism: Redesign-or-Delete Decision

## Status
**Decided: REDESIGN.** (2026-08-24, updated same day after CARD-007's diagnosis)

The deferred decision below (originally: diagnose first) is resolved. CARD-007 found the root cause is structural, not a narrow wiring defect: the knowledge pack *does* causally affect `coverage` and the per-item verdict (`EMPTY` → `consider`, `DEFAULT_SOFTWARE_KNOWLEDGE` → `apply`, same item), but `runVerdictQualityBenchmark` buckets `apply` and `consider` into the same "surfaced" outcome, and `skip` is gated entirely by pack-independent preference criteria — so the pack's real, observed effect never reaches the three §3 metrics.

**Operator's decision:** since the pack has a demonstrated causal effect on the system (`consider` → `apply`), the promotion *concept* (empirical, per-pack, evidence-gated) is not wrong — the *instrument* measuring it was blind to the one thing the pack actually moves. Redesign the measurement to a causal-contribution (ablation) design: compare a baseline composite against that composite with the candidate pack added (and, for re-auditing an already-promoted pack, against that composite with it removed), rather than evaluating one pack in total isolation. See [`causal-contribution-benchmark-design.md`](../causal-contribution-benchmark-design.md) (CARD-008) for the design — not yet implemented.

Eliminating the mechanism (Alternative B, below) was explicitly rejected: the causal evidence argues for fixing the instrument, not abandoning the concept it was trying to measure.

## Lineage

```text
CARD-002 → DEFAULT_SOFTWARE_KNOWLEDGE evaluated in isolation on Corpus v3 OOS
           → "eligible per §3" (MOR 0%, reduction 69%, precision 100%, matrix 16/0/36/0)
                    │
CARD-004 → SYSTEMS_INFRA_KNOWLEDGE evaluated the same way
           → identical result, bit-for-bit (16/0/36/0) — second occurrence
                    │
CARD-005 → Benchmark Discriminability Check: ADMIN_KNOWLEDGE (unrelated domain)
           and an EMPTY pack (patterns: []) evaluated the same way
           → identical result, bit-for-bit (16/0/36/0) — falsification
```

## Context & Motivation

CARD-001 (`knowledge-promotion-contract.md`) defined a promotion gate: a knowledge pack becomes part of `Operational Knowledge Version 1` if it clears fixed thresholds (MOR ≤5%, attention reduction ≥50%, precision ≥75%, scale ≥50) when evaluated **in isolation** against `VERDICT_GROUND_TRUTH_DATASET_OOS` (Corpus v3, 52 items), via `runOutOfSampleValidationBenchmark`.

CARD-002 and CARD-004 ran this evaluation for two software-domain packs and both passed with identical results. CARD-005 was authorized specifically to test whether that identity was coincidence or a defect in the methodology, using two controls: `ADMIN_KNOWLEDGE` (a genuinely unrelated domain) and an `EMPTY` pack with zero patterns.

**Both controls produced the exact same result as the two promoted-candidate packs.** An empty knowledge pack — one that can extract no market requirements from any job description — scored identically to every real pack tested: same 52-item scale, same 0% MOR, same 69% reduction, same 100% precision, same confusion matrix. This is conclusive: on this corpus, with this benchmark shape, the three §3 metrics do not measure anything about the knowledge pack being evaluated. The mechanism does not discriminate eligible knowledge from no knowledge at all.

This means the promotion mechanism defined in CARD-001 and exercised in CARD-002/CARD-004 is not measuring what it was designed to measure. That is not a minor implementation bug to patch in the next card — it is grounds to ask whether the mechanism itself, as designed, should be redesigned or replaced.

## Alternatives Considered

**A — Redesign the mechanism to measure causal contribution.**
Keep the concept of empirical per-pack promotion, but change the method — e.g. ablation over the production composite (measure the delta in outcomes when a pack is added to or removed from a full composite, rather than evaluating one pack alone) and/or a corpus deliberately constructed so that some items are only resolvable using a specific pack's patterns. Preserves per-pack attribution; requires new benchmark/corpus engineering.

**B — Eliminate isolated-pack promotion as a governance mechanism.**
Stop trying to promote individual packs via this benchmark. Govern `Operational Knowledge Version` some other way — e.g. evaluate only the full composite as a unit (as H8/Step 10 already do, and those benchmarks *do* show sensitivity — H8's adversarial corpus drove reduction down to the 18% floor, so the composed pipeline is not uniformly insensitive to everything), qualitative/manual review of pack contents, or a different criterion entirely. Simpler; loses the ability to attribute value to one pack in isolation.

## Decision

**We defer the choice between A and B.** Choosing between them now would be premature: the calculus is different depending on *why* the mechanism doesn't discriminate, and we don't know why yet. Two materially different situations are both consistent with the evidence gathered so far:

- If the cause is a narrow defect (e.g. the isolated recognizer's output isn't actually reaching the verdict computation for this corpus's items, a wiring gap upstream of `evaluateOpportunity`) — Alternative A likely collapses to a small, well-scoped fix, not a redesign.
- If the cause is structural (e.g. Corpus v3's 52 items don't need market-requirement extraction to resolve their ground truth — the verdict is dominated entirely by profile-side signal regardless of JD content) — Alternative A would require materially new corpus/benchmark design work, making B comparatively more attractive.

Committing to a path before knowing which of these is true risks either over-engineering a redesign for a one-line bug, or under-investing in a redesign that the root cause shows is actually feasible.

**What this decision authorizes:** nothing beyond this record. A follow-up diagnostic card — scoped only to determine why the benchmark doesn't discriminate, not to fix it or to choose A/B — is the natural next step, but it is **not created or authorized by this ADR**. It requires its own separate authority decision, per this project's established pattern of not bundling diagnosis with the decision to diagnose.

## What this decision does not do

- Does not revert or invalidate CARD-002's or CARD-004's recorded "eligible per §3" verdicts — they stand, with CARD-005's caveat attached, as literal (if now known to be weak) threshold-passes.
- Does not change `Operational Knowledge Version` (still `1`, `DEFAULT_SOFTWARE_KNOWLEDGE` only, per CARD-003).
- Does not touch the Decision Engine, the benchmark engine, or Corpus v3.
- Does not evaluate `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, or `DATA_AGENTIC_KNOWLEDGE` — that remains blocked until the redesigned mechanism (CARD-008's design) is implemented and validated. CARD-008 is design-only; implementing the new benchmark engine is a separate, not-yet-authorized card.
