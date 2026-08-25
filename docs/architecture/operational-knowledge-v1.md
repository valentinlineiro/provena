# Operational Knowledge v1 — Promotion Record

**Status:** Promoted. `Operational Knowledge Version: 0 → 1` (original promotion). A second pack was added under a different eligibility mechanism — see §"Second promotion" below. Whether this makes the bundle "v1 with 2 packs" or should be renumbered is an open documentary-versioning question, deliberately not resolved here (see that section).
**Contract:** [`knowledge-promotion-contract.md`](knowledge-promotion-contract.md) (CARD-001)
**Evidence:** [`knowledge-promotion-eligibility-default-software.md`](knowledge-promotion-eligibility-default-software.md) (CARD-002)
**Card:** CARD-003

---

## What is promoted

`Operational Knowledge Version 1` (original scope) consists of exactly one pack:

- **`DEFAULT_SOFTWARE_KNOWLEDGE`** (`packages/core/src/default-knowledge.ts`)

This is the only pack that has cleared the contract's §3 gate in isolation, per CARD-002's evaluation on Corpus v3 OOS (52 items, MOR 0%, reduction 69%, precision 100% — all against the required thresholds MOR ≤5%, reduction ≥50%, precision ≥75%).

A second pack, `FINTECH_PLATFORM_KNOWLEDGE`, was subsequently promoted via a different mechanism — see §"Second promotion (`FINTECH_PLATFORM_KNOWLEDGE`)" below.

**Not promoted:** `SYSTEMS_INFRA_KNOWLEDGE` (evaluated and `VETOED` — see below), `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` — none of these has cleared either eligibility mechanism on record.

## What this promotion is, and is not

This is a **governance record**, not a code or behavior change:

- No file under `packages/core/src` or `packages/provena-web/src` was modified by this card.
- The Decision Engine (`evaluateOpportunity`) is untouched.
- No regression suite was wired to enforce this composition going forward — that is deferred to a later card (see CARD-001 §5).

## Important gap this promotion does not close

`project-status.md`'s own definition of `Operational Knowledge Version` states it "represents the promoted operational knowledge consumed by the decision engine in production." That is not literally true today, and this card does not make it true:

- Provena's continuous market-ingestion pipeline (`packages/provena-web/src/index.ts`, the Cron/board-sync path that populates the Attention Inbox) hardcodes `composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)` — three packs with no OOS evidence on record, none of which are part of this promotion.
- The interactive single-URL evaluation endpoint in the same file defaults to `DEFAULT_SOFTWARE_KNOWLEDGE` alone (matching this promotion) but supports switching to the same untested 4-pack composite via `knowledgeMode`.
- The packs that **do** have frozen OOS/adversarial evidence (`SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE` — used throughout `attention-validation-h8.test.ts` / `attention-validation-step10.test.ts`) are not wired into production at all, anywhere.

So `Operational Knowledge Version 1` should currently be read as "the governance-approved knowledge baseline," not as "what production runs." Reconciling the two — making production consume exactly the promoted set — is explicitly out of scope here (CARD-001 §5, item 3) and needs its own card.

## Explicitly out of scope for this card

- Promoting any pack other than `DEFAULT_SOFTWARE_KNOWLEDGE`.
- Changing what `packages/provena-web/src/index.ts` actually composes at runtime.
- Building the permanent regression suite (Corpus v1/v2/v3 OOS + MOR guardrail) as a CI gate.
- Evaluating `SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, or `ADMIN_KNOWLEDGE` in isolation.

---

## Second promotion (`FINTECH_PLATFORM_KNOWLEDGE`)

**Status:** Promoted.
**Card:** CARD-019 (operator decision: **PROMOTE**).
**Mechanism:** the causal-contribution candidate promotion policy — a different eligibility mechanism from the §3 isolated-benchmark gate that promoted `DEFAULT_SOFTWARE_KNOWLEDGE` above. The original §3 mechanism was found structurally blind to any knowledge pack's actual causal effect (CARD-007) and was not patched but redesigned end-to-end (CARD-006 → REDESIGN decision).

**Full lineage, in order:**

1. CARD-006 — decided to redesign, not eliminate, the promotion mechanism.
2. CARD-007 — diagnosed the root cause of the old mechanism's blindness.
3. CARD-008 — designed the causal-contribution (Δ) benchmark.
4. CARD-009 — implemented `runCausalContributionBenchmark`.
5. CARD-010 — gathered the first 7 evidence points across all available packs (no threshold).
6. CARD-011 — classified the evidence into a 4-class taxonomy (Aligned Contribution / Misaligned Regression / Sub-threshold Movement / No Observable Effect); found `n=1` insufficient to calibrate.
7. CARD-012 — gathered 12 more discriminative points (19 total); found `n=2–4` still thin, deferred the sufficiency judgment.
8. CARD-013 — operator decision: evidence **sufficient** to proceed to designing a calibration rule (not to calibrate yet).
9. CARD-014 — designed the candidate promotion policy `R` (ordinal, not scalar; unconditional veto on Misaligned Regression).
10. CARD-015 — validated `R`; found the original `≥2 independent comparisons` `ELIGIBLE` clause satisfied by a single overrepresented pack's repeated appearances — `INSUFFICIENT`, gap named, not fixed.
11. CARD-016 — redesigned the `ELIGIBLE` clause to `≥2 distinct corpora`, closing the gap CARD-015 found.
12. CARD-017 — validated the redesigned clause; `VALIDATED` for its logic, with an honestly-named limit (only 2 real corpora exist, so the rule is not yet stress-tested beyond that floor).
13. CARD-018 — validated the complete policy (taxonomy + veto + redesigned `ELIGIBLE` clause) end to end; produced the full replay: `FINTECH_PLATFORM_KNOWLEDGE → ELIGIBLE`, `SYSTEMS_INFRA_KNOWLEDGE → VETOED`, all other tested packs `INCONCLUSIVE`. Re-confirmed the adversarial-veto case (a pack with both Aligned Contribution and Misaligned Regression) does not exist in the real evidence — left `UNTESTED`, not fabricated.
14. CARD-019 (this promotion) — operator reviewed CARD-018's `ELIGIBLE` verdict and the stated caveats, and decided **PROMOTE**.

**Evidence supporting `ELIGIBLE`:** 3 Aligned Contribution instances across 2 distinct corpora (`VERDICT_GROUND_TRUTH_DATASET_OOS` and `VERDICT_GROUND_TRUTH_DATASET_V2`), 0 Misaligned Regression instances anywhere in the 20-observation evidence base (CARD-018 §1).

**Limitation carried forward with this promotion, stated explicitly, not smoothed over:** the candidate promotion policy's Misaligned Regression veto has never been tested against a real case where a pack shows both positive (Aligned Contribution) and negative (Misaligned Regression) signals simultaneously — no such pack exists in the current evidence (CARD-015 §3, re-confirmed CARD-018 §1). `FINTECH_PLATFORM_KNOWLEDGE` itself is not such a case — it has zero Misaligned Regression instances in any comparison — so this limitation does not cast direct doubt on `FINTECH_PLATFORM_KNOWLEDGE`'s own verdict. It remains an open limit on the policy's general trustworthiness for any *future* pack that might present mixed evidence, and should be carried forward as a named caveat in any future promotion decision made under this same mechanism.

**What this promotion is, and is not** (same discipline as the original promotion above): a governance record only. No file under `packages/core/src` or `packages/provena-web/src` is modified by this card. `evaluateOpportunity`, `composeKnowledge`, and production's actual knowledge composite in `packages/provena-web/src/index.ts` are all untouched — the same production/promoted-set divergence already documented above for `DEFAULT_SOFTWARE_KNOWLEDGE` now also applies to `FINTECH_PLATFORM_KNOWLEDGE`.

### Explicitly out of scope for this promotion (CARD-019)

- Promoting `SYSTEMS_INFRA_KNOWLEDGE` (`VETOED`) or any `INCONCLUSIVE` pack (`OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE`).
- Changing the candidate promotion policy, the veto, or the `≥2 distinct corpora` criterion.
- Resolving the untested adversarial-veto case with synthetic evidence.
- Resolving the `Operational Knowledge Version` numbering question this second promotion raises (still "v1," now with 2 packs, vs. a new "v2") — left open, per §"Status" above.
- Reconciling the `knowledge-promotion-contract.md` "currently 0" drift, or `roadmap.md`/`project-status.md` — deferred to a dedicated documentation-reconciliation card.
- Changing what `packages/provena-web/src/index.ts` actually composes at runtime.
