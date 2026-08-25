# Governance → Runtime Consistency — Validation

**Status:** Validation only. Does not modify production behavior beyond one test file; does not promote any pack; does not modify `composeKnowledge`/`evaluateOpportunity`.
**Card:** CARD-023
**Input:** [`governance-runtime-knowledge-contract.md`](governance-runtime-knowledge-contract.md) (CARD-021, the invariant), CARD-022's implementation.
**Test:** `packages/provena-web/src/knowledge-consistency.test.ts`.

---

## 1. The invariant checked

> Every knowledge composition production actually consumes belongs exactly to Operational Knowledge v1's promoted set (`PROMOTED_OPERATIONAL_KNOWLEDGE`).

Checked across all 6 production consumption points CARD-022 wired: `/api/opportunities/ingest` (DB path, KV path), `/api/evaluate-url`, `/api/evaluate`, `/api/market/sync`, and the Cloudflare Cron `scheduled` handler.

## 2. Enumerated-scope recount before validating

Re-ran the count live rather than trusting CARD-022's own enumeration: `grep -n "composeKnowledge(\|DeclarativeMarketRecognizer("` on `packages/provena-web/src/index.ts` found exactly 6 `DeclarativeMarketRecognizer` construction sites, matching CARD-022's claim with no drift.

## 3. What was checked, and how

Since the Worker's `fetch`/`scheduled` handlers require `Env` (KV/Postgres bindings) to invoke, this validates at the source level plus one genuine runtime check — not by mocking the Worker:

1. **`recognizerCount === promotedComposeCount`**: every `new DeclarativeMarketRecognizer(...)` construction is paired 1:1 with a `composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` call. This is the exact regression class CARD-022 itself found and fixed (`/api/market/sync`/the Cron handler calling `DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)` directly) — a future call site added the same way would break this count match.
2. **No `VETOED`/`INCONCLUSIVE` pack name** (`SYSTEMS_INFRA_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, `MLOPS_KNOWLEDGE`, `DATA_AGENTIC_KNOWLEDGE`, `ADMIN_KNOWLEDGE` — per CARD-018 §4's verdicts) is reachable anywhere in `packages/provena-web/src/index.ts`.
3. **No bare promoted-pack literal** (`DEFAULT_SOFTWARE_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`) is imported/used directly — the only legitimate route to production knowledge is `PROMOTED_OPERATIONAL_KNOWLEDGE`, so that even a currently-correct direct reference doesn't silently drift the next time the promoted set changes.
4. **`composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` produces exactly the promoted patterns** — a genuine runtime check (not source-scanning): the composed knowledge's pattern-concept set is asserted equal to the union of `DEFAULT_SOFTWARE_KNOWLEDGE`'s and `FINTECH_PLATFORM_KNOWLEDGE`'s own patterns, computed dynamically (not a hardcoded count) so it stays valid if either pack's pattern set changes. Since all 6 call sites use the byte-identical expression `composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` (confirmed by check 1's exact string match), validating this once validates all 6.
5. **No `knowledgeMode` override mechanism** — the request-body field, the UI control, and the type accepting it as input are all absent.

## 4. A real finding, reported honestly rather than adjusted away

The first version of check 5 searched for the bare substring `knowledgeMode` anywhere in the file and **failed**: one reference remains, at the persisted board-sync evaluation record (`knowledgeMode: 'composed'`, inside `reconcileBoardSync`'s callback). This is the exact same field CARD-022 itself identified and deliberately left untouched, reasoning it was a fixed descriptive label on stored data, not a request-controllable override.

**This is not a violation of the invariant.** The label is a hardcoded string literal (`'composed'`) — it is never read to select what knowledge gets composed; the composition is always `composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` regardless of this field's value. Confirmed by narrowing the check to the actual override *mechanism* (a request field being read, a UI control setting one, a type accepting it as input) rather than the bare word — with the narrowed check, all 5 tests pass.

**Named, not fixed:** the label is real, if minor, leftover vocabulary — it uses the word "mode" from a mechanism (`knowledgeMode` as a selectable override) that no longer exists, which could read as confusing to a future person inspecting persisted records ("what other modes were there?"). It is cosmetic, does not affect what production consumes, and is left as-is here — fixing it is out of this card's scope (no divergence to fix), and per this card's own instruction not to silently patch findings, it is named here for whoever next touches that code path rather than corrected inline.

## 5. Overall verdict

**VALIDATED.** All 6 production consumption points route exclusively through `PROMOTED_OPERATIONAL_KNOWLEDGE`, no `VETOED`/`INCONCLUSIVE` pack is reachable, no bypass of the promoted set exists, and `composeKnowledge(...PROMOTED_OPERATIONAL_KNOWLEDGE)` produces exactly the promoted patterns. A regression test (`packages/provena-web/src/knowledge-consistency.test.ts`) now guards this — a future call site added the way `/api/market/sync` originally was (calling `DeclarativeMarketRecognizer` directly with a hardcoded pack) will fail check 1's count match; reintroducing a pack-selecting override will fail check 5; adding a `VETOED`/`INCONCLUSIVE` pack anywhere in the file will fail check 2.

## Explicitly out of scope for this card

- Fixing the cosmetic `knowledgeMode: 'composed'` persisted-record label named in §4 — not a divergence, nothing to fix.
- Modifying `composeKnowledge`'s or `evaluateOpportunity`'s internal logic.
- Promoting any further pack.
- Modifying the causal candidate promotion policy.
- Reconciling any further documentation drift.
