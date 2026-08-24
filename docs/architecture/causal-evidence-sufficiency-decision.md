# Causal Evidence Sufficiency Decision

**Card:** CARD-013
**Input:** [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010), [`causal-signal-classification.md`](causal-signal-classification.md) (CARD-011), [`causal-evidence-survey-round-2.md`](causal-evidence-survey-round-2.md) (CARD-012) — 19 total observations.
**Decision (operator):** **Sufficient.** Proceed to designing a calibration rule.

---

## The question this card answers

CARD-011 and CARD-012 both explicitly declined to answer whether the accumulated evidence was enough to responsibly calibrate a numeric promotion criterion — CARD-011 because it only had `n=1` in the two promotion-relevant classes, CARD-012 because, even after doubling the corpus sources and adding pairwise interaction probes, those two classes only grew to `n=4` (Aligned Contribution) and `n=2` (Misaligned Regression).

## Decision

The operator reviewed the full evidence base (19 observations across two real corpora, single-pack and pairwise/removal comparisons) and decided: **the evidence is sufficient to proceed to designing a calibration rule**, accepting that `n=2–4` in the two gating classes is a real limitation, not a solved problem.

## What this decision does and does not authorize

**Authorizes:** the existence of a future card whose scope is to *design* a calibration rule — a candidate numeric or rule-based criterion for promotion, informed by the 19 observations and the qualitative semantics CARD-011 proposed (reward Aligned Contribution, penalize Misaligned Regression, treat Sub-threshold Movement as necessary-but-unproven-sufficient, treat No Observable Effect as inconclusive).

**Does not authorize, and this card does not do:**
- Design the calibration rule itself, or propose any specific number.
- Promote any pack or change `Operational Knowledge Version`.
- Touch `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md` — including the already-identified drift in the contract (it still says `Operational Knowledge Version` is "currently `0`" and describes incrementing "from `0` to `1`", both stale since CARD-003). That reconciliation is a separate, later card, deliberately kept out of this one.

## The residual risk this decision accepts, stated explicitly

A future calibration built on `n=2–4` risks encoding the specific characteristics of `FINTECH_PLATFORM_KNOWLEDGE` (the majority of the Aligned Contribution examples) and `SYSTEMS_INFRA_KNOWLEDGE` (the only Misaligned Regression example) into what looks like a general rule. The calibration-design card should carry this forward as a named caveat, not treat `n=2–4` as if it were a large, representative sample.
