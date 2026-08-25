# Causal Promotion Candidate Policy — Validation

**Status:** Validation only. Does not implement the policy, does not promote any pack, does not change `Operational Knowledge Version`.
**Card:** CARD-015
**Input:** [`causal-promotion-candidate-policy-design.md`](causal-promotion-candidate-policy-design.md) (CARD-014, candidate policy `R`), [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010, 7 points), [`causal-evidence-survey-round-2.md`](causal-evidence-survey-round-2.md) (CARD-012, 12 more points).
**New evidence used:** one genuinely new comparison, run through [`runCausalContributionBenchmark`](../../packages/core/src/causal-contribution-benchmark.ts) for this card — see §2. `packages/core/src/causal-promotion-policy-validation.test.ts`.

---

**Per this card's own prohibition, the policy is not modified anywhere below to make a check pass.** Where a check finds a real gap, the gap is the reported result.

## 1. Retrospective replay (§9.1 of CARD-014's own validation requirement)

`R` mechanically classifies evidence per *pack* (the isolated variable `X` in each `Δ(B, B+X)` or `Δ(B−X, B)` comparison), then rolls up all of a pack's classifications across every comparison it appears in via the §6 summary table. This section runs that roll-up by hand over all 19 CARD-010/CARD-012 observations, one row per pack tested as `X`.

### 1.1 Per-pack class tally across all 19 points

| Pack `X` | Comparisons where `X` is the isolated variable | Classes observed |
|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone; CARD-012 v3 removal-audit (X removed) | Misaligned Regression ×2; 1 removal-audit row (see §1.2) |
| `FINTECH_PLATFORM_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone; CARD-012 v3 pairwise (`+SYSTEMS_INFRA→+FINTECH`) | Aligned Contribution ×3 |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone; CARD-012 v3 pairwise ×2 (`+SYSTEMS_INFRA→+OCCUPATIONAL`, `+FINTECH→+OCCUPATIONAL`) | Sub-threshold Movement ×4 |
| `MLOPS_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone; CARD-012 v3 pairwise ×2 (`+SYSTEMS_INFRA→+MLOPS`, `+OCCUPATIONAL→+MLOPS`) | Sub-threshold Movement ×3, No Observable Effect ×1 |
| `DATA_AGENTIC_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone | No Observable Effect ×2 |
| `ADMIN_KNOWLEDGE` | CARD-010 standalone; CARD-012 V2 standalone | No Observable Effect ×2 |
| `DEFAULT_SOFTWARE_KNOWLEDGE` | never — it is the baseline `B` in every comparison, not a tested `X` | not applicable; `R` has nothing to say about the already-promoted baseline pack |

### 1.2 The removal-audit row belongs to `SYSTEMS_INFRA_KNOWLEDGE`'s evidence, not `FINTECH_PLATFORM_KNOWLEDGE`'s — CARD-014 §6 misattributed it

CARD-014 §6 states: *"`FINTECH_PLATFORM_KNOWLEDGE` is the closest at 3 Aligned Contribution instances, but 1 of those 3 (the v3 removal-audit row) was already flagged in CARD-012 as a different causal story."*

Re-checking the actual comparison (CARD-012's table, row: `B+SYSTEMS_INFRA+FINTECH → remove SYSTEMS_INFRA`): the isolated variable in that comparison is `SYSTEMS_INFRA_KNOWLEDGE` (present in one composite, removed in the other) — `FINTECH_PLATFORM_KNOWLEDGE` is held constant in *both* composites being compared. This row is evidence about the effect of removing `SYSTEMS_INFRA_KNOWLEDGE`, not evidence about adding `FINTECH_PLATFORM_KNOWLEDGE`. It should never have been counted toward `FINTECH_PLATFORM_KNOWLEDGE`'s per-pack tally at all — not "counted but flagged as a caveat," simply not `FINTECH_PLATFORM_KNOWLEDGE`'s evidence.

**This is a factual correction to CARD-014's own worked example, not a finding about the policy's mechanics.** `FINTECH_PLATFORM_KNOWLEDGE` has exactly **3 legitimate, independent Aligned Contribution instances** (CARD-010 standalone on OOS, CARD-012 standalone on V2, CARD-012 pairwise on OOS) with zero involvement of the removal-audit row. `SYSTEMS_INFRA_KNOWLEDGE`, in turn, has the removal-audit row as a fourth piece of evidence about *it* — read correctly, "removing `SYSTEMS_INFRA_KNOWLEDGE` produces a ground-truth-aligned improvement" reinforces, rather than complicates, its `VETOED` case: it is independent confirmation that the pack's presence (not just its one directly-observed misaligned transition) is causally responsible for a worse outcome.

### 1.3 Verdicts under `R`, replayed

| Pack `X` | `R`'s verdict (§6 table applied to §1.1) | Matches CARD-011/CARD-012's qualitative judgment? |
|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | **VETOED** (≥1 Misaligned Regression) | ✅ Yes — CARD-011 named it as the class's only member and proposed disqualification; CARD-014 explicitly cites it as the veto's motivating case. |
| `FINTECH_PLATFORM_KNOWLEDGE` | **ELIGIBLE** (3 Aligned Contribution, 0 Misaligned Regression, ≥2 independent comparisons — clears the bar on its own 3 legitimate instances, §1.2) | ⚠️ **Mismatch with CARD-014's own stated expectation** ("not yet `ELIGIBLE`"), but that expectation rested on the misattribution corrected in §1.2. Whether `ELIGIBLE` here is *substantively* the right call is a separate question — see §4. |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | **INCONCLUSIVE** (0 regression, 0 Aligned Contribution, Sub-threshold present) | ✅ Consistent — CARD-011 explicitly declined to say whether Sub-threshold alone should count toward eligibility; `R` treats it as inconclusive rather than guessing either way. |
| `MLOPS_KNOWLEDGE` | **INCONCLUSIVE** (same shape as above) | ✅ Consistent, same reasoning. |
| `DATA_AGENTIC_KNOWLEDGE` | **INCONCLUSIVE** (No Observable Effect only) | ✅ Matches CARD-010's own conclusion verbatim: not evidence of a bad pack, evidence the corpus doesn't exercise its domain. |
| `ADMIN_KNOWLEDGE` | **INCONCLUSIVE** (No Observable Effect only) | ✅ Matches CARD-010's own conclusion verbatim. |

**Retrospective replay result: 5 of 6 packs classify exactly as the prior qualitative literature would expect. The one apparent mismatch (`FINTECH_PLATFORM_KNOWLEDGE`) traces to an arithmetic/attribution error in CARD-014's own worked example, not to a flaw in `R`'s mechanics** — per §9.1's own standard ("a mismatch means R's mechanical rules don't actually encode the qualitative reasoning"), this mismatch does not indict `R`; it corrects CARD-014's prose. See §4 for whether `FINTECH_PLATFORM_KNOWLEDGE` reaching `ELIGIBLE` this early is itself a substantive concern.

## 2. New-evidence stress test (§9.2)

**Comparison run:** `Δ(B+SYSTEMS_INFRA_KNOWLEDGE, B+SYSTEMS_INFRA_KNOWLEDGE+DATA_AGENTIC_KNOWLEDGE)` over `VERDICT_GROUND_TRUTH_DATASET_OOS` — i.e., `DATA_AGENTIC_KNOWLEDGE` added on top of a composite that already contains `SYSTEMS_INFRA_KNOWLEDGE`, rather than added to bare `B`. This exact pairwise position was never run in CARD-010 or CARD-012 — genuinely new evidence relative to the 19 points `R` was designed against.

**Result** (see `packages/core/src/causal-promotion-policy-validation.test.ts`):

```json
{
  "coverageDelta": 0,
  "coverageIncrease": 0,
  "coverageDecrease": 0,
  "verdictTransitionCount": 0,
  "verdictTransitionDirection": {},
  "coincidentGroundTruthAlignment": 0
}
```

**Classification under `R`:** No Observable Effect → contributes to `DATA_AGENTIC_KNOWLEDGE`'s tally as a third `INCONCLUSIVE`-supporting instance, alongside its two prior No Observable Effect results (CARD-010 standalone, CARD-012 V2 standalone). **The stress test reproduces the existing pattern rather than contradicting it** — `DATA_AGENTIC_KNOWLEDGE` remains flat-zero even inside a different composite position, which is itself informative: it strengthens (rather than merely repeats) the "corpus domain gap, not pack defect" reading from CARD-010, since a real interaction effect with `SYSTEMS_INFRA_KNOWLEDGE` would have shown up here if one existed. `R`'s `INCONCLUSIVE` classification does not need to change or be re-argued in light of this new point.

## 3. Adversarial veto check (§9.3)

**Question:** does any pack in the current evidence base carry *both* an Aligned Contribution and a Misaligned Regression signal — the case that would test whether the unconditional veto (CARD-014 §4) is too strict?

**Finding: no such case exists in the current 19+1 observations.** `SYSTEMS_INFRA_KNOWLEDGE` is the only pack with any Misaligned Regression evidence, and per §1.2, its one apparently-positive-looking data point (the removal-audit row) is not evidence of `SYSTEMS_INFRA_KNOWLEDGE` contributing positively when *added* — it is evidence that removing it helps, which is consistent with, not contradictory to, its regression case. No pack currently has a genuine same-pack conflict between the two signal types.

**Since the evidence can't be used to test the veto directly, reason through the scenario it's meant to guard against, without fabricating corpus data (out of scope — this card validates the design, it does not gather new ground-truth items):** suppose a hypothetical pack `Y` produced one Aligned Contribution instance (`consider→apply`, ground-truth-aligned) on one corpus, and one Misaligned Regression instance (`apply→consider`, not aligned) on a *different, unrelated* item in the same or another corpus. Under CARD-014's unconditional-veto rule, `Y` would be `VETOED` outright, with the Aligned Contribution evidence discarded entirely from the decision. Whether a reviewer would agree with that call cannot be settled without a real instance — this is exactly the gap CARD-014 §8 already named as unresolved ("no evidence yet showing whether a genuinely valuable pack could also produce one small, unrelated Misaligned Regression"). **This card cannot close that gap; it can only confirm it remains open and unexercised.** The adversarial check therefore returns **not disconfirmed, not confirmed — untested**, not a pass.

## 4. Is `FINTECH_PLATFORM_KNOWLEDGE` reaching `ELIGIBLE` on replay actually a problem? — the one substantive finding this card reports honestly

§1.3 found `FINTECH_PLATFORM_KNOWLEDGE` mechanically clears `R`'s `ELIGIBLE` bar using 3 legitimate independent-comparison instances. Read at face value this looks like `R` working correctly: 3 confirmations, 0 regressions, exactly the kind of accumulating evidence §6's `≥2 independent comparisons` clause was designed to require before an `ELIGIBLE` verdict.

But CARD-013's own residual-risk statement, made before `R` existed, said explicitly: *"A future calibration built on `n=2–4` risks encoding the specific characteristics of `FINTECH_PLATFORM_KNOWLEDGE` (the majority of the Aligned Contribution examples)... into what looks like a general rule."* **`R`'s very first mechanical replay realizes exactly that named risk**: `FINTECH_PLATFORM_KNOWLEDGE` supplies 3 of the Aligned Contribution class's 4 total members (§1.1 — the 4th, the removal-audit row, isn't its own evidence at all per §1.2) across only two source corpora (OOS, V2) and one pairwise position. "3 independent comparisons" is true by `R`'s literal counting rule, but the three comparisons are not independent *confirmations from different sources* in the sense that made CARD-012's "second real corpus" discipline meaningful — two of the three reuse the same OOS corpus (once standalone, once inside a pairwise composite), and the pack itself has appeared in every comparison round run so far. `R`'s `≥2 independent comparisons` clause counts *comparisons*, not *independent lines of evidence*, and those turn out not to be the same thing once a single pack dominates the available comparison history.

**This is a real, falsifiable gap in `R` as currently specified — not a documentation error, and not fixed by this card.** Per this card's own prohibition against changing the policy to make it pass, the fix (e.g., requiring diversity across corpora specifically, or requiring evidence be gathered from more than one comparison *round*, not just more than one comparison) is left unresolved and unimplemented here.

## 5. Overall verdict

**INSUFFICIENT, not `VALIDATED` outright — with the specific gap named, not a blanket rejection:**

- The ordinal skeleton (§9.4: are the classes the right shape) **holds up**: every class assignment across 19+1 points was mechanical and unambiguous, and the four/six-class structure did not need revision to accommodate the new stress-test point.
- The veto mechanism (§4/§9.3) **validates on the evidence available** (correctly flags `SYSTEMS_INFRA_KNOWLEDGE`, consistent with the prior qualitative read) but **remains untested against the one scenario that would actually stress it** (a same-pack Aligned-Contribution-vs-Misaligned-Regression conflict) — no such case exists yet to test against.
- The `INCONCLUSIVE` handling **validates cleanly**, including under new evidence (§2): `DATA_AGENTIC_KNOWLEDGE`'s third No-Observable-Effect result reinforced rather than contradicted the existing read.
- **The `≥2 independent comparisons` `ELIGIBLE` bar (§6) does not do what CARD-013 needed it to do.** It is satisfied by a single overrepresented pack's repeated appearances rather than by genuinely diverse confirmation, which is the exact failure mode CARD-013's residual-risk note anticipated. This is the one component of `R` this validation card cannot sign off on.

**What this authorizes, and does not:** this finding authorizes a future card whose scope is narrowly to redesign §6's `ELIGIBLE` criterion (e.g., require corpus diversity or comparison-round diversity, not just a raw comparison count) — it does not authorize promoting `FINTECH_PLATFORM_KNOWLEDGE` (or any pack), does not retroactively patch `R` here, and does not conclude the rest of `R` needs rework — the veto and `INCONCLUSIVE` paths validated. That next card's scope should be scoped by, and reference, this document's §4 finding specifically, not a full rewrite of CARD-014.

## Explicitly out of scope for this card

- Changing `R`'s rules to fix the §4 finding.
- Retroactively calibrating `≥2` to a different number.
- Promoting or declaring eligible `FINTECH_PLATFORM_KNOWLEDGE` or any other pack, despite `R`'s literal `ELIGIBLE` output in §1.3.
- Changing `Operational Knowledge Version`.
- Reconciling `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md`.
- Declaring `R` final or definitive in any form.
