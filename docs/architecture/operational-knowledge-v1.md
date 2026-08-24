# Operational Knowledge v1 — Promotion Record

**Status:** Promoted. `Operational Knowledge Version: 0 → 1`.
**Contract:** [`knowledge-promotion-contract.md`](knowledge-promotion-contract.md) (CARD-001)
**Evidence:** [`knowledge-promotion-eligibility-default-software.md`](knowledge-promotion-eligibility-default-software.md) (CARD-002)
**Card:** CARD-003

---

## What is promoted

`Operational Knowledge Version 1` consists of exactly one pack:

- **`DEFAULT_SOFTWARE_KNOWLEDGE`** (`packages/core/src/default-knowledge.ts`)

This is the only pack that has cleared the contract's §3 gate in isolation, per CARD-002's evaluation on Corpus v3 OOS (52 items, MOR 0%, reduction 69%, precision 100% — all against the required thresholds MOR ≤5%, reduction ≥50%, precision ≥75%).

**Not promoted:** `SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` — none of these has an isolated §3 evaluation on record. Each requires its own CARD-002-shaped card before it can be promoted.

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
