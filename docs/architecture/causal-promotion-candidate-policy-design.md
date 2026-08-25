# Causal Promotion Candidate Policy — Design

**Status:** Design only. Not implemented, not applied to any pack, not validated. **This document proposes a candidate policy, not a calibrated criterion** — every threshold-shaped choice in it (§4, §6) is a design hypothesis awaiting the validation card in §9, not a number derived from the evidence distribution. See the terminology note below.
**Card:** CARD-014
**Authorized by:** [`causal-evidence-sufficiency-decision.md`](causal-evidence-sufficiency-decision.md) (CARD-013) — "sufficient to proceed to designing a calibration rule," not to calibrate numbers against the current n or to promote anything.

## Terminology note (PR #16 review)

This document originally called `R` a "calibration rule." Review correctly flagged that name as misleading: `R` contains two threshold-shaped choices (§4's unconditional veto, §6's `≥2 independent comparisons` bar) that are policy decisions dressed as thresholds, not values fit to the evidence distribution — the same conceptual move as a numeric threshold even though both are small integers rather than a continuous score. Calling the whole thing a "calibration rule" understated that these are still unvalidated hypotheses. `R` is renamed **candidate promotion policy** throughout, and §4/§6's two threshold-shaped choices are each labeled `[DESIGN CHOICE — HYPOTHESIS, NOT VALIDATED]` at the point they're introduced, so neither can be mistaken for a calibrated criterion by a future reader skimming the document.
**Input evidence:** [`causal-evidence-survey.md`](causal-evidence-survey.md) (CARD-010, 7 points), [`causal-signal-classification.md`](causal-signal-classification.md) (CARD-011, 4-class taxonomy), [`causal-evidence-survey-round-2.md`](causal-evidence-survey-round-2.md) (CARD-012, 19 points total).
**Instrument:** [`runCausalContributionBenchmark`](../../packages/core/src/causal-contribution-benchmark.ts) (CARD-009).

---

## 1. Shape of the policy: ordinal first, not scalar

The 19 observations gathered so far never produced a single "goodness score" — they produced a *class* per comparison (Aligned Contribution / Misaligned Regression / Sub-threshold Movement / No Observable Effect), and the two promotion-relevant classes sit at `n=4` and `n=2`. Fitting a scalar threshold (`score ≥ 0.73 → promote`) on n this small would repeat the CARD-001 mistake this whole lineage exists to avoid: a number that looks precise because it is machine-checked, not because it is justified by a distribution.

**Candidate policy `R` is therefore ordinal, not numeric**, over the same four classes CARD-011 defined, plus the two structurally-unobserved classes CARD-012 named:

```text
evidence (Δ metrics for one pack X, one corpus)
        │
        ▼
   class assignment  ──────────────────  Aligned Contribution
   (mechanical, from                     Misaligned Regression
    the CARD-011 definitions,            Sub-threshold Movement
    already implemented by the           No Observable Effect
    survey docs — not new logic)         Misaligned Sub-threshold Movement (§4)
                                          Aligned Regression (§4)
        │
        ▼
   promotion verdict  ─────────────────  ELIGIBLE / VETOED / INSUFFICIENT / INCONCLUSIVE
```

A numeric layer (e.g. "how many Aligned Contribution instances are required," or a magnitude floor on `coverageIncrease`) is a legitimate *future* refinement of the ordinal policy below, once more evidence exists — see §7. This design does not propose one now.

## 2. Necessary signals (§2 requirement)

For a pack `X` to be considered for promotion at all, the benchmark run of `Δ(B, B+X)` over the OOS corpus must produce:

- At least one class assignment other than **No Observable Effect** — i.e. the pack must move *something* (`coverageIncrease`, `coverageDecrease`, or a verdict transition) on the corpus. A pack indistinguishable from `EMPTY` has nothing for a promotion rule to reason about.

This is necessary, not sufficient — see §3.

## 3. Sufficient signals (§3 requirement)

- **At least one instance of Aligned Contribution, and zero instances of Misaligned Regression**, across every comparison run for `X` in the evidence set (§5 covers what "the evidence set" means per pack, since a pack can appear in more than one comparison — e.g. `SYSTEMS_INFRA_KNOWLEDGE` was tested both standalone and inside a composite).
- Sub-threshold Movement alone is **not** sufficient (per CARD-011 §2's proposed semantics, carried forward unchanged: it is evidence the pack does something, not evidence it changes an outcome).
- No Observable Effect alone is **not** sufficient and is not evidence against `X` either (§6).

## 4. What constitutes a veto / regression (§4 requirement)

**`[DESIGN CHOICE — HYPOTHESIS, NOT VALIDATED]` Any single instance of Misaligned Regression is an unconditional veto**, regardless of how many Aligned Contribution instances the same pack also produced. This is a policy decision, not a value calibrated from the evidence distribution — it follows CARD-011 §2's proposed semantics directly ("Misaligned Regression should disqualify a pack, or at minimum require it to be weighed against any positive evidence") and this design chooses the stronger of the two options CARD-011 left open: weighing a regression against positive evidence would require a magnitude/frequency comparison this design has explicitly deferred as premature (§1). An unconditional veto needs no such comparison and cannot be gamed by accumulating unrelated positive instances to outvote a real regression — `SYSTEMS_INFRA_KNOWLEDGE`'s n=2 Misaligned Regression evidence is exactly the case this guards: 1 instance standalone (CARD-010) and 3 transitions in one comparison (CARD-012's V2 round), the largest transition count of any comparison in the whole 19-point survey. §9's adversarial veto check is where this hypothesis gets tested against a real conflicting-signal case, not here.

**Rationale for choosing veto over weighing, stated explicitly since CARD-011 left it open:** a promotion criterion that lets enough Sub-threshold or Aligned instances outvote a confirmed regression is a criterion a large-enough corpus of *unrelated* good behavior could paper over a real harm with — the opposite of what "causal" is meant to guarantee here.

### The two n=0 classes (required by this card's scope)

- **Misaligned Sub-threshold Movement** (coverage moves in the *wrong* direction without crossing a verdict transition) — if observed, this is treated as a **soft negative signal, not a veto**: it shows the pack's effect trends the wrong way on some item, but with no verdict actually moved, there is no confirmed harmful decision to point to (unlike Misaligned Regression, which by definition crossed a verdict transition). It counts against eligibility in the same way No Observable Effect counts as inconclusive — it does not add to the "at least one Aligned Contribution" requirement in §3, and does not itself veto, but it must be logged and reduces confidence in a borderline eligibility case (see §6, "inconclusive" handling).
- **Aligned Regression** (a verdict transition that is ground-truth-aligned but coverage decreased — e.g. correctly moving a `NOT_WORTH` item from `apply` down to `consider`) — this is the one class that is a **positive signal despite the "Regression" name**: a correct downward move is not causal harm, it is the mechanism working as intended in the opposite direction from Aligned Contribution's usual upward case. Treated identically to Aligned Contribution for §3's sufficiency test.

Both remain unobserved in all 19 points (CARD-012's structural finding: no pack in the current 6-pack, 2-corpus evidence base has ever moved a `NOT_WORTH` item). This design specifies their treatment on paper, per this card's explicit scope, without claiming the specification is validated against any real instance — see §7.

## 5. How inconclusive signals are treated (§4/§6 requirement, "what counts as inconclusive")

**Inconclusive = No Observable Effect on every comparison run for `X`, or Sub-threshold-Movement-only with no Aligned Contribution.** Per CARD-010's finding (`DATA_AGENTIC_KNOWLEDGE`/`ADMIN_KNOWLEDGE` indistinguishable from `EMPTY` on Corpus v3), this rule explicitly does **not** collapse "inconclusive" into "reject." An inconclusive verdict means: **this corpus cannot currently evaluate this pack**, not "this pack is bad." The rule's output for this case is a fourth verdict class, `INCONCLUSIVE`, distinct from both `ELIGIBLE` and `VETOED` — it defers the decision rather than forcing it, and names the missing evidence (a corpus exercising the pack's domain) as the concrete next step, matching CARD-010 §'s own conclusion.

A pack with mixed evidence across multiple comparisons (e.g. Sub-threshold Movement in one run, No Observable Effect in another, no Aligned Contribution or Misaligned Regression anywhere) is also `INCONCLUSIVE`, not `INSUFFICIENT` — see §3/§6 boundary below.

`INSUFFICIENT` (distinct from `INCONCLUSIVE`) applies when a pack clears the necessary-signal bar (§2) and shows at least one Aligned Contribution, but that single instance is the pack's *only* signal across every comparison run — i.e. the evidence exists but is too thin (`n=1` for that pack specifically) to treat as more than a single untested example, per CARD-011 §3's own reasoning about why `n=1` could not calibrate a threshold. `INSUFFICIENT` is a call to gather more per-pack evidence (more corpora, more composite positions), not a rejection.

## 6. What constitutes veto vs. eligible vs. insufficient vs. inconclusive — summary table

| Evidence for pack `X` (across all runs where `X` is the isolated variable) | Verdict |
|---|---|
| ≥1 Misaligned Regression (any n) | **VETOED** |
| 0 Misaligned Regression, ≥2 Aligned Contribution / Aligned Regression combined, across ≥2 independent comparisons | **ELIGIBLE** |
| 0 Misaligned Regression, exactly 1 Aligned Contribution / Aligned Regression total | **INSUFFICIENT** |
| 0 Misaligned Regression, 0 Aligned Contribution / Aligned Regression, ≥1 Sub-threshold Movement or Misaligned Sub-threshold Movement | **INCONCLUSIVE** |
| 0 Misaligned Regression, only No Observable Effect on every run | **INCONCLUSIVE** |

**`[DESIGN CHOICE — HYPOTHESIS, NOT VALIDATED]`** The `≥2 independent comparisons` clause in the `ELIGIBLE` row is deliberate but explicitly not calibrated: it prevents one pack/one-corpus/one-run from ever reaching `ELIGIBLE` outright, forcing at minimum the same "second real source" discipline CARD-012 already applied when it doubled the evidence base. It is a policy choice about how much independent confirmation to require, not a number derived from the evidence — §8 states directly that `3` would be just as defensible. No pack in the current 19-point survey meets this bar yet — `FINTECH_PLATFORM_KNOWLEDGE` is the closest at 3 Aligned Contribution instances, but 1 of those 3 (the v3 removal-audit row) was already flagged in CARD-012 as a different causal story (removing a *different*, regression-causing pack) and should not be counted as an independent confirmation of `FINTECH_PLATFORM_KNOWLEDGE`'s own contribution without that caveat attached.

## 7. Is the policy numeric, ordinal, or hybrid (§5 requirement) — answered

**Ordinal**, per §1. No scalar score, no weighted sum, no probability. The only place anything resembling a number appears is the `≥2 independent comparisons` count in §6 — a count of *evidence instances*, not a score computed from the causal metrics — chosen specifically because it is auditable by inspection (count rows in a table) rather than requiring a magnitude judgment call this evidence base cannot yet support.

## 8. What uncertainty remains unresolved (§6 requirement)

Stated explicitly, not smoothed over:

- **The veto-vs-weigh choice in §4 is itself unvalidated.** It is the more conservative of the two options CARD-011 left open, chosen for the stated auditability reason — but there is no evidence yet showing whether a genuinely valuable pack could also produce one small, unrelated Misaligned Regression on an unrelated item, in which case an unconditional veto could be too strict. This design accepts that risk rather than building a magnitude carve-out with no evidence to calibrate it against.
- **The `≥2 independent comparisons` threshold in §6 is arbitrary in the same sense CARD-013's residual risk names**: it is chosen to be *not one*, not derived from a distribution. It could just as defensibly be 3. This design picks the smallest number that isn't a single point, deliberately not more, since choosing a higher number now with no basis would itself be an unjustified calibration.
- **The two n=0 classes' treatment (§4) is entirely design-time reasoning, never exercised against a real instance.** If a real Misaligned Sub-threshold Movement or Aligned Regression instance is later observed, the "soft negative, not veto" / "counts as positive" treatment proposed here should be re-examined against that concrete case, not assumed correct because it reads as internally consistent on paper.
- **`FINTECH_PLATFORM_KNOWLEDGE`'s removal-audit-row double-counting risk (§6)** is flagged but not mechanically prevented — the summary table's counting rule relies on a human/reviewer noticing and excluding it, not on the class-assignment step itself distinguishing "new-pack addition" from "harmful-pack removal" causal stories. A future implementation of `R` would need to either tag comparisons by shape (addition vs. removal-audit) or treat this as a known gap.
- **Whether `INSUFFICIENT` and `INCONCLUSIVE` should ever converge into the same non-promotion outcome** for a downstream consumer that just needs a boolean "promote now or not" is left open — this design keeps them distinct because they call for different next actions (more comparisons of the same pack vs. a different corpus), but a future card wiring `R` into an actual promotion decision will need to decide whether that distinction survives contact with a real workflow.

## 9. How the policy must be validated before it can be used for promotion (§7 requirement)

This card designs candidate policy `R`. It does not conclude `R` is valid. Validation is out of scope here and must happen as a separate, later card, at minimum covering:

1. **Retrospective replay**: run `R` against all 19 existing observations (CARD-010 + CARD-012) and confirm every resulting verdict matches the qualitative judgment CARD-011/CARD-012 already reached by hand for that comparison (e.g. `SYSTEMS_INFRA_KNOWLEDGE` → `VETOED`, `FINTECH_PLATFORM_KNOWLEDGE` → not yet `ELIGIBLE` under the `≥2 independent comparisons` clause once the removal-audit row is excluded per §6's caveat). A mismatch here means `R`'s mechanical rules don't actually encode the qualitative reasoning they claim to.
2. **New-evidence stress test**: apply `R` to at least one comparison gathered *after* this design is written (not from the 19-point set it was designed against), to check `R` doesn't only fit the data it was reasoned from.
3. **Adversarial check on the veto rule (§4/§8)**: deliberately look for, or construct evidence for, a case where a pack has both Aligned Contribution and Misaligned Regression signals, to see whether the unconditional-veto choice produces a verdict a reviewer would actually agree with, or whether it needs the weighing alternative CARD-011 also proposed.
4. **Explicit sign-off that `R`'s ordinal classes (§6 table) are the right shape** before any future card is authorized to attach a numeric refinement (§1) on top of it — validating the ordinal skeleton first, refining it second, never skipping to a number without the skeleton being checked.

None of the above is performed by this card. This document is the input to that future validation card, not a substitute for it.

## Explicitly out of scope for this card

- Implementing `R` in code.
- Promoting or declaring eligible any pack (including running `R` by hand against the 19 existing points to see what it would say — that is validation, §9, deliberately deferred).
- Changing `Operational Knowledge Version`.
- Modifying `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md`.
- Choosing any threshold value (including the `≥2 independent comparisons` count in §6) because it happens to pass or fail a specific pack — every number in this design is justified by an auditability/conservatism argument stated in §7/§8, not by its effect on `FINTECH_PLATFORM_KNOWLEDGE` or any other specific pack.
- Treating `n=2–4` as representative evidence — §8 names this as unresolved, it is not resolved by this document.
