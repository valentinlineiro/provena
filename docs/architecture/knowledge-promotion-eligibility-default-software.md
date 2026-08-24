# Eligibility Verdict: `DEFAULT_SOFTWARE_KNOWLEDGE`

**Contract:** [`knowledge-promotion-contract.md`](knowledge-promotion-contract.md)
**Card:** CARD-002
**Status:** Eligible per §3. **Not promoted** — this document records the verdict only; `Operational Knowledge Version` stays at `0` and production is unchanged.

---

## What was tested

`DEFAULT_SOFTWARE_KNOWLEDGE` (`packages/core/src/default-knowledge.ts`) run **in isolation** — no `composeKnowledge(...)` with `SYSTEMS_INFRA_KNOWLEDGE` / `FINTECH_PLATFORM_KNOWLEDGE` / `OCCUPATIONAL_CONTEXT_KNOWLEDGE` — against `VERDICT_GROUND_TRUTH_DATASET_OOS` (Corpus v3), the same out-of-sample corpus used by the frozen Step 10 benchmark. This is the evaluation the contract's §2 required and that no existing frozen benchmark had run: every prior OOS/adversarial test exercised this pack only as part of the full composite.

Test: `packages/core/src/knowledge-promotion-eligibility-default-software.test.ts`.

## Result

| Metric | Contract §3 threshold | Isolated result | Composed result (Step 10, for reference) |
|---|---|---|---|
| Corpus scale | ≥ 50 | 52 | 52 |
| MOR | ≤ 5% (0% preferred) | **0%** | 0% |
| Attention Reduction | ≥ 50% | **69%** | 69% |
| Attention Precision | ≥ 75% | **100%** | 100% |

All three §3 thresholds are met. Per §2, `DEFAULT_SOFTWARE_KNOWLEDGE` is **eligible** for `Operational Knowledge Version 1`.

## Caveat — read before treating this as strong evidence

The isolated result is **identical** to the composed result. That means, on this specific OOS corpus, `SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, and `OCCUPATIONAL_CONTEXT_KNOWLEDGE` changed none of the three headline metrics when added on top of `DEFAULT_SOFTWARE_KNOWLEDGE`. Two readings are both consistent with this data, and this card does not distinguish between them:

1. `DEFAULT_SOFTWARE_KNOWLEDGE` is genuinely sufficient for Corpus v3 — the specialized packs' contribution shows up elsewhere (finer-grained requirement/qualifier extraction) but not in these three aggregate metrics.
2. Corpus v3 (52 items) does not contain enough items in the Systems/Fintech/Occupational-context territory to differentiate the composed pack from the base pack — i.e. the corpus under-exercises exactly the packs it would need to distinguish.

This eligibility verdict is only a §3 pass/fail against the metrics the contract names. It is not a claim that `DEFAULT_SOFTWARE_KNOWLEDGE` is "as good as" the composite, and it is not evidence either way about the other three packs' own eligibility — each needs its own isolated evaluation against §3 before any promotion decision.

## Explicitly out of scope for this card

- Promoting `DEFAULT_SOFTWARE_KNOWLEDGE` (or any pack) into `Operational Knowledge Version 1`.
- Incrementing `Operational Knowledge Version`.
- Evaluating `SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, or `OCCUPATIONAL_CONTEXT_KNOWLEDGE` in isolation.
- Investigating the caveat above (whether Corpus v3 under-exercises the specialized packs).
