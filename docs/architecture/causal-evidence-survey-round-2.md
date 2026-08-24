# Causal Evidence Survey — Round 2 (Discriminative)

**Card:** CARD-012
**Prior evidence:** [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010, 7 points), classified in [`causal-signal-classification.md`](causal-signal-classification.md) (CARD-011)
**Status:** Evidence only. No number fixed, no pack promoted. This round targets the two classes CARD-011 found under-evidenced (`Aligned Contribution` n=1, `Misaligned Regression` n=1) and the two classes with zero members.

---

## Sources used (no fabrication)

Two legitimate sources of new, real evidence, per this card's authorization — no synthetic pack or synthetic corpus item was created:

1. **A second real corpus already in the repo**: `VERDICT_GROUND_TRUTH_DATASET_V2` (the H8 adversarial corpus), run through the same `runCausalContributionBenchmark` instrument, single packs vs. `B = {DEFAULT_SOFTWARE_KNOWLEDGE}`.
2. **Pairwise interaction effects among the real candidate packs already in the codebase**, on Corpus v3 OOS — e.g. does adding `FINTECH_PLATFORM_KNOWLEDGE` on top of an already-composed `B+SYSTEMS_INFRA_KNOWLEDGE` behave like adding it to bare `B`? Includes one re-audit-shape probe (removing `SYSTEMS_INFRA_KNOWLEDGE` from an existing composite) to test the mechanism from the opposite direction.

## New raw results (12 comparisons)

| Comparison | Corpus | `coverageIncrease` | `coverageDecrease` | transitions | direction | alignment |
|---|---|---|---|---|---|---|
| `B+SYSTEMS_INFRA` | V2 | 0 | 0.444 | 3 | `apply→consider: 3` | 0 |
| `B+FINTECH_PLATFORM` | V2 | 1 | 0 | 1 | `consider→apply: 1` | 1 |
| `B+OCCUPATIONAL_CONTEXT` | V2 | 1 | 0 | 0 | — | — |
| `B+MLOPS` | V2 | 0 | 0 | 0 | — | — |
| `B+DATA_AGENTIC` | V2 | 0 | 0 | 0 | — | — |
| `B+ADMIN` | V2 | 0 | 0 | 0 | — | — |
| `B+SYSTEMS_INFRA` → `+FINTECH` | v3 OOS | 1 | 0 | 1 | `consider→apply: 1` | 1 |
| `B+SYSTEMS_INFRA` → `+OCCUPATIONAL` | v3 OOS | 1 | 0 | 0 | — | — |
| `B+SYSTEMS_INFRA` → `+MLOPS` | v3 OOS | 1 | 0 | 0 | — | — |
| `B+FINTECH` → `+OCCUPATIONAL` | v3 OOS | 1 | 0 | 0 | — | — |
| `B+OCCUPATIONAL` → `+MLOPS` | v3 OOS | 1 | 0 | 0 | — | — |
| `B+SYSTEMS_INFRA+FINTECH` → remove `SYSTEMS_INFRA` | v3 OOS | 0.5 | 0 | 1 | `consider→apply: 1` | 1 |

## Updated class membership (7 original + 12 new = 19 total observations)

| Class | Prior n (CARD-011) | New members this round | New n |
|---|---|---|---|
| Aligned Contribution | 1 | V2 `FINTECH_PLATFORM`; v3 `B+SYSTEMS_INFRA→+FINTECH`; v3 removal-audit | **4** |
| Misaligned Regression | 1 | V2 `SYSTEMS_INFRA` (3 transitions, larger than the original 1) | **2** |
| Sub-threshold Movement | 2 | V2 `OCCUPATIONAL_CONTEXT`; v3 `+OCCUPATIONAL`, `+MLOPS` (twice), `+FINTECH→+OCCUPATIONAL`, `+OCCUPATIONAL→+MLOPS` | **7** |
| No Observable Effect | 3 | V2 `MLOPS`, `DATA_AGENTIC`, `ADMIN` | **6** |
| Misaligned Sub-threshold Movement | 0 | none | **0** |
| Aligned Regression | 0 | none | **0** |

## The removal-audit result deserves a note, not a silent count

The last row (`B+SYSTEMS_INFRA+FINTECH` → remove `SYSTEMS_INFRA`) is mechanically an `Aligned Contribution` (coverage up, transition up, aligned) — but its causal story is the mirror image: it is evidence that *removing* a Misaligned-Regression-causing pack improves the outcome, not evidence that *adding* a new pack helps. Counted in the n above for completeness, but a future calibration should not treat this the same as an independent new-pack contribution without noting the distinction.

## Why the two remaining classes stayed at zero — a structural explanation, not just an absence

Across all 19 observations in both corpora, **no pack has ever moved the verdict of a `NOT_WORTH` item** — every transition observed (5 total across both rounds) occurred on a `WORTH_ATTENTION` item. Both missing classes require a `NOT_WORTH`-item effect by construction: `Aligned Regression` needs a correct downward move on a `NOT_WORTH` item, and the natural reading of `Misaligned Sub-threshold Movement` (coverage moving on a `NOT_WORTH` item without crossing a threshold) does too. This isn't proof the classes are impossible, but it is a concrete, repeatable pattern — not just "we tried a few things and got nothing" — pointing at *why*: none of the 6 available packs' patterns appear to intersect with what makes Corpus v2/v3's `NOT_WORTH` items `NOT_WORTH` in the first place.

## STOP verdict (split, not forced into one answer)

Per this card's authorization, the two conditions are evaluated separately per class group rather than as one blanket answer, since the evidence is genuinely mixed:

- **`Misaligned Sub-threshold Movement` and `Aligned Regression`: condition (b) applies.** Across 19 real observations spanning two corpora, single packs, and pairwise/removal combinations, neither class appeared, and there is a structural reason why (no pack tested ever affects a `NOT_WORTH` item). The 6 packs and 2 corpora currently in the repo do not appear able to produce these classes. Generating them would require either a new pack whose patterns match something in the `NOT_WORTH` items' text, or a new corpus — both out of this card's scope to create.
- **`Aligned Contribution` (n=4) and `Misaligned Regression` (n=2): neither (a) nor (b) cleanly applies.** Diversity increased meaningfully (from single points to small clusters), but n=2–4 is still thin for calibrating a numeric threshold responsibly. Declaring this "sufficient" is a judgment call this card is not authorized to make unilaterally — it is the next authority decision, informed by this round's data rather than settled by it.

## Explicitly out of scope for this card

- Any numeric threshold or calibrated criterion.
- Modifying the benchmark engine (no defect found — all 19 runs, across both rounds, completed cleanly).
- Promoting or declaring eligible any pack.
- Fabricating a pack or corpus item to force the two zero-count classes into existence.
- Deciding whether n=4/n=2 is "enough" to proceed to calibration.
