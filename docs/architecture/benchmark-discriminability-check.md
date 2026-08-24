# Benchmark Discriminability Check

**Card:** CARD-005
**Verdict: NOT DISCRIMINATIVE.** The isolated-OOS-evaluation methodology used by CARD-002 and CARD-004 does not respond to which knowledge pack is used — not even to the presence or absence of any pattern at all.

---

## What was tested

Four single-pack recognizers, each run in isolation (no `composeKnowledge`) via `runOutOfSampleValidationBenchmark` against the same `VERDICT_GROUND_TRUTH_DATASET_OOS` (Corpus v3, 52 items):

| Pack | Domain | Source of result |
|---|---|---|
| `DEFAULT_SOFTWARE_KNOWLEDGE` | Software (27 patterns) | CARD-002 (reused, not re-run) |
| `SYSTEMS_INFRA_KNOWLEDGE` | Software/infra (different pattern set) | CARD-004 (reused, not re-run) |
| `ADMIN_KNOWLEDGE` | Administration/HR — deliberately unrelated domain | This card |
| `EMPTY` (`patterns: []`) | Negative control — no patterns at all | This card |

Tests: `packages/core/src/knowledge-promotion-benchmark-discriminability.test.ts`.

## Result

**All four are identical:**

| Pack | totalEvaluated | MOR | Reduction | Precision | Confusion matrix (tp/fp/tn/fn) |
|---|---|---|---|---|---|
| `DEFAULT_SOFTWARE_KNOWLEDGE` | 52 | 0% | 69% | 100% | 16/0/36/0 |
| `SYSTEMS_INFRA_KNOWLEDGE` | 52 | 0% | 69% | 100% | 16/0/36/0 |
| `ADMIN_KNOWLEDGE` | 52 | 0% | 69% | 100% | 16/0/36/0 |
| `EMPTY` (no patterns) | 52 | 0% | 69% | 100% | 16/0/36/0 |

An HR/admin-domain pack and a pack with **zero patterns** produce the exact same verdict, on every one of the 52 items, as the software-domain packs. Per the interpretation table this card was authorized under: this is branch (3), the most serious outcome — "EMPTY también igual → problema serio del benchmark/corpus, ni siquiera un pack vacío cambia el veredicto."

## What this means

The three headline metrics (`missedOpportunityRate`, `attentionReduction`, `attentionPrecision`) computed by `runOutOfSampleValidationBenchmark` over Corpus v3, when run with a single isolated pack, **do not measure that pack's contribution at all**. Whatever produces the 16/36 APPLY-or-CONSIDER/SKIP split on this corpus is not sensitive to the market-recognition knowledge pack in this configuration.

**Direct consequence for CARD-002 and CARD-004:** their "eligible per §3" verdicts are true as literal threshold-passes, but the evidence does not actually distinguish `DEFAULT_SOFTWARE_KNOWLEDGE` or `SYSTEMS_INFRA_KNOWLEDGE` from a pack with no knowledge in it at all. The gate did not fail — it never had the power to fail for these two packs, or for any pack, under this exact test shape.

## One structural fact, not a diagnosis

`evaluateOpportunity(jd, profile, recognizer)` (`packages/core/src/opportunity.ts:1064`) does accept and pass through the `recognizer` argument to `extractMarketRequirements` when one is provided — so the isolated-pack wiring is not obviously broken at that entry point. Where exactly in the pipeline the pack's identity stops mattering (something in `runAttentionValidationAtScale`, in how verdicts are derived from the extracted market model, or in how Corpus v3's 52 items are constructed) is **not diagnosed here** — that is out of this card's scope by design (see below).

## Explicitly out of scope for this card

- Diagnosing *why* the benchmark doesn't discriminate.
- Fixing the benchmark, the corpus, or the Decision Engine.
- Promoting or demoting any pack.
- Re-evaluating `DEFAULT_SOFTWARE_KNOWLEDGE` or `SYSTEMS_INFRA_KNOWLEDGE`'s existing "eligible" status (CARD-002/CARD-004 stand as written; this document does not retroactively edit them).
- Evaluating `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, or `DATA_AGENTIC_KNOWLEDGE`.

## What this changes for the sequence going forward

Per the branch this card's own authorization named: **discriminates → continue evaluating packs normally; does not discriminate → stop and fix the methodology first.** The result is the second branch. Continuing to CARD-006/007/... with `FINTECH_PLATFORM_KNOWLEDGE` etc. using this same isolated-OOS methodology would produce more "eligible" verdicts of the same unproven kind.
