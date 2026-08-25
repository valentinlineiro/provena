# Causal Promotion ELIGIBLE Criterion — Independence Redesign

**Status:** Design only. Does not validate the new criterion, does not promote any pack, does not change `Operational Knowledge Version`.
**Card:** CARD-016
**Input:** [`causal-promotion-candidate-policy-design.md`](causal-promotion-candidate-policy-design.md) (CARD-014, candidate policy `R`), [`causal-promotion-policy-validation.md`](causal-promotion-policy-validation.md) (CARD-015, §4/§5 finding).
**Scope:** replaces only CARD-014 §6's `≥2 independent comparisons` `ELIGIBLE` clause. Every other part of `R` — the ordinal shape, the four/six classes, the unconditional Misaligned Regression veto, `INSUFFICIENT`/`INCONCLUSIVE` handling — is unchanged and out of scope here.

---

**Per this card's own prohibition, this document does not conclude the redesigned criterion is correct.** It designs a candidate replacement and reports what changes retrospectively. Validating it is CARD-017's job, not this card's.

## 1. The finding this card starts from

CARD-015 §4 found that CARD-014's `≥2 independent comparisons` bar is satisfied by counting *comparisons* — and a single pack tested three times against slightly different composites still counts as three comparisons, even when two of those three reuse the same underlying corpus. `FINTECH_PLATFORM_KNOWLEDGE` reached `ELIGIBLE` this way: CARD-010's standalone run (OOS), CARD-012's standalone run (V2), and CARD-012's pairwise run (OOS again, inside `B+SYSTEMS_INFRA`). Two of the three share a corpus. **Comparisons ≠ independent evidence.**

## 2. What "independent evidence" means for a causal-contribution claim

A causal-contribution instance (Aligned Contribution or Aligned Regression, per CARD-014 §3/§4) is genuinely *independent* confirmation of a pack `X`'s effect only if it demonstrates the effect holds on data the pack has not already been credited for producing the effect on. Two runs of `X` against the same underlying job-description corpus — however the composite around `X` is arranged — are testing the same fixed set of items; a pack that happens to move one of those items' verdict will keep moving it (or nearby items) across every composite position tried on that corpus. That is evidence the effect is *real within that corpus*, not evidence it *generalizes beyond* it. Generalization is exactly what a promotion criterion needs, since the whole point of promoting a pack is to trust its effect on job descriptions the benchmark corpora don't contain.

**This makes corpus/source the load-bearing independence axis**, not comparison count, not experimental round, and not baseline composition. This is not a new idea introduced here — it is the same discipline CARD-012 already applied by hand when it explicitly used "a second real corpus already in the repo" (`VERDICT_GROUND_TRUTH_DATASET_V2`) specifically because `n=1` on a single corpus (CARD-011's finding) could not be trusted. This card mechanizes that same discipline into `R`'s `ELIGIBLE` rule instead of leaving it as something a human happened to do once.

## 3. Diversity dimensions considered, and why only one is load-bearing

| Dimension | Considered? | Verdict |
|---|---|---|
| **Corpus/source** (e.g. OOS, V2) | Yes | **Load-bearing** — the only dimension that tests generalization to different underlying data, per §2. |
| **Compositional position** (standalone vs. inside a composite with other packs already present) | Yes | Not independence — see §4, "complementary/interaction evidence." Real information, wrong category. |
| **Baseline configuration** (which other packs are in `B` at comparison time) | Yes | Same concept as compositional position under a different name — folded into the same "complementary" category, not treated as a separate axis. |
| **Experimental round** (CARD-010 vs. CARD-012, or any future round) | Yes | **Not used as an independence axis.** A "round" is a batch of work, not a data source — CARD-012's own round mixed one genuinely new corpus (V2) with several comparisons that reused the existing OOS corpus in new positions. Treating "round" as independence would double-count exactly the way "comparison count" did; corpus/source is the more principled and already-correct signal underneath it. |

## 4. Three-way distinction, kept explicit (§5 of this card's scope)

- **Independent evidence** — an Aligned Contribution / Aligned Regression instance on a corpus `X` has not previously been credited on. Each distinct corpus contributes at most one unit of independence per pack, regardless of how many comparisons are run against it.
- **Complementary/interaction evidence** — an instance on a corpus `X` has already been credited on, but in a different compositional position (e.g. standalone vs. inside a composite with another pack already present). This is real and useful: it tests whether `X`'s effect survives interaction with other packs, which the corpus-diversity check alone cannot show. It is logged and reported, and can raise qualitative confidence in a borderline case, but does **not** count toward the independence tally in §5's rule — a pack cannot reach `ELIGIBLE` on complementary evidence alone, no matter how many complementary instances accumulate.
- **Repeated evidence** — the identical comparison (same corpus, same composite) re-run. Not present anywhere in the current 19+1 observations. Contributes zero new information beyond a determinism/regression check; explicitly does not count as independent evidence, and does not count as complementary evidence either, since nothing new is being tested.

## 5. The redesigned `ELIGIBLE` clause

Replacing CARD-014 §6's row:

```text
OLD: 0 Misaligned Regression, ≥2 Aligned Contribution / Aligned Regression combined,
     across ≥2 independent comparisons → ELIGIBLE
```

with:

```text
NEW: 0 Misaligned Regression, ≥1 Aligned Contribution / Aligned Regression instance
     on ≥2 distinct corpora → ELIGIBLE
```

Every other row of CARD-014 §6's table is unchanged — the veto row, the `INSUFFICIENT` row (now reads naturally as "qualifying instances exist on only 1 distinct corpus"), and both `INCONCLUSIVE` rows are untouched by this redesign; only the `ELIGIBLE` row's counting rule changes, from counting comparisons to counting distinct corpora.

This keeps the same conservative spirit CARD-014 §8 stated for the old rule (`≥2`, not `≥1`, chosen deliberately as "not one" without claiming a derived number) — the new rule is still `≥2`, just counted along the axis that actually measures independence rather than the axis that happened to be easy to count.

## 6. Retrospective replay: what changes, and what doesn't

Applying the new rule to CARD-010/CARD-012's 19 points (per-pack Aligned Contribution / Aligned Regression tally by corpus):

| Pack `X` | Corpora with ≥1 Aligned Contribution/Aligned Regression | Distinct corpora count | Old verdict (CARD-015 §1.3) | New verdict |
|---|---|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | n/a — vetoed by Misaligned Regression regardless (§3 short-circuits before this clause is even reached) | — | VETOED | **VETOED (unchanged — veto is out of this card's scope)** |
| `FINTECH_PLATFORM_KNOWLEDGE` | OOS (CARD-010 standalone + CARD-012 pairwise — 1 unit, not 2, per §4), V2 (CARD-012 standalone — 1 unit) | **2** (OOS, V2) | ELIGIBLE | **ELIGIBLE — unchanged, but now for the correct reason (§6.1)** |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | none (only Sub-threshold Movement, never Aligned Contribution — §3's necessary "≥1 Aligned Contribution" clause is never met, corpus diversity is irrelevant here) | 0 | INCONCLUSIVE | **INCONCLUSIVE — unchanged** |
| `MLOPS_KNOWLEDGE` | none (same reason) | 0 | INCONCLUSIVE | **INCONCLUSIVE — unchanged** |
| `DATA_AGENTIC_KNOWLEDGE` | none (No Observable Effect only, confirmed a third time by CARD-015's stress test on a new composite position — still zero) | 0 | INCONCLUSIVE | **INCONCLUSIVE — unchanged** |
| `ADMIN_KNOWLEDGE` | none | 0 | INCONCLUSIVE | **INCONCLUSIVE — unchanged** |

### 6.1 Why `FINTECH_PLATFORM_KNOWLEDGE` staying `ELIGIBLE` is not this card quietly re-passing the old answer

No pack's verdict changes under retrospective replay. This is worth confronting directly rather than treating as convenient: **it does not mean the redesign is vacuous.** `FINTECH_PLATFORM_KNOWLEDGE`'s `ELIGIBLE` verdict under the new rule rests on exactly 2 distinct corpora (OOS, V2), each independently showing an Aligned Contribution — it does not need, and does not use, the third (same-corpus, complementary) OOS pairwise instance to clear the bar. That third instance is now correctly categorized as complementary evidence (§4), logged as additional confidence, but not counted toward the independence tally.

**A concrete counterfactual shows the new rule does have teeth, even though no pack in the current evidence sits in the gap it closes:** if `FINTECH_PLATFORM_KNOWLEDGE`'s third instance had instead been a *second* OOS-only comparison (e.g. another pairwise position on OOS, no V2 evidence at all), the old rule (`≥2 comparisons`) would still have called it `ELIGIBLE` — 3 same-corpus comparisons is still ≥2 comparisons. The new rule would correctly call that hypothetical case `INSUFFICIENT` (1 distinct corpus, however many same-corpus comparisons). **No pack in the current 19+1 observations actually occupies that gap** — this is a real, named limitation of this retrospective check, not a claim the redesign has been exercised against a real failing case. CARD-017's stress test should specifically look for or construct a case in that gap, since this replay could not.

## 7. Cases that remain non-independent / unresolved under the new rule

- **`OCCUPATIONAL_CONTEXT_KNOWLEDGE` and `MLOPS_KNOWLEDGE`** have evidence spanning both corpora (OOS and V2) already, but none of it is Aligned Contribution — it is entirely Sub-threshold Movement (plus one No-Observable-Effect point for `MLOPS_KNOWLEDGE` on V2). Corpus diversity cannot manufacture a qualifying signal type that was never observed; these remain `INCONCLUSIVE` regardless of how many corpora confirm the same non-qualifying signal.
- **A pack tested only in complementary (same-corpus, varied-position) comparisons, never against a second corpus**, has no path to `ELIGIBLE` under this rule no matter how many such comparisons accumulate — this is intentional (§4), not an oversight, but it does mean a pack whose only available second data source is expensive or doesn't yet exist (cf. CARD-010's `DATA_AGENTIC_KNOWLEDGE`/`ADMIN_KNOWLEDGE` domain-gap finding) has no route to `ELIGIBLE` until a corpus exercising its domain exists — same limitation CARD-010 already named, now made structurally explicit in the `ELIGIBLE` rule itself rather than left implicit.
- **Only 2 real corpora currently exist in the repo** (OOS, V2). The `≥2 distinct corpora` bar is therefore, for now, equivalent to "confirmed on every corpus this repo has" — not yet distinguishable from a weaker "confirmed on at least 2 of many" bar a future 3rd/4th corpus would actually test. This is named as a limitation, not resolved: the rule cannot currently be stress-tested against a case where 2-of-many corpora would be a meaningfully lower bar than 2-of-2.

## Explicitly out of scope for this card

- Validating that this redesigned criterion is correct (CARD-017).
- Promoting `FINTECH_PLATFORM_KNOWLEDGE` or any other pack, despite the retrospective replay's literal `ELIGIBLE` output.
- Redesigning the Misaligned Regression veto.
- Redesigning the ordinal taxonomy (the four/six classes) or any class other than the `ELIGIBLE` row's counting rule.
- Calibrating a numeric promotion threshold.
- Changing `Operational Knowledge Version`.
- Reconciling `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md`.
