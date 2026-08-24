# Causal Signal Classification

**Card:** CARD-011
**Input:** [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010, 7 raw data points)
**Status:** Analysis and proposal only. No number is fixed here. No pack is promoted or declared eligible.

---

## 1. Signal classes observed, with the 7 points mapped

Four qualitatively distinct behaviors appear in CARD-010's evidence, based on the three-dimensional shape `(Δcoverage direction, Δverdict transition, ground-truth alignment)`:

| Class | Definition | Members | n |
|---|---|---|---|
| **Aligned Contribution** | `coverageIncrease > 0`, ≥1 verdict transition, transition is ground-truth-aligned | `FINTECH_PLATFORM_KNOWLEDGE` | 1 |
| **Misaligned Regression** | `coverageDecrease > 0`, ≥1 verdict transition, transition is *not* ground-truth-aligned | `SYSTEMS_INFRA_KNOWLEDGE` | 1 |
| **Sub-threshold Movement** | `coverageIncrease > 0`, zero verdict transitions | `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE` | 2 |
| **No Observable Effect** | all causal metrics exactly zero | `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE`, `EMPTY` | 3 |

Every one of CARD-010's 7 points falls into exactly one class — the classification is exhaustive and non-overlapping over the current evidence.

Two classes named in principle by the design (CARD-008) are **not yet observed** in any of the 7 points and have no member:

- **Misaligned Sub-threshold Movement** — coverage moves without a verdict transition, but in the *wrong* direction (e.g. `coverageDecrease > 0` with zero transitions). Not seen: both observed sub-threshold movers (`OCCUPATIONAL_CONTEXT`, `MLOPS`) moved coverage *up*.
- **Aligned Regression** — a verdict transition that is ground-truth-aligned but corresponds to a coverage *decrease* (e.g. correctly moving a `NOT_WORTH` item from `apply` down to `consider`). Not seen: the one observed regression (`SYSTEMS_INFRA`) was misaligned, not aligned.

Their absence is itself evidence, addressed in §3.

## 2. Proposed qualitative semantics (not numeric, not decided)

Reasoning only from the classes above, before any number is chosen:

- **Aligned Contribution** is the only class that unambiguously looks like what "useful knowledge" should produce: it adds recognition (`coverageIncrease > 0`) *and* that addition changes a decision *and* the change is correct. A promotion criterion should treat this class as its positive target.
- **Misaligned Regression** should disqualify a pack, or at minimum require it to be weighed against any positive evidence the same pack produces elsewhere — a pack that actively degrades a correct decision is doing causal harm, not just "having no effect."
- **Sub-threshold Movement** is the genuinely hard case this whole redesign exists to be able to see (the pre-CARD-007 instrument was blind to it entirely). It is evidence the pack does *something* real, but not evidence it changes any actual outcome on this corpus. Whether this alone should count toward eligibility, or should only count as corroborating evidence alongside at least one verdict-level transition, is exactly the kind of question that needs more than 2 examples to answer responsibly — see §3.
- **No Observable Effect** is not itself disqualifying — it may mean "genuinely useless pack" or "corpus doesn't exercise this pack's domain" (both `DATA_AGENTIC_KNOWLEDGE` and `ADMIN_KNOWLEDGE` plausibly fall in the latter case, per CARD-010's note). A promotion criterion cannot distinguish these two explanations from Corpus v3 alone.

None of the above is proposed as a rule with a number attached. It is a proposed *shape* a rule should have: reward Aligned Contribution, penalize Misaligned Regression, treat Sub-threshold Movement as necessary-but-unproven-sufficient, and treat No Observable Effect as inconclusive rather than as either a pass or a fail.

## 3. Is the current evidence sufficient to calibrate numbers? — No.

Stated explicitly, as the card requires:

**Not yet.** Three of the four classes have `n=1` or `n=2`, and two named classes have `n=0`. Concretely:

- With `n=1` for Aligned Contribution, there is no way to know whether `FINTECH_PLATFORM_KNOWLEDGE`'s exact numbers (`coverageIncrease=1`, 1 transition, full alignment) represent a typical "good" pack or an unusually strong one. A threshold calibrated against this single point would be exactly the CARD-001 mistake this whole lineage exists to avoid — fitting a rule to the one example available rather than to a distribution.
- With `n=1` for Misaligned Regression, there is no evidence yet on what a "mild" or "borderline" regression looks like versus `SYSTEMS_INFRA_KNOWLEDGE`'s case — is any misaligned transition disqualifying, or only regressions above some magnitude? Unanswerable from one point.
- The two unobserved classes (Misaligned Sub-threshold Movement, Aligned Regression) mean the classification itself is untested against cases that could reveal it's incomplete or wrong.
- All three `No Observable Effect` members are plausibly explained by the same cause (corpus domain gap) rather than being three independent confirmations — they may be one data point, not three.

**What would move this from "not sufficient" to "sufficient," concretely:** more points in the Aligned Contribution and Misaligned Regression classes specifically (the two classes a numeric threshold would actually gate on), and/or a corpus with items in the domains `DATA_AGENTIC_KNOWLEDGE`/`ADMIN_KNOWLEDGE` cover, to distinguish "no effect because irrelevant corpus" from "no effect because low-value pack." Getting there is not this card's decision to authorize — per CARD-011's own scope, whether to pursue more evidence or accept the current n and proceed to calibration is the next authority decision, not made here.

## Explicitly out of scope for this card

- Any numeric threshold or calibrated criterion.
- Modifying the benchmark engine or any production code.
- Promoting or declaring eligible any pack.
- Creating the next card (more-evidence vs. calibrate-now) — that decision depends on this document's §3 conclusion and belongs to the operator.
