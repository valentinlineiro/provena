# Governance → Runtime Knowledge Contract — Design

**Status:** Design only. Not implemented — no file under `packages/core/src` or `packages/provena-web/src` is modified by this card.
**Card:** CARD-021
**Input:** [`operational-knowledge-v1.md`](operational-knowledge-v1.md) (CARD-003/019, the promoted set), [`causal-promotion-policy-complete-validation.md`](causal-promotion-policy-complete-validation.md) (CARD-018, verdict definitions).

---

## 1. The current divergence, stated explicitly before proposing anything

Two independent call sites in `packages/provena-web/src/index.ts` — both branches (`env.DATABASE_URL` present vs. `env.PROVENA_KV`-only) of the `/api/opportunities/ingest` handler, lines 1692 and 1767 — hardcode:

```ts
composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)
```

Compared against the actual promoted set (`operational-knowledge-v1.md`: `DEFAULT_SOFTWARE_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`):

- **Missing**: `FINTECH_PLATFORM_KNOWLEDGE` — promoted (`ELIGIBLE`, CARD-019), not consumed anywhere in production.
- **Included but not promoted**: `ADMIN_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE` — all three are `INCONCLUSIVE` under the complete candidate policy (CARD-018 §4), meaning the evidence has never shown them to have any observable effect on the OOS/V2 corpora tested — not `VETOED`, but also never cleared for promotion.

Separately, the interactive single-URL evaluation endpoint (same file, two near-identical handlers around lines 915–1005) defaults to `DEFAULT_SOFTWARE_KNOWLEDGE` alone (a strict subset of the promoted set — matches what's promoted but omits `FINTECH_PLATFORM_KNOWLEDGE`) and exposes a `knowledgeMode` request parameter that can switch to `ADMIN_KNOWLEDGE` alone or the same 4-pack `composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)` composite as the ingestion pipeline — i.e. a user-facing toggle that can select a composite production has never validated as promoted.

**No code changes are made by this card to close this gap.** The design below defines what "closed" should mean.

## 2. Canonical source of the promoted set

**Today, there is none that code can consume.** `operational-knowledge-v1.md` is prose — a human-readable governance record, not an importable value. Nothing in `packages/core/src` currently exports "the promoted set" as a typed value; `DEFAULT_SOFTWARE_KNOWLEDGE` and `FINTECH_PLATFORM_KNOWLEDGE` are exported individually, alongside every other pack including the `VETOED`/`INCONCLUSIVE` ones, with no marker distinguishing promoted from not.

**Proposed canonical source**: a single new export from `packages/core` — e.g. `PROMOTED_OPERATIONAL_KNOWLEDGE: readonly MarketKnowledge[]` — maintained by hand as part of every future promotion-record card (the same discipline CARD-003 and CARD-019 already apply to `operational-knowledge-v1.md`'s prose; this adds a code artifact that must be updated in the same PR). This constant becomes **the only place "what is promoted" is expressed in code** — every other reference (documentation, tests, any future implementation) either derives from it or is checked against it, never redeclared independently.

**Why not derive it programmatically from the causal-contribution policy at runtime instead of hand-maintaining a list:** the policy (CARD-014–018) is a decision *procedure* over benchmark evidence, not a live classifier — it has no implementation (CARD-014 §"Explicitly out of scope": "Implementing `R` in code" was never done, deliberately, per CARD-013's own authorization boundary). Running it at runtime would require implementing and re-executing benchmark evidence gathering on every request, which is a different, much larger scope than this card or its two proposed successors (CARD-022/023) cover. Hand-maintaining a promoted-set constant, updated by the same promotion-record cards that already exist, is the design this contract proposes — not a live policy evaluator.

## 3. How composition of promoted packs is resolved

**`composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)`** — spread the canonical constant's members, in the order they appear in it, into the existing `composeKnowledge` function. No other composition call (a hand-written pack list, a different subset, an added pack not in the constant) is a legitimate production composition under this contract.

Order matters for `composeKnowledge`'s own internal precedence rules (not examined here — out of scope, `composeKnowledge` itself is untouched by this card), so the canonical constant's declared order **is** the composition order — not re-derived or re-sorted anywhere downstream.

## 4. What happens to `VETOED` / `INCONCLUSIVE` packs

**They structurally cannot appear** — not because of a runtime check, but because the canonical constant (§2) only ever contains packs that have actually been promoted. `SYSTEMS_INFRA_KNOWLEDGE` (`VETOED`), `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` (all `INCONCLUSIVE`, CARD-018 §4) simply never get added to `PROMOTED_OPERATIONAL_KNOWLEDGE` — there is no separate exclusion list or filter to maintain, because inclusion is opt-in per promotion-record card, not opt-out from a superset.

This is a deliberate design choice over the alternative (compose everything, then filter out `VETOED`/`INCONCLUSIVE` at call time): a filter-based design would need `VETOED`/`INCONCLUSIVE` status to be a runtime-checkable property of each pack, which does not exist today (verdicts live only in CARD-018's document, not in code) — building that would be new scope this card does not authorize. An opt-in constant needs nothing new to exist correctly; it only needs someone to add a line to it when a promotion card runs.

## 5. How production is prevented from consuming non-promoted knowledge

Two complementary mechanisms, both design-only here:

1. **Single call site discipline**: every production `composeKnowledge` invocation (currently 2 in the ingestion handler, plus the interactive endpoint's default and `knowledgeMode` switch) should be replaced with a reference to `PROMOTED_OPERATIONAL_KNOWLEDGE` (§2/§3) — not a literal pack list. A literal list at a call site is exactly what caused today's divergence: it was correct when written and silently went stale as promotions happened elsewhere.
2. **The `knowledgeMode` override's fate is a decision CARD-022 needs to make explicitly, not this card**: either (a) remove it entirely, so production always consumes exactly the promoted set with no override, or (b) keep it strictly for operator-facing experimentation (never used by the automated ingestion pipely) with every mode option validated against §2's constant rather than hardcoded. This document does not choose between (a) and (b) — it names the decision as required before CARD-022 can implement anything.

## 6. The invariant, and how it would be checked

**Invariant:** `runtime knowledge composition == PROMOTED_OPERATIONAL_KNOWLEDGE` (§2), for every code path that evaluates a real job description in production (the automated ingestion pipeline; the interactive single-URL endpoint, absent an explicit and validated override per §5.2).

**How it would be checked (proposed, not built here):** a regression test in `packages/provena-web/src` that imports both `PROMOTED_OPERATIONAL_KNOWLEDGE` and the actual composite each production call site constructs, and asserts they contain the same packs (by identity or by `name`+`version`, whichever `MarketKnowledge` already supports) — failing loudly the moment a call site's literal list (if any survive) drifts from the canonical constant, or the moment a promotion-record card updates the constant without a corresponding call-site update. This is the CARD-023 validation card's job to build and run — this document only specifies what it must check and why a check is needed at all (today's 2-pack-in-4-hardcoded divergence is exactly the failure mode with no test to catch it).

## 7. What this contract does not decide

- Whether `MarketKnowledge`'s existing type already carries enough identity information (`name`, `version`) for §6's equality check, or needs a new field — a CARD-022 implementation detail.
- The exact TypeScript shape/location of `PROMOTED_OPERATIONAL_KNOWLEDGE` (e.g. `packages/core/src/index.ts` vs. a new file) — implementation detail.
- Whether `knowledgeMode`'s non-`promoted` options are removed or kept as an explicit experimental override (§5.2) — an explicit decision CARD-022 must obtain, not inherited silently from this document's silence on the matter.
- Anything about the causal-contribution policy itself, the veto, or promoting any further pack — all untouched, per this card's prohibitions.

## Explicitly out of scope for this card

- Implementing `PROMOTED_OPERATIONAL_KNOWLEDGE` or any wiring change.
- Modifying `composeKnowledge`, `evaluateOpportunity`, or any file under `packages/provena-web/src`.
- Promoting any further pack.
- Modifying the causal candidate promotion policy.
- Building the CARD-023 regression check named in §6.
- Deciding `knowledgeMode`'s fate (§5.2) — named as a required decision for CARD-022, not made here.
