# Eligibility Verdict: `SYSTEMS_INFRA_KNOWLEDGE`

**Contract:** [`knowledge-promotion-contract.md`](knowledge-promotion-contract.md)
**Card:** CARD-004
**Status:** Eligible per §3. **Not promoted** — this document records the verdict only; `Operational Knowledge Version` stays at `1` (`DEFAULT_SOFTWARE_KNOWLEDGE` only) and production is unchanged.

---

## What was tested

`SYSTEMS_INFRA_KNOWLEDGE` (`packages/core/src/domain-knowledge.ts`) run **in isolation** — no `composeKnowledge(...)` with any other pack — against `VERDICT_GROUND_TRUTH_DATASET_OOS` (Corpus v3), the same corpus used by Step 10 and by CARD-002's `DEFAULT_SOFTWARE_KNOWLEDGE` evaluation.

Test: `packages/core/src/knowledge-promotion-eligibility-systems-infra.test.ts`.

## Result

| Metric | Contract §3 threshold | Isolated result |
|---|---|---|
| Corpus scale | ≥ 50 | 52 |
| MOR | ≤ 5% (0% preferred) | **0%** |
| Attention Reduction | ≥ 50% | **69%** |
| Attention Precision | ≥ 75% | **100%** |

All three §3 thresholds are met. Per §2, `SYSTEMS_INFRA_KNOWLEDGE` is **eligible** for `Operational Knowledge Version 1`.

## Caveat — stronger this time, not just a repeat note

CARD-002 flagged, as a single-instance observation, that `DEFAULT_SOFTWARE_KNOWLEDGE` isolated produced metrics identical to the full composite. This card's result is **bit-for-bit identical** to CARD-002's — same `totalEvaluated: 52`, same confusion matrix (`tp:16, fp:0, tn:36, fn:0`), same three headline metrics — despite `SYSTEMS_INFRA_KNOWLEDGE` and `DEFAULT_SOFTWARE_KNOWLEDGE` being different pattern sets over different concepts.

This is now a **second occurrence** of the same pattern, not a one-off. Two independent single-pack recognizers producing identical aggregate outcomes on the same 52-item corpus is a real signal that these three metrics, on this corpus, may not be differentiating *which* pack is used at all. This card does not investigate why (out of scope, same boundary as CARD-002), but it is no longer honest to file it as a minor footnote:

- It could mean Corpus v3's ground-truth split is dominated by a signal upstream of the recognizer (e.g. profile-level fit) that swamps whatever the specific pack contributes.
- It could mean the per-pack isolated-evaluation methodology itself — evaluate one pack alone, on this corpus, against these three metrics — is not actually capable of discriminating between eligible and ineligible packs, which would undercut the premise of running CARD-005/006/... the same way.

**Recommendation for the next authority decision, not acted on here:** before running the remaining packs (`FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE`) through the same isolated-OOS methodology, it may be worth checking whether a *third* pack also reproduces this exact result — that would confirm the methodology isn't discriminating, rather than each card individually noting "still identical" without anyone deciding what that means.

## Explicitly out of scope for this card

- Promoting `SYSTEMS_INFRA_KNOWLEDGE` into `Operational Knowledge Version 1`.
- Incrementing `Operational Knowledge Version`.
- Evaluating `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, or `ADMIN_KNOWLEDGE` in isolation.
- Investigating why isolated single-pack results are identical across packs (the caveat above).
- Reconciling production wiring.
