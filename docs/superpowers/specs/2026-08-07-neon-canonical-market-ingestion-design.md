# Neon Canonical Market Ingestion & Read Bookmark Design

**Date:** 2026-08-07  
**Status:** Spec Approved & Finalized  
**Reference ADR:** [ADR-002](../../architecture/adr/ADR-002-neon-canonical-market-orchestration.md)

---

## 1. Overview & Goal

Transition Provena's market ingestion, persistence, evaluation, and attention reading pipeline from Cloudflare KV blob storage to **Neon PostgreSQL as the Single Canonical Market Store**.

- Eliminate all KV blob usage for job posting payloads and opportunity list indices.
- Store observed market facts, immutable relational evaluation assessments, and candidate decision states in native PostgreSQL tables.
- Expose a `current_opportunity_assessments` SQL view for ultra-fast UI reads while keeping full historical auditability.
- Maintain a strict boundary: O2 observes, persists, and evaluates using promoted operational knowledge; K12 exclusively produces experimental knowledge versions.
- Eliminate numeric `OFFSET` pagination from API contracts and SQL queries in favor of Base64URL versioned `nextBookmark` keyset continuation (with explicit `bookmarkVersion` and `orderingVersion`).
- Maintain a non-destructive lifecycle (`ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED`) for all market postings.

---

## 2. Pipeline Sequence

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

---

## 3. Relational Database Schema (`packages/market-postgres/src/schema.sql`)

```sql
-- 1. Observed Market Facts
CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT,
    title TEXT NOT NULL,
    normalized_title TEXT NOT NULL,
    role_family TEXT,
    role_level TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS opportunity_postings (
    id TEXT PRIMARY KEY,
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL, -- 'greenhouse' | 'lever' | 'ashby' | 'url-fetch'
    external_id TEXT NOT NULL,
    url TEXT NOT NULL,
    location TEXT,
    published_at TIMESTAMPTZ,
    first_seen_at TIMESTAMPTZ NOT NULL,
    last_seen_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'NOT_SEEN' | 'INACTIVE' | 'ARCHIVED'
    consecutive_absent_runs INT NOT NULL DEFAULT 0,
    raw_description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_source_external_id UNIQUE (source_type, external_id)
);

CREATE TABLE IF NOT EXISTS opportunity_posting_history (
    id BIGSERIAL PRIMARY KEY,
    posting_id TEXT NOT NULL REFERENCES opportunity_postings(id) ON DELETE CASCADE,
    ingestion_run_id TEXT NOT NULL,
    seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL
);

-- 2. Derived Relational Assessments (Immutable Historical Events)
CREATE TABLE IF NOT EXISTS opportunity_assessments (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    profile_version TEXT NOT NULL DEFAULT '1.0.0',
    protocol_version INT NOT NULL DEFAULT 1,
    market_knowledge_version INT NOT NULL DEFAULT 0,
    recommendation TEXT NOT NULL, -- 'strong-candidate' | 'consider' | 'abstain' | 'skip'
    decision_tier SMALLINT NOT NULL, -- 4: strong-candidate, 3: consider, 2: abstain, 1: skip
    professional_fit REAL NOT NULL,
    personal_fit REAL NOT NULL,
    confidence REAL NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (
        opportunity_id,
        profile_id,
        profile_version,
        protocol_version,
        market_knowledge_version
    )
);

CREATE TABLE IF NOT EXISTS assessment_evidences (
    id BIGSERIAL PRIMARY KEY,
    opportunity_id TEXT NOT NULL,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    capability_id TEXT NOT NULL,
    weight REAL NOT NULL,
    matched_text TEXT NOT NULL,
    source_taxon TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. SQL View for Current Assessment Resolution
CREATE OR REPLACE VIEW current_opportunity_assessments AS
SELECT DISTINCT ON (opportunity_id, profile_id)
    opportunity_id,
    profile_id,
    profile_version,
    protocol_version,
    market_knowledge_version,
    recommendation,
    decision_tier,
    professional_fit,
    personal_fit,
    confidence,
    evaluated_at
FROM opportunity_assessments
ORDER BY opportunity_id, profile_id, evaluated_at DESC;

-- 4. Candidate Attention Decisions
CREATE TABLE IF NOT EXISTS user_opportunity_decisions (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'valentin',
    user_decision TEXT NOT NULL DEFAULT 'new', -- 'new' | 'seen' | 'interested' | 'applied' | 'dismissed'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, user_id)
);

-- 5. Audit Ingestion Runs
CREATE TABLE IF NOT EXISTS ingestion_runs (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    source_type TEXT NOT NULL,
    fetched_count INT NOT NULL,
    added_count INT NOT NULL,
    updated_count INT NOT NULL,
    deactivated_count INT NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Keyset Bookmark SQL Queries
CREATE INDEX IF NOT EXISTS idx_postings_status_seen ON opportunity_postings(status, last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_keyset ON opportunity_assessments(decision_tier DESC, professional_fit DESC, confidence DESC, evaluated_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_decisions_tab ON user_opportunity_decisions(user_id, user_decision);
```

---

## 4. Phase-Based Ingestion Pipeline

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

1. **Board Fetch**: Fetch raw postings from public board API (e.g. Greenhouse).
2. **Canonical Persistence**: Upsert `opportunities` and `opportunity_postings`, record `opportunity_posting_history`, and reconcile active vs absent postings.
3. **Deterministic Assessment**: Evaluate Protocol v1 engine for new/updated postings under promoted `market_knowledge_version = 0`. Insert immutable `opportunity_assessments` historical event row and `assessment_evidences`.
4. **Attention Materialization**: Update `current_opportunity_assessments` view and candidate decision default states.
5. **Bookmark API**: Expose Base64URL keyset continuation bookmarks for UI pagination.

---

## 5. Keyset Reading Bookmark Protocol

### API Contract (`GET /api/opportunities`)

**Query Parameters:**
- `tab`: `needs-attention` | `worth-considering` | `unresolved` | `decided`
- `bookmark`: Base64URL string (optional; omitted on initial read)
- `limit`: Integer (default 30)

**Response Payload:**
```json
{
  "tab": "unresolved",
  "counts": {
    "needs-attention": 0,
    "worth-considering": 4,
    "unresolved": 543,
    "decided": 0
  },
  "items": [ ... ],
  "nextBookmark": "eyJib29rbWFya1ZlcnNpb24iOjEsIm9yZGVyaW5nVmVyc2lvbiI6MSwidGFiIjoidW5yZXNvbHZlZCIsInRpZXIiOjIsInBmIjowLjQsImNvbmYiOjAuNSwic2VlbiI6IjIwMjYtMDgtMDdUMTA6MzA6MDBaIiwiaWQiOiJvcHAtMTIzIn0",
  "totalInTab": 543
}
```

### Bookmark Payload Structure
```json
{
  "bookmarkVersion": 1,
  "orderingVersion": 1,
  "tab": "unresolved",
  "tier": 2,
  "pf": 0.4,
  "conf": 0.5,
  "seen": "2026-08-07T10:30:00Z",
  "id": "opp-123"
}
```

### Resuming SQL Execution (Keyset Query)
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
LEFT JOIN user_opportunity_decisions ud ON ud.opportunity_id = o.id AND ud.user_id = $userId
WHERE p.status = 'ACTIVE'
  AND ($tabFilter = 'decided' OR (ud.user_decision IS NULL OR ud.user_decision = 'new'))
  AND ($bookmarkTier IS NULL OR (
      (a.decision_tier, a.professional_fit, a.confidence, p.last_seen_at, o.id) < 
      ($bookmarkTier, $bookmarkPf, $bookmarkConf, $bookmarkSeen, $bookmarkId)
  ))
ORDER BY 
    a.decision_tier DESC, 
    a.professional_fit DESC, 
    a.confidence DESC, 
    p.last_seen_at DESC, 
    o.id ASC
LIMIT 30;
```

---

## 6. Spec Self-Review

1. **Placeholder scan**: Zero TBDs or TODOs.
2. **Internal consistency**: Immutable assessment events, SQL view, versioned bookmarks, and O2/K12 boundary match ADR-002 perfectly.
3. **Scope check**: Focused on Neon PostgreSQL market ingestion, non-destructive lifecycle, relational assessments, and keyset bookmarks.
4. **Ambiguity check**: Bookmark payload structure and ordering versions are explicit.
