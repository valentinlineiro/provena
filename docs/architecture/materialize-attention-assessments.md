# Materialize Attention Assessments in Periodic Market Sync

**Card:** CARD-028
**Input:** CARD-027 (periodic ingestion moved off the Worker), and its own §4 finding: `MarketIngestionEngine` only ever implemented phases 1-3 of its own 5-phase pipeline -- "Attention Materialization" (phase 4, writing `opportunity_assessments`) was a comment, never code, in either the old or new architecture.

---

## 1. The one shared contract

`/api/opportunities/ingest`'s DB path was the only place that ever computed and persisted `opportunity_assessments`. Its inline formula (resolve requirements → sufficiency → professional fit; preferences → personal fit; recognition coverage; `applyPolicy`) was extracted into `packages/core/src/opportunity-assessment-materialization.ts` as `assessOpportunityDescription` + `deriveOpportunityDedupeKey`, exported from `@provena/core`. `/api/opportunities/ingest` was refactored to call the extracted function instead of its own inline copy -- there is now exactly one implementation of this contract, not two that could drift.

`packages/market-postgres/src/sync-market.ts` (the periodic sync, moved off the Worker in CARD-027) now calls the same function after `MarketFeedService.syncSource(...)` completes, for every opportunity id in `result.affectedOpportunityIds`, reading the posting's `rawDescription` back from Neon (not re-fetching from Greenhouse) via `PostgresMarketPostingRepository.listByOpportunity`.

`marketKnowledgeVersion` stays hardcoded to `1` in the shared function, exactly matching what the on-demand path already did -- `opportunity_assessments.market_knowledge_version` is an `INT` column and the real composed version is a string (`"1.0.0+1.0.0"`), so the on-demand path never wrote the real version either. Not this card's semantics to change.

## 2. A real finding about `affectedOpportunityIds`

The name suggests "opportunities whose content changed this run," but `MarketFeedService.syncSource`'s actual check is `posting.lastSeenAt === context.now`, and `reconcilePostingStatus` sets `lastSeenAt` to `now` for *every* currently-seen posting, not only new/content-changed ones. Verified against production directly: a steady-state run with `newlyAddedPostings: 0, updatedPostings: 0` still returned all 584 postings as `affectedOpportunityIds`. In practice this materializes assessments for the full board on every run, not a true content diff -- named in the code comment rather than left as an inaccurate "reassesses only what changed" claim. Functionally this is still correct (every real opportunity ends up assessed) and not a blocker; it's a documented inefficiency, not a defect.

## 3. Verification (real, not simulated)

Ran `sync-market.ts` against production directly after the change:

```
Materialized 584 assessment(s) for 584 affected opportunity(ies).
real  2m50.827s   user  0m2.768s   sys  0m0.378s
```

Then queried the live Worker:

```
GET /api/opportunities?tab=worth-considering
{"counts":{"needs-attention":0,"worth-considering":1,"unresolved":583,"decided":0},
 "items":[{"id":"opp-stripe-7396679","title":"Software Engineer, Secrets Infrastructure",
   "verdict":"consider","profFit":"6.8","personalFit":"10.0","evidenceCoverage":"32%", ...}],
 "totalEvaluatedCount":584}
```

`totalEvaluatedCount: 584` with a real item carrying real fit scores confirms `needs-attention`/`worth-considering` no longer depend exclusively on the on-demand `/api/opportunities/ingest` path -- this data came entirely from the periodic GitHub Actions sync.

## 4. Invariants preserved

- Neon remains the only canonical store.
- No second assessment semantics -- one function, two call sites.
- `MarketIngestionEngine`'s own pipeline untouched (assessment materialization happens after `syncSource` returns, not inside the engine).
- `market_knowledge_version` handling unchanged from the pre-existing on-demand contract.

## Explicitly out of scope for this card

- Building a true content-diff filter for `affectedOpportunityIds` (§2's finding is named, not fixed -- it's an efficiency question, not a correctness one).
- Measuring "Verified Continuous Attention" -- that's the next card, now that the full pipeline (source → opportunity → market knowledge → assessment → Attention Inbox) actually exists end-to-end.
- Changing `OpportunityAssessmentEngine`/`UserOpportunityAssessment` (the separate O2.7 assessment model) -- not what feeds the Attention Inbox today; out of scope.
