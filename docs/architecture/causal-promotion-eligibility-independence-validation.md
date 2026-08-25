# Causal Promotion ELIGIBLE Criterion — Independence Validation

**Status:** Validation only. Does not validate the candidate promotion policy as a whole, does not promote any pack, does not change `Operational Knowledge Version`.
**Card:** CARD-017
**Input:** [`causal-promotion-eligibility-independence-redesign.md`](causal-promotion-eligibility-independence-redesign.md) (CARD-016, redesigned `ELIGIBLE` clause), raw evidence tables in [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010) and [`causal-evidence-survey-round-2.md`](causal-evidence-survey-round-2.md) (CARD-012).

---

**Per this card's own prohibition, the criterion is not changed anywhere below to make a check pass, and no artificial third corpus is added to stress the threshold.**

## 1. Retrospective replay — independently re-derived, not taken on trust

CARD-015 found CARD-014's own worked example contained a real misattribution error. That precedent means CARD-016's retrospective replay (§6 of that document) should not be accepted at face value here — it is re-derived from the raw source tables directly.

### 1.1 Corpus tagging, read from the raw tables

CARD-010's method section states all 7 comparisons ran on `VERDICT_GROUND_TRUTH_DATASET_OOS` — corpus `OOS` for every row. CARD-012's raw results table tags each row explicitly: 6 rows `V2`, 6 rows `v3 OOS`. Cross-checked against both source documents directly — no ambiguity found in either table.

### 1.2 Per-pack corpus tally for Aligned Contribution / Aligned Regression only (the classes the `ELIGIBLE` clause counts)

| Pack `X` | OOS: Aligned Contribution instances | V2: Aligned Contribution instances | Distinct corpora with ≥1 instance |
|---|---|---|---|
| `FINTECH_PLATFORM_KNOWLEDGE` | 2 (CARD-010 standalone; CARD-012 pairwise `+SYSTEMS_INFRA→+FINTECH`) | 1 (CARD-012 standalone) | **2** |
| `SYSTEMS_INFRA_KNOWLEDGE` | 0 (its only OOS-corpus Aligned-Contribution-*shaped* row is the removal-audit — see §2.2 for why it isn't counted here) | 0 | 0 (moot — vetoed by Misaligned Regression before this clause is reached) |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` | 0 | 0 | 0 |

**This matches CARD-016 §6 exactly.** Independent re-derivation from the raw tables found no error this time — unlike CARD-014's worked example, CARD-016's retrospective replay was accurate.

### 1.3 Classifications produced, without adjustment

| Pack `X` | New rule's verdict |
|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | `VETOED` |
| `FINTECH_PLATFORM_KNOWLEDGE` | `ELIGIBLE` |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` | `INCONCLUSIVE` |

No verdict was adjusted to fit an expectation — this table is the mechanical output of §5's rule applied to §1.2's tally, nothing else.

## 2. Cross-corpus validation

### 2.1 Independent contributions genuinely come from distinct corpora

`FINTECH_PLATFORM_KNOWLEDGE`'s 2-corpus credit rests on: one Aligned Contribution row explicitly tagged `V2` (CARD-012's standalone `B+FINTECH_PLATFORM` comparison) and at least one Aligned Contribution row explicitly tagged `OOS` (CARD-010's standalone comparison, predating CARD-012 entirely). These are drawn from two separate `VERDICT_GROUND_TRUTH_DATASET_*` fixtures in the codebase (`VERDICT_GROUND_TRUTH_DATASET_OOS` — Corpus v3, 52 items — and `VERDICT_GROUND_TRUTH_DATASET_V2`, the H8 adversarial corpus), not two views of the same underlying item set. This is genuine cross-source confirmation, not a relabeling of the same data.

### 2.2 Distinct corpus, correctly separated from compositional variation

CARD-012's `B+SYSTEMS_INFRA→+FINTECH` row (`v3 OOS`) is `FINTECH_PLATFORM_KNOWLEDGE` gaining a positive transition while composed alongside `SYSTEMS_INFRA_KNOWLEDGE`, on the *same* corpus as CARD-010's bare standalone comparison. Per §1.2, this correctly contributes to the *same* OOS unit as CARD-010's standalone row, not a second one — the compositional difference (bare `B` vs. `B+SYSTEMS_INFRA`) does not manufacture a new corpus. This is exactly CARD-016 §4's "complementary/interaction evidence" category, correctly not double-counted.

The removal-audit row (`B+SYSTEMS_INFRA+FINTECH → remove SYSTEMS_INFRA`) is, again, about the effect of removing `SYSTEMS_INFRA_KNOWLEDGE` — `FINTECH_PLATFORM_KNOWLEDGE` is held constant across both sides of that comparison. It contributes to neither pack's corpus tally as a new-addition instance (consistent with CARD-015 §1.2's correction, which this validation does not need to repeat since it wasn't relied on here).

## 3. Counterexample / boundary analysis — both boundary conditions found in real data, none fabricated

The card asks for cases demonstrating each side of the boundary. Both already exist in the current evidence without needing to construct anything:

- **"Multiple comparisons of the same corpus should not count twice"** — demonstrated live by `FINTECH_PLATFORM_KNOWLEDGE`'s own OOS evidence: 2 separate comparisons (CARD-010 standalone, CARD-012 pairwise) on the same corpus correctly collapse to 1 independence unit under §1.2, not 2. This is not the hypothetical CARD-016 §6.1 constructed — it is the pack's *actual* OOS-side evidence, which happens to already contain 2 same-corpus comparisons.
- **"A contribution appearing in two corpora should count"** — demonstrated live by the same pack's full record: OOS (2 comparisons, 1 unit) + V2 (1 comparison, 1 unit) = 2 distinct units → `ELIGIBLE`. Removing either corpus's contribution (a hypothetical, not performed here — no data was altered) would drop the count to 1 distinct corpus and the verdict to `INSUFFICIENT`, showing the rule is sensitive to genuine corpus removal in the direction expected.

**No case was found, and none was fabricated, of a pack whose repeated same-corpus comparisons the old rule would have wrongly promoted and the new rule correctly withholds** — as CARD-016 §6.1 already stated, no pack in the current 19+1 observations sits in that specific gap. This absence is reported here as a confirmed gap in the *evidence*, not a defect in the *rule*: the boundary logic is demonstrably correct on the cases that do exist (this section), even though the specific "old-rule-wrongly-passes, new-rule-correctly-blocks" case remains untested by real data (matching CARD-016's own honest limitation, not contradicting it).

## 4. Robustness — validated, or merely not falsified?

**Only 2 real corpora exist in the repository** (`VERDICT_GROUND_TRUTH_DATASET_OOS`, `VERDICT_GROUND_TRUTH_DATASET_V2`). For any pack, "≥2 distinct corpora" is therefore currently identical to "confirmed on every corpus available" — there is no case in this repository where a pack could satisfy `≥2 of 3` or `≥2 of 4` while still failing to use every corpus that exists. **This means the criterion's behavior at its actual design point — discriminating "confirmed on a meaningful subset of many sources" from "confirmed on just one or two" — has not been exercised.** What has been validated (§1–§3) is narrower and real: that the rule correctly counts distinct sources rather than raw comparisons, and correctly declines to inflate that count from compositional variation within one source. What remains untested is whether `≥2` is the right bar once more than 2 corpora exist, or whether the rule's shape (a raw count of qualifying corpora, no weighting) continues to make sense at that scale.

**Answer to the card's explicit question: not falsified, and separately, correctly discriminating on every case the current data can pose — but not stress-tested at the scale where its real design tradeoff (2-of-many, not 2-of-2) would show up.** This is a structural limitation of the available evidence, not a flaw in the rule's logic, and this card does not attempt to resolve it — adding a third corpus artificially to test the boundary is explicitly prohibited, and rightly so: a corpus built specifically to probe a threshold is exactly the kind of after-the-fact evidence-shaping this whole lineage exists to avoid.

## 5. Overall verdict

**VALIDATED, with the scope of what "validated" means stated precisely, not left implicit:**

- The redesigned rule's *logic* is validated: it correctly re-produces CARD-016's retrospective replay under independent re-derivation (§1), correctly separates genuine cross-corpus confirmation from same-corpus compositional variation using real, non-fabricated examples on both sides of the boundary (§2, §3).
- What is **not** validated, and is explicitly named rather than smoothed over: whether `≥2 distinct corpora` is the right bar at a scale beyond the 2 corpora currently available (§4). This is a data-availability limitation, not a logic defect — it cannot be resolved by this card, and should not be resolved by fabricating a corpus to test it.

**This authorizes the next step named in this card's own scope: validating the candidate promotion policy as a whole** (which still needs, separately, the adversarial veto check CARD-015 could not run against a real conflicting case — see [`causal-promotion-policy-validation.md`](causal-promotion-policy-validation.md) §3/§8, still open). It does not authorize promoting `FINTECH_PLATFORM_KNOWLEDGE` or declaring the full policy validated.

## Explicitly out of scope for this card

- Changing the criterion during validation.
- Adding an artificial third corpus to test the threshold.
- Promoting any pack, including `FINTECH_PLATFORM_KNOWLEDGE` despite its literal `ELIGIBLE` output under both the old and new rule.
- Declaring the candidate promotion policy validated as a whole.
- Touching the veto or the ordinal taxonomy.
- Reconciling `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md`.
