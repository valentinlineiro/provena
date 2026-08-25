# Verify Continuous Attention in Real Use

**Status:** Validation only. No code changes, no policy changes, no schema changes. Findings are named and reported, not fixed inline (fixing is explicitly out of scope for this card).
**Card:** CARD-025
**Input:** CARD-024 (functional validation on synthetic corpus), the production market Postgres database (confirmed by the operator to be the database `DATABASE_URL` points to in the deployed Cloudflare Worker).

---

## 1. The question

> Does the attention reduction observed in the controlled CARD-001–024 benchmarks reproduce when Provena is used in real use, on real opportunities?

## 2. Method

Queried the production Neon Postgres database directly (read-only `SELECT`s), against the schema in `packages/market-postgres/src/schema.sql`. Three queries were prepared to compute, from real rows: surfaced-vs-silenced counts (Attention Reduction), the distribution of human decisions on surfaced items (Attention Precision proxy — `interested`/`applied` vs `dismissed`), and a per-opportunity audit table. Credentials were provided directly by the operator and confirmed to be production's `DATABASE_URL`; not committed anywhere in this repo.

## 3. What was actually found

The production database has real ingested data, but not the tables this card needs:

| Table | In `schema.sql`? | Exists in production? |
|---|---|---|
| `opportunities` | yes | **yes** — 267 rows |
| `opportunity_postings` | yes | **yes** — 265 rows |
| `market_models` | yes | **yes** — 267 rows |
| `opportunity_assessments` | yes | **no** |
| `assessment_evidences` | yes | **no** |
| `user_opportunity_decisions` | yes | **no** |
| `opportunity_posting_history` | yes | **no** |
| `ingestion_runs` | yes | **no** |
| `observation_sources` | yes | **no** |

Additional facts from the real rows that exist:

- All 267 `opportunities` and 265 `opportunity_postings` rows were created in a single ~3-minute window: `2026-08-06T08:51:57Z`–`08:54:35Z`. No row has a later timestamp — including `last_seen_at`, which the Cron sync (`packages/provena-web/src/index.ts`'s `scheduled` handler) should be touching on every 6-hour reconciliation cycle. As of this validation (2026-08-25), that is **19 days with no recorded sync activity** against this database.
- `market_models.market_knowledge_version` is uniformly `'1.0.0'` for all 267 rows — consistent with a single one-time recognition run, not an ongoing pipeline.
- `opportunity_postings.active` is `true` for all 265 rows — never reconciled to `false`/archived, consistent with the sync not having run again since ingestion.

**Traced the consequence in code, not just inferred it.** `GET /api/opportunities` (`packages/provena-web/src/index.ts:1421-1611`) queries `current_opportunity_assessments`, a view over `opportunity_assessments`, when `env.DATABASE_URL` is set. That table doesn't exist in production, so the query throws. The handler's `catch` block (line 1599) returns **HTTP 200** with `items: []` and every tab count at `0` — no error surfaces to the user or the client. The Attention Inbox has been silently empty for real use this whole time, with no visible failure signal.

## 4. Evidence-sufficiency check against the card's own criteria

- Observations of real use, not synthetic fixtures: **267 real opportunities exist**, but —
- Attention reduction computable from those observations: **no** — `opportunity_assessments` (the table holding `decision_tier`/`recommendation`, i.e. the verdict) does not exist, so no verdict has ever been durably recorded for any real opportunity.
- Observed decisions traceable to a Provena verdict: **no** — `user_opportunity_decisions` does not exist, so no human action (`interested`/`applied`/`dismissed`) has ever been durably recorded either. There is nothing to trace.
- No unexplained regression in FP/FN/Attention Precision/MOR: **not evaluable** — none of these are computable without the two tables above.
- Auditable from recorded data: the *absence* is itself fully auditable (queries and counts above are reproducible against the same database), but the property under test is not.

This is not a case of "not enough real usage yet, keep waiting" — 267 real opportunities were ingested and evaluated for recognition. It is that the specific layer this card needs (persisted verdict + persisted human decision) was never deployed to production, so the "real use" the card asks about was structurally unobservable from day one, and the ingestion pipeline itself appears to have gone stale after the initial one-time run.

## 5. Verdict

**INSUFFICIENT EVIDENCE.**

What's missing, named exactly: `opportunity_assessments` and `user_opportunity_decisions` (plus their supporting tables) do not exist in the production database that the deployed Worker's `DATABASE_URL` points to. Without them, neither a verdict nor a human decision has ever been durably recorded for a real opportunity, so Attention Reduction, Attention Precision, Missed Opportunity Rate, FP, and FN cannot be computed from real use — not because the sample is too small, but because the observation mechanism itself isn't there. Additionally, no sync activity is recorded in this database since 2026-08-06, so even opportunity ingestion itself has not been continuous.

Per the card's own instruction, this is reported exactly as found — not patched, not silently downgraded to a smaller claim, and not used to declare 1.0 readiness one way or the other.

## Explicitly out of scope for this card (not done here)

- Fixing the missing schema/migration.
- Diagnosing why the Cron sync shows no activity since 2026-08-06.
- Making `GET /api/opportunities`'s failure mode visible instead of silently returning empty.
- Any change to the causal promotion policy, Operational Knowledge v1, or the evaluation engine.
- Treating H1/H2 as success criteria.
- Any Public Beta / Stable Platform APIs work.

These are real, concrete findings a future card would need to pick up — not created automatically here, per standing protocol.
