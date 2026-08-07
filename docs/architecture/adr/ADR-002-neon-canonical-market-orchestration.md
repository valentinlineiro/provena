# ADR-002 — Worker as Pure Orchestrator with Relational Neon Market Store

## Status
**Accepted** (2026-08-07)

## Context & Motivation
Previously, market opportunity data and ingestion state were stored as a single monolithic JSON blob inside Cloudflare KV (`KvOpportunityRepository`). As market ingestion scaled to hundreds of job postings per board (e.g. 500+ Stripe postings), serializing and parsing a 20MB JSON blob inside Cloudflare Worker memory exceeded V8 isolate RAM limits (128MB limit) and CPU execution budgets, triggering Worker exceptions (Error 1101) and state desynchronization between tabs.

Furthermore, Cloudflare Workers platform guidelines explicitly advise avoiding large in-memory buffering and delegating canonical data storage to external databases.

To achieve enterprise reliability and infinite scalability, we transition from KV blob storage to **Neon PostgreSQL as the Single Canonical Market Store**, redefining Cloudflare Workers as **Pure Orchestrators**.

## Decision
We establish a relational, Neon-first architecture for continuous market ingestion, evaluation, and attention rendering.

```text
Anterior:  Mercado → Materialize JSON → KV Blob → Worker → UI
Nueva:     Mercado → Neon (Canonical SQL) → Relational Assessment → SQL Keyset Bookmark → Worker → UI
```

1. **Worker as Pure Orchestrator**: Cloudflare Workers do NOT buffer large payloads or persist market data in KV. Workers consume ATS streams, execute batch SQL upserts to Neon, and serve paginated reading bookmarks.
2. **Relational Schema (Zero JSONB in Assessments)**: Observed market facts (`opportunities`, `opportunity_postings`, `opportunity_posting_history`), derived assessments (`opportunity_assessments`, `assessment_evidences`), and candidate decisions (`user_opportunity_decisions`) are stored as native SQL columns (`REAL`, `INT`, `TIMESTAMPTZ`, `TEXT`).
3. **Immutable Assessment Events**: `opportunity_assessments` is strictly immutable. Assessments are never overwritten in place. Each re-evaluation under a new `profile_version`, `protocol_version`, or `market_knowledge_version` inserts a new immutable historical row.
4. **Current Assessment View (`current_opportunity_assessments`)**: The UI reads from a materialized SQL view `current_opportunity_assessments` that resolves the latest valid assessment per opportunity, keeping queries fast while preserving complete historical auditability.
5. **Strict O2 / K12 Boundary**: O2 never modifies market knowledge. O2 observes, persists, and evaluates using an already promoted version of knowledge. The production of new versions of `market_knowledge_version` belongs exclusively to the experimental program K12.
6. **Non-Destructive Posting Lifecycle (Zero DELETE)**: Postings are NEVER deleted from the database. They transition across states: `ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED`. Disappearance of a posting is valuable market intelligence for longitudinal K12 learning and retrospective attention validation.
7. **Read Bookmark Continuation (Zero OFFSET)**: API pagination uses strict keyset bookmarks (`nextBookmark` in Base64URL). Numeric offsets and page numbers are completely eliminated.
8. **KV Reserved for Telemetry**: Cloudflare KV is restricted to lightweight runtime counters and sync timestamps (`lastSync`, `marketFeedState`).

## System Pipeline Sequence

```text
Board Fetch
      │
      ▼
Canonical Persistence
      │
      ▼
Deterministic Assessment
      │
      ▼
Attention Materialization
      │
      ▼
Bookmark API
```

## Bookmark Keyset Continuation Protocol

Pagination uses Base64URL versioned `nextBookmark` payloads encoding strictly the resume tuple with explicit `bookmarkVersion` and `orderingVersion`:

```json
{
  "bookmarkVersion": 1,
  "orderingVersion": 1,
  "tab": "needs-attention",
  "tier": 4,
  "pf": 8.3,
  "conf": 0.71,
  "seen": "2026-08-07T10:30:00Z",
  "id": "opp-123"
}
```

Resuming query execution in PostgreSQL via `current_opportunity_assessments`:

```sql
SELECT 
    o.id,
    o.title,
    o.company_name,
    p.url,
    p.published_at,
    p.last_seen_at,
    COALESCE(ud.user_decision, 'new') AS user_decision,
    a.recommendation,
    a.decision_tier,
    a.professional_fit,
    a.personal_fit,
    a.confidence
FROM opportunities o
JOIN opportunity_postings p ON p.opportunity_id = o.id
JOIN current_opportunity_assessments a ON a.opportunity_id = o.id
LEFT JOIN user_opportunity_decisions ud ON ud.opportunity_id = o.id AND ud.user_id = :userId
WHERE p.status = 'ACTIVE'
  AND (:bookmarkTier IS NULL OR (
      (a.decision_tier, a.professional_fit, a.confidence, p.last_seen_at, o.id) < 
      (:bookmarkTier, :bookmarkPf, :bookmarkConf, :bookmarkSeen, :bookmarkId)
  ))
ORDER BY 
    a.decision_tier DESC, 
    a.professional_fit DESC, 
    a.confidence DESC, 
    p.last_seen_at DESC, 
    o.id ASC
LIMIT 30;
```

## Consequences & Benefits
- **Zero Worker Crashes**: Eliminates Worker memory/CPU isolation limits.
- **Auditability & Traceability**: Immutable assessment events allow comparing decision changes across protocol or knowledge versions.
- **Strict Domain Boundaries**: Guarantees O2 never mutates operational knowledge contracts.
- **Longitudinal Intelligence**: Preserving historical postings enables K12 market trend learning and retrospective attention validation.
