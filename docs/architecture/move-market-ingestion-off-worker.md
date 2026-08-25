# Move Market Ingestion Execution Out of Cloudflare Worker

**Card:** CARD-027
**Input:** CARD-026 (which fixed schema drift, the missing `DATABASE_URL` secret, and the 2MB fetch cap, but hit a fourth, structurally different failure post-deploy: Cloudflare error 1102).

---

## 1. Diagnosis

Cloudflare's dashboard (Workers → provena → Metrics) showed **Median CPU Time: ~2020ms, Error Rate: 100%** for the deployed version. Cloudflare Workers Free plan's CPU-time budget is **10ms per invocation**; Paid is 30,000ms. ~2020ms exceeds Free by ~200x and would sit comfortably under Paid — this confirmed the account is on Free, and that any real recognition workload (JSON-parsing ~4.5MB, HTML-stripping and regex-based pattern extraction across 267+ job descriptions) was never going to fit regardless of DB-query batching, since I/O wait doesn't count toward CPU time but this compute does.

Two families of fix were possible: pay for the Paid plan (trivial, but doesn't address that a Worker is running a batch-ETL workload inside a synchronous HTTP handler), or move the workload to a runtime without that constraint. The operator chose the second, explicitly rejecting the plan-upgrade shortcut: the two workloads (low-latency HTTP/API vs. CPU-heavy batch ingestion) have different requirements and belong in different places.

## 2. What moved, and what stayed

```text
Cloudflare Worker (packages/provena-web)
  - HTTP/API (fetch handler) -- unchanged
  - scheduled() Cron handler -- REMOVED
  - POST /api/market/sync's own ingestion -- REMOVED (now returns 410,
    pointing at the GitHub Actions workflow)
  - POST /api/opportunities/ingest -- UNCHANGED (on-demand, single-board,
    still in the Worker; different use case, not the periodic sync)

GitHub Actions (.github/workflows/market-sync.yml)
  - cron: '0 */6 * * *' -- the exact schedule wrangler.jsonc's removed
    trigger used
  - workflow_dispatch -- manual trigger (`gh workflow run market-sync.yml`)
  - runs packages/market-postgres/src/sync-market.ts, a thin script that
    wires the same MarketIngestionEngine / MarketFeedService / composed
    PROMOTED_OPERATIONAL_KNOWLEDGE recognizer the Worker used to construct
    inline -- no new ingestion model, the same one relocated
```

`DATABASE_URL` was added as a GitHub Actions repository secret (`gh secret set`, operator confirmed before it was set) -- same value the Worker's Cloudflare secret holds, never printed or committed.

## 3. Verification (real, not simulated)

Ran `sync-market.ts` locally against production directly:

```
$ time node --import tsx packages/market-postgres/src/sync-market.ts
{
  "totalIngested": 584, "newlyAddedPostings": 2, "updatedPostings": 0,
  "unchangedPostings": 582, "deactivatedPostings": 0,
  "newMarketModelsGenerated": 2, ...
}
real  1m48.863s   user  0m1.847s   sys  0m0.293s
```

`user 1.847s` matches the ~2020ms Cloudflare measured almost exactly -- confirms the diagnosis was right, not a guess. Wall time (1m49s) is dominated by sequential network I/O to Neon and to Greenhouse, which is irrelevant outside the Worker's CPU-time constraint.

Confirmed directly against the database afterward:
- `opportunities`: 644 rows (grew from 267 -- Stripe's real board is larger than the original Aug 6 snapshot).
- `opportunity_postings`: 642 rows, `updated_at` timestamps from the run itself; `status` correctly split `ACTIVE` (584, currently on the board) / `NOT_SEEN` (58, no longer seen -- the lifecycle reconciliation is working).
- `market_models`: both the old `'1.0.0'` version (267 rows, from the Aug 6 backfill under `DEFAULT_SOFTWARE_KNOWLEDGE` alone) and the new `'1.0.0+1.0.0'` composed version (389 rows, under `PROMOTED_OPERATIONAL_KNOWLEDGE`) are present -- recognition is running under the correct, currently-promoted knowledge.

`GET /api/opportunities` on the live Worker now returns HTTP 200 with no `error` field (previously it returned the silent-empty-inbox response CARD-025/026 found).

## 4. A real finding, named rather than silently left implicit

`GET /api/opportunities?tab=needs-attention` still returns `items: []`, `counts` all `0` -- **but this is not a regression, and not the bug CARD-025/026 found.** Traced why: `MarketIngestionEngine.ingest` (both before and after this card) only implements phases 1-3 of its own documented 5-phase pipeline (board fetch, canonical persistence, market model recognition). Phase 4, "Attention Materialization," is a comment in the source (`packages/core/src/market-ingest.ts`), not code -- nothing in the periodic sync path has ever written to `opportunity_assessments`. That table is only ever populated by `POST /api/opportunities/ingest`'s separate, on-demand, single-opportunity evaluation path (`PostgresMarketAssessmentRepository.saveAssessment`, `packages/provena-web/src/index.ts`).

This means the Attention Inbox will stay empty for opportunities ingested via the periodic Stripe sync until something evaluates each opportunity against the candidate profile and persists an assessment -- a distinct, pre-existing gap this card's invariants (`mantener assessment determinista e inmutable`) explicitly did not authorize touching. Not fixed here; named for whoever picks up "Verified Continuous Attention" next.

## 5. Invariants preserved

- Neon remains the only canonical store -- `sync-market.ts` writes exclusively through the same `@provena/market-postgres` repositories the Worker used.
- `MarketIngestionEngine` and its semantics are shared, not duplicated -- `sync-market.ts` imports and calls the same `@provena/core` classes, no reimplementation.
- The Worker remains the HTTP/API layer -- `fetch` handler unchanged except the two removed ingestion call sites.
- No second ingestion model -- verified by regression tests (`attention-data-path.test.ts`: no `scheduled()` handler, no `MarketFeedService` construction in the Worker).
- Scheduling cadence preserved -- `0 */6 * * *`, moved from `wrangler.jsonc` to `market-sync.yml`, asserted equal by test.

## Explicitly out of scope for this card

- Wiring assessment generation into the periodic sync (§4's finding).
- Changing knowledge/promotion semantics.
- Comparing against Cloudflare Queues/Durable Objects/chunking -- not needed since GitHub Actions worked on the first real attempt; no evidence surfaced that would require the comparison the card allowed only "si la evidencia de implementación lo requiere."
- Upgrading the Cloudflare Workers plan -- explicitly rejected by the operator as not addressing the underlying execution-model mismatch.
