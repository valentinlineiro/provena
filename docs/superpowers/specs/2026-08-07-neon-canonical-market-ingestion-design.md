# Neon Canonical Market Ingestion & Read Bookmark Design

**Date:** 2026-08-07  
**Status:** Spec Written & Under Review  
**Reference ADR:** [ADR-002](file:///home/valentin/code/provena/docs/architecture/adr/ADR-002-neon-canonical-market-orchestration.md)

---

## 1. Overview & Goal

Transition Provena's market ingestion, persistence, evaluation, and attention reading pipeline from Cloudflare KV blob storage to **Neon PostgreSQL as the Single Canonical Market Store**.

- Eliminate all KV blob usage for job posting payloads and opportunity list indices.
- Store observed market facts, relational evaluation assessments, and candidate decision states in native PostgreSQL tables.
- Eliminate numeric `OFFSET` pagination from API contracts and SQL queries in favor of Base64URL versioned `nextBookmark` keyset continuation.
- Maintain a non-destructive lifecycle (`ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED`) for all market postings.

---

## 2. Architecture & System Flow

```text
ATS Board (Greenhouse API)
       │
       ▼
Cloudflare Worker (Pure Orchestrator)
       │
       ├─► Batch Upsert Facts ────► Neon: opportunities & opportunity_postings
       │
       ├─► Evaluate Protocol v1 ──► Neon: opportunity_assessments & assessment_evidences
       │
       └─► Query Keyset Bookmark ─► SQL Read: JOIN opportunities + postings + assessments + decisions
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

-- 2. Derived Relational Assessments & Evidences
CREATE TABLE IF NOT EXISTS opportunity_assessments (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL DEFAULT 'valentin',
    protocol_version INT NOT NULL DEFAULT 1,
    market_knowledge_version INT NOT NULL DEFAULT 0,
    recommendation TEXT NOT NULL, -- 'strong-candidate' | 'consider' | 'abstain' | 'skip'
    decision_tier SMALLINT NOT NULL, -- 4: strong-candidate, 3: consider, 2: abstain, 1: skip
    professional_fit REAL NOT NULL,
    personal_fit REAL NOT NULL,
    confidence REAL NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, profile_id, protocol_version, market_knowledge_version)
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

-- 3. Candidate Attention Decisions
CREATE TABLE IF NOT EXISTS user_opportunity_decisions (
    opportunity_id TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL DEFAULT 'valentin',
    user_decision TEXT NOT NULL DEFAULT 'new', -- 'new' | 'seen' | 'interested' | 'applied' | 'dismissed'
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (opportunity_id, user_id)
);

-- 4. Audit Ingestion Runs
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

### Phase 1: ATS Board Fetch
Fetch raw postings from public board API (e.g. Greenhouse).

### Phase 2: Relational Upsert & Lifecycle Reconciliation
For each posting:
- Upsert canonical `opportunities` row.
- Upsert `opportunity_postings` row (`status = 'ACTIVE'`, `consecutive_absent_runs = 0`).
- Record `opportunity_posting_history` entry.
- Identify missing postings previously seen for this source: increment `consecutive_absent_runs`. If `absent_runs >= 3`, transition `status = 'INACTIVE'`. If `absent_days >= 90`, transition `status = 'ARCHIVED'`. Zero `DELETE` statements.

### Phase 3: Protocol v1 Deterministic Assessment
Execute `evaluateOpportunity` engine for new/updated postings:
- Upsert `opportunity_assessments` row.
- Replace `assessment_evidences` rows for the opportunity.

### Phase 4: Audit Run Recording
Record summary metrics in `ingestion_runs`.

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
  "nextBookmark": "eyJ2IjoxLCJ0YWIiOiJ1bnJlc29sdmVkIiwidGllciI6MiwicGYiOjAuNCwiY29uZiI6MC41LCJzZWVuIjoiMjAyNi0wOC0wN1QxMDozMDowMFoiLCJpZCI6Im9wcC0xMjMifQ",
  "totalInTab": 543
}
```

### Bookmark Payload Structure
```json
{
  "v": 1,
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
JOIN opportunity_assessments a ON a.opportunity_id = o.id
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
2. **Internal consistency**: Schema, ingestion pipeline, non-destructive lifecycle, and keyset bookmark SQL query align perfectly with ADR-002.
3. **Scope check**: Focused purely on Neon PostgreSQL market ingestion, non-destructive lifecycle, relational assessments, and keyset reading bookmarks.
4. **Ambiguity check**: Keyset bookmark versioning and tuple fields are explicitly defined.
