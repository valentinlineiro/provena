# Post-Promotion Functional Validation

**Status:** Validation only. Does not modify `PROMOTED_OPERATIONAL_KNOWLEDGE`, any pack, `composeKnowledge`, `evaluateOpportunity`, or the causal candidate promotion policy.
**Card:** CARD-024
**Input:** CARD-023 (governance→runtime consistency, validated), `packages/core/src/promoted-knowledge.ts`.
**Test:** `packages/core/src/post-promotion-functional-validation.test.ts`.

---

## 1. The question

> Does Provena keep functioning correctly now that production consumes the knowledge that actually holds authority (`PROMOTED_OPERATIONAL_KNOWLEDGE`)?

This validates the product's functional properties, not the causal promotion policy or the promotion mechanism — those are already closed (CARD-014–018, CARD-023).

## 2. Methodology, and one interpretation made explicit

**Corpus:** `VERDICT_GROUND_TRUTH_DATASET_OOS` (52 items, "Corpus v3") — the same corpus the prior functional baseline (`attention-validation-oos.test.ts`) used.

**PRE:** `DEFAULT_SOFTWARE_KNOWLEDGE` alone. The card describes PRE as "runtime with the knowledge effective before CARD-022," but production actually ran two different compositions before CARD-022 (a 4-pack composite at the ingestion endpoints, `DEFAULT_SOFTWARE_KNOWLEDGE` alone at the interactive default — see `governance-runtime-knowledge-contract.md` §1). Neither is unambiguously "the" prior state. `DEFAULT_SOFTWARE_KNOWLEDGE` alone was chosen because it is literally what the prior functional baseline benchmarked: `evaluateOpportunity` falls back to it when no recognizer is passed, which is exactly how `attention-validation-oos.test.ts` invoked the benchmark. This keeps PRE identical to the instrument that actually established the baseline this card is asked to reproduce, rather than a production configuration that was never benchmarked as "the baseline." Named here rather than picked silently.

**POST:** `composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` = `DEFAULT_SOFTWARE_KNOWLEDGE` + `FINTECH_PLATFORM_KNOWLEDGE`. This isolates exactly the FINTECH delta.

**Instrument:** `runCausalContributionBenchmark(corpus, profile, [DEFAULT_SOFTWARE_KNOWLEDGE], PROMOTED_OPERATIONAL_KNOWLEDGE)` — already built for a per-item PRE/POST comparison on this exact corpus shape, so it was reused rather than rebuilt. It reports, per item, `coverage` (= Recognition Coverage) and `verdict`, plus aggregate guardrails (`AttentionValidationMetrics`, including the `tp/fp/tn/fn` matrix, Attention Reduction, Attention Precision, Missed Opportunity Rate).

**Qualifier Preservation / Qualifier Density — no existing instrument.** Neither term maps to any computed metric in the codebase (`grep -rn qualifier packages/core/src` finds only the `qualifiers?` data field on `MarketRequirement`, no aggregate). Rather than skip it silently, a direct proxy was computed: the fraction of extracted requirements (per recognizer, per item, summed over the corpus) that carry at least one qualifier. This is a reasonable reading of the term given what the codebase actually tracks, but it is a proxy invented for this card, not a pre-existing baseline metric — reported as such.

## 3. Results

### 3.1 Guardrails (aggregate, 52 items)

| Metric | PRE | POST | Δ |
|---|---|---|---|
| TP | 16 | 16 | 0 |
| FP | 0 | 0 | 0 |
| TN | 36 | 36 | 0 |
| FN | 0 | 0 | 0 |
| Attention Reduction | 0.69 | 0.69 | 0 |
| Attention Precision | 1.0 | 1.0 | 0 |
| Missed Opportunity Rate | 0 | 0 | 0 |

**No regression anywhere in the guardrail metrics.** FP, FN, Attention Reduction, Attention Precision, and MOR are byte-identical between PRE and POST.

### 3.2 Verdict transitions

Exactly **1 transition** out of 52 items:

| Item | Title | Ground truth | From | To | Aligned |
|---|---|---|---|---|---|
| `oos-10` | Staff Payment Engine Infrastructure Engineer | WORTH_ATTENTION | consider | apply | yes |

`coincidentGroundTruthAlignment: 1` (the one transition that occurred moves toward, not away from, the item's ground truth).

### 3.3 Attribution

`oos-10`'s JD contains "double-entry ledger architecture," which matches `FINTECH_PLATFORM_KNOWLEDGE`'s `Financial Ledgers & Double-Entry Accounting` concept directly. This is the expected FINTECH effect, cleanly localized to the one item where it should fire, with no effect anywhere else in the 52-item corpus.

Per the card's three-way classification:

1. **Expected by FINTECH:** `oos-10` — the one transition, correctly attributed.
2. **Functional regression:** none found.
3. **Neutral / no observable effect:** the other 51 items — identical coverage and verdict PRE vs. POST.

### 3.4 Qualifier density (proxy metric, see §2)

| | PRE | POST |
|---|---|---|
| Requirements extracted | 16 | 17 |
| Requirements with ≥1 qualifier | 10 | 10 |
| Density | 0.625 | 0.588 |

The one additional requirement extracted at `oos-10` (the new FINTECH-matched requirement) dilutes the density slightly since it doesn't itself carry a qualifier; the absolute count of qualifier-bearing requirements is unchanged. This is consistent with the single expected FINTECH-attributable change, not a broad degradation in qualifier extraction — density stays well above the point where it would signal a collapse.

## 4. Evidence-sufficiency check against the card's own criteria

- POST reproduces PRE's guardrail properties: **yes**, identical.
- No unexplained regression in FP/FN/MOR/Attention Precision: **yes**, none present.
- FINTECH-attributable change localized to item/verdict level: **yes**, `oos-10` only.
- Aggregate differences explained by real recognition change, not harness artifact: **yes** — the one transition is traced to a specific matched concept, not an anomaly.
- Reproducible with raw data: **yes** — `packages/core/src/post-promotion-functional-validation.test.ts` re-runs the exact comparison; this document's tables are its output.

## 5. Verdict

**FUNCTIONALLY VALIDATED.** No regression in any instrumented guardrail metric. The one verdict change is precisely the FINTECH-attributable effect promotion was meant to produce, and it moves toward the item's own ground truth. Qualifier density (proxy) shows no collapse.

## Explicitly out of scope for this card

- Modifying `PROMOTED_OPERATIONAL_KNOWLEDGE`, any pack, or `composeKnowledge`/`evaluateOpportunity`.
- Modifying or re-deriving the causal candidate promotion policy.
- Promoting or vetoing any pack.
- Establishing a new numeric threshold — the criteria used are the ones already established for the prior OOS functional validation.
- Building a permanent Qualifier Preservation/Density instrument beyond the proxy computed here for this comparison.
