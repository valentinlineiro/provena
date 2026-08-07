# Neon Canonical Market Ingestion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace KV blob storage with Neon PostgreSQL as the single canonical store for market postings, immutable relational assessments, and keyset reading bookmarks.

**Architecture:** Cloudflare Worker acts as a pure orchestrator consuming ATS streams, persisting facts to Neon PostgreSQL, evaluating deterministic Protocol v1 assessments into immutable relational tables (`opportunity_assessments`, `assessment_evidences`), and serving keyset SQL continuation bookmarks via a `current_opportunity_assessments` SQL view. No KV blobs for heavy prose payloads; no numeric `OFFSET` queries.

**Tech Stack:** TypeScript, Node.js Test Runner, Neon PostgreSQL (`postgres` driver), Cloudflare Workers.

## Global Constraints

- Monorepo package version: `0.7.0`
- Decision Protocol Version: `Protocol v1`
- Operational Knowledge Version: `0`
- Zero `DELETE` statements on market postings (`ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED` lifecycle)
- Zero `OFFSET` in SQL queries (`nextBookmark` keyset tuple continuation only)
- Zero HTML description prose in Cloudflare KV

---

### Task 1: Relational Schema & Migration (`packages/market-postgres`)

**Files:**
- Modify: `packages/market-postgres/src/schema.sql`
- Test: `packages/market-postgres/src/schema.test.ts`

**Interfaces:**
- Consumes: None
- Produces: Relational SQL tables `opportunities`, `opportunity_postings`, `opportunity_posting_history`, `opportunity_assessments`, `assessment_evidences`, `user_opportunity_decisions`, `ingestion_runs`, and SQL view `current_opportunity_assessments`.

- [ ] **Step 1: Write the failing test**

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('schema.sql includes all relational tables, views, and indexes', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'packages/market-postgres/src/schema.sql'), 'utf8')
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunities'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_postings'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_posting_history'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_assessments'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS assessment_evidences'))
  assert.ok(sql.includes('CREATE OR REPLACE VIEW current_opportunity_assessments'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS user_opportunity_decisions'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS ingestion_runs'))
  assert.ok(sql.includes('idx_assessments_keyset'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/market-postgres/src/schema.test.ts`
Expected: FAIL with "schema.sql missing opportunity_assessments or current_opportunity_assessments"

- [ ] **Step 3: Update `packages/market-postgres/src/schema.sql`**

Update `packages/market-postgres/src/schema.sql` with full relational schema:
- `opportunities`
- `opportunity_postings` (`status`, `consecutive_absent_runs`)
- `opportunity_posting_history`
- `opportunity_assessments` (immutable composite PK with `profile_version`)
- `assessment_evidences`
- `current_opportunity_assessments` SQL view (`DISTINCT ON (opportunity_id, profile_id) ORDER BY evaluated_at DESC`)
- `user_opportunity_decisions`
- `ingestion_runs`

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test packages/market-postgres/src/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/market-postgres/src/schema.sql packages/market-postgres/src/schema.test.ts
git commit -m "feat(market-postgres): add relational schema, posting lifecycle, and current_opportunity_assessments view"
```

---

### Task 2: Repositories for Immutable Assessments and User Decisions (`packages/market-postgres`)

**Files:**
- Create: `packages/market-postgres/src/postgres-market-assessment-repository.ts`
- Create: `packages/market-postgres/src/postgres-user-decision-repository.ts`
- Modify: `packages/market-postgres/src/index.ts`
- Test: `packages/market-postgres/src/postgres-repositories.test.ts`

**Interfaces:**
- Consumes: Postgres `Sql` client
- Produces: `PostgresMarketAssessmentRepository.saveAssessment()`, `PostgresMarketAssessmentRepository.getCurrentAssessment()`, `PostgresUserDecisionRepository.setDecision()`

- [ ] **Step 1: Write failing test for repositories**

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PostgresMarketAssessmentRepository } from './postgres-market-assessment-repository.js'

test('PostgresMarketAssessmentRepository module exports class', () => {
  assert.equal(typeof PostgresMarketAssessmentRepository, 'function')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/market-postgres/src/postgres-repositories.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement repositories**

Create `postgres-market-assessment-repository.ts` and `postgres-user-decision-repository.ts`.
- `saveAssessment`: Inserts an immutable assessment row (never updates existing assessment).
- `setDecision`: Upserts user decision into `user_opportunity_decisions`.
- Re-export both from `packages/market-postgres/src/index.ts`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test packages/market-postgres/src/postgres-repositories.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/market-postgres/src/
git commit -m "feat(market-postgres): add PostgresMarketAssessmentRepository and PostgresUserDecisionRepository"
```

---

### Task 3: Non-Destructive Ingestion Engine & Phase Pipeline (`packages/core`)

**Files:**
- Modify: `packages/core/src/market-ingest.ts`
- Modify: `packages/core/src/market-feed-service.ts`
- Test: `packages/core/src/market-ingest.test.ts`

**Interfaces:**
- Consumes: Raw opportunities from ATS board
- Produces: `MarketIngestionEngine.ingest()` with 5-phase pipeline (`Board Fetch -> Canonical Persistence -> Deterministic Assessment -> Attention Materialization -> Bookmark API`) and non-destructive lifecycle (`ACTIVE → NOT_SEEN → INACTIVE → ARCHIVED`).

- [ ] **Step 1: Write failing test for non-destructive lifecycle**

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { reconcileBoardSync } from './market-ingest.js'

test('reconcileBoardSync increments consecutive_absent_runs and transitions ACTIVE to NOT_SEEN then INACTIVE without deleting', () => {
  // Assert missing posting status transitions ACTIVE -> NOT_SEEN -> INACTIVE
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/core/src/market-ingest.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `market-ingest.ts` and `market-feed-service.ts`**

Implement non-destructive status transitions (`ACTIVE`, `NOT_SEEN`, `INACTIVE`, `ARCHIVED`) and absent run counters.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test packages/core/src/market-ingest.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/market-ingest.ts packages/core/src/market-feed-service.ts packages/core/src/market-ingest.test.ts
git commit -m "feat(core): implement non-destructive posting lifecycle and phase-based market feed ingestion"
```

---

### Task 4: Keyset Reading Bookmarks & Query Engine (`packages/core` & `packages/market-postgres`)

**Files:**
- Modify: `packages/core/src/opportunity-ranking-policy.ts`
- Create: `packages/core/src/opportunity-bookmark.ts`
- Modify: `packages/market-postgres/src/postgres-opportunity-search-adapter.ts`
- Test: `packages/core/src/opportunity-bookmark.test.ts`

**Interfaces:**
- Consumes: Base64URL bookmark string, `AttentionTab`
- Produces: `encodeBookmark()`, `decodeBookmark()`, `nextBookmark` in response, SQL keyset queries without `OFFSET`.

- [ ] **Step 1: Write failing test for versioned bookmark encoding/decoding**

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeBookmark, decodeBookmark } from './opportunity-bookmark.js'

test('encodeBookmark and decodeBookmark roundtrip versioned payload', () => {
  const payload = {
    bookmarkVersion: 1,
    orderingVersion: 1,
    tab: 'needs-attention' as const,
    tier: 4,
    pf: 8.3,
    conf: 0.71,
    seen: '2026-08-07T10:30:00Z',
    id: 'opp-123',
  }
  const encoded = encodeBookmark(payload)
  const decoded = decodeBookmark(encoded, 'needs-attention')
  assert.deepEqual(decoded, payload)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test packages/core/src/opportunity-bookmark.test.ts`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement `opportunity-bookmark.ts`**

Implement `encodeBookmark`, `decodeBookmark` with explicit `bookmarkVersion: 1` and `orderingVersion: 1`. Update `DefaultOpportunityRankingPolicy` to generate `nextBookmark`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test packages/core/src/opportunity-bookmark.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/core/src/opportunity-bookmark.ts packages/core/src/opportunity-ranking-policy.ts packages/core/src/opportunity-bookmark.test.ts
git commit -m "feat(core): implement versioned keyset reading bookmarks with orderingVersion"
```

---

### Task 5: Worker Endpoint Integration & Neon Direct Execution (`packages/provena-web`)

**Files:**
- Modify: `packages/provena-web/src/index.ts`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: HTTP requests to `/api/opportunities`, `/api/opportunities/ingest`, `/api/opportunities/decision`
- Produces: Direct Neon PostgreSQL reads/writes when `DATABASE_URL` is set, returning `nextBookmark` in JSON.

- [ ] **Step 1: Write failing test for `GET /api/opportunities` bookmark response**

```ts
test('GET /api/opportunities accepts bookmark param and returns nextBookmark field', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=unresolved&limit=30'), env)
  const json = await res.json() as any
  assert.ok('nextBookmark' in json)
  assert.ok(!('nextCursor' in json))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix packages/provena-web test`
Expected: FAIL (still returning legacy nextCursor)

- [ ] **Step 3: Wire `packages/provena-web/src/index.ts` to Neon Postgres & Bookmarks**

- Update `GET /api/opportunities` to parse `bookmark` parameter and return `nextBookmark`.
- Update client JS in `index.ts` to send `bookmark` instead of `cursor`.
- Execute direct Postgres queries against `current_opportunity_assessments` when `env.DATABASE_URL` is set.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix packages/provena-web test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): wire Neon PostgreSQL direct ingestion and read bookmarks in provena-web"
```

---

### Task 6: Full Verification & Retrospective Update

**Files:**
- Modify: `docs/releases/v0.7.0-retrospective.md`
- Test: Monorepo test suite & build

- [ ] **Step 1: Run typecheck**
Run: `npm run typecheck`
Expected: PASS (0 errors)

- [ ] **Step 2: Run full unit test suite**
Run: `npm test`
Expected: PASS (100% tests green)

- [ ] **Step 3: Run monorepo build**
Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Update Retrospective**
Update `docs/releases/v0.7.0-retrospective.md` with Neon-First Ingestion & Keyset Bookmark resolution.

- [ ] **Step 5: Commit & Tag**

```bash
git add .
git commit -m "chore(release): complete Neon canonical market ingestion & read bookmark transition"
git tag -f -a v0.7.0 -m "v0.7.0 — Continuous Market & Architectural Reconciliation"
git push origin main && git push -f origin v0.7.0
```
