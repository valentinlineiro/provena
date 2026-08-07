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
3. **Non-Destructive Posting Lifecycle (Zero DELETE)**: Postings are NEVER deleted from the database. They transition across states: `ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED`. Disappearance of a posting is valuable market intelligence for longitudinal K12 learning and retrospective attention validation.
4. **Read Bookmark Continuation (Zero OFFSET)**: API pagination uses strict keyset bookmarks (`nextBookmark` in Base64URL). Numeric offsets and page numbers are completely eliminated.
5. **KV Reserved for Telemetry**: Cloudflare KV is restricted to lightweight runtime counters and sync timestamps (`lastSync`, `marketFeedState`).

## Architectural Schema (Neon PostgreSQL)

### 1. Observed Market Facts
- `opportunities`: Canonical job entity (`id`, `company_name`, `company_domain`, `title`, `normalized_title`, `role_family`, `role_level`).
- `opportunity_postings`: Specific source posting carrying `raw_description` HTML/prose (`id`, `opportunity_id`, `source_type`, `external_id`, `url`, `location`, `published_at`, `first_seen_at`, `last_seen_at`, `status`, `consecutive_absent_runs`).
- `opportunity_posting_history`: Audit trail tracking every observation run (`posting_id`, `ingestion_run_id`, `seen_at`, `status`).

### 2. Derived Relational Assessments & Evidences
- `opportunity_assessments`: Deterministic Protocol v1 evaluation metrics (`opportunity_id`, `profile_id`, `protocol_version`, `market_knowledge_version`, `recommendation`, `decision_tier`, `professional_fit`, `personal_fit`, `confidence`, `evaluated_at`).
- `assessment_evidences`: Relational evidence traces (`opportunity_id`, `profile_id`, `capability_id`, `weight`, `matched_text`, `source_taxon`, `evaluated_at`).

### 3. Candidate Decision State
- `user_opportunity_decisions`: Candidate attention actions (`opportunity_id`, `user_id`, `user_decision`, `updated_at`).

### 4. Audit Runs
- `ingestion_runs`: Execution metrics per board sync (`id`, `source_id`, `source_type`, `fetched_count`, `added_count`, `updated_count`, `deactivated_count`, `executed_at`).

## Bookmark Keyset Continuation Protocol

Pagination uses Base64URL versioned `nextBookmark` payloads encoding strictly the resume tuple:

```json
{
  "v": 1,
  "tab": "needs-attention",
  "tier": 4,
  "pf": 8.3,
  "conf": 0.71,
  "seen": "2026-08-07T10:30:00Z",
  "id": "opp-123"
}
```

Resuming query execution in PostgreSQL:

```sql
SELECT ...
FROM opportunities o
JOIN opportunity_postings p ON p.opportunity_id = o.id
JOIN opportunity_assessments a ON a.opportunity_id = o.id
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
- **Relational Integrity**: Allows native SQL indexes, analytical queries, and transparent schema migrations.
- **Longitudinal Intelligence**: Preserving historical postings enables K12 market trend learning and retrospective attention validation.
