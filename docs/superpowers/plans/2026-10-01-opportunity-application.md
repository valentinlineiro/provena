# Opportunity → Application Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deciding to apply creates an `Application{ready}` linked by `opportunityId`; `Mark applied` moves it to `applied`; the Inbox shows a derived stage and offers each action only when valid.

**Architecture:** Stage is derived in core from `{assessed, decision, application}` (single owner: `deriveOpportunityStage`). `decideToApply`/`markApplied` are pure core functions; the web worker resolves state, calls them, persists via existing KV/Postgres repos. `'applied'` is removed from the persisted decision type.

**Tech Stack:** TypeScript, node:test (`npm test`), Cloudflare Worker (`packages/provena-web`), KV, Postgres (`postgres` driver).

**Spec:** `docs/superpowers/specs/2026-10-01-opportunity-application-design.md`

## Global Constraints

- Tests named `shouldXWhenY`; mock only at architectural boundaries (KV namespace) — never between internal layers.
- `@provena/core`: pure, zero I/O, zero dependencies.
- `OpportunityUserDecision` = `'new' | 'seen' | 'interested' | 'dismissed'` after Task 1.
- Stage precedence (first match wins): application in `applied|interviewing|offer` → `applied`; `ready` → `decided`; `rejected|withdrawn|ghosted|closed` → `closed`; decision `dismissed` → `dismissed`; `interested` → `considered`; assessed → `evaluated`; else `new`.
- Verification = `npm run typecheck && npm test`. "E2E" in this repo = worker-level `worker.fetch` tests with an in-memory KV (see `packages/provena-web/src/applications.test.ts`); CI already runs `npm test`, so no workflow change.

## Review Focus

- Inbox tab "decided" (SQL: any decision ≠ `new`) is a different concept from stage `decided`; keep names distinct in UI copy/code. Task 4 pins the stage label only.
- `POST /api/applications` with an `opportunityId` that already has an Application must 409 (else it bypasses the one-Application invariant). Task 3 test.
- `decide` on an unknown opportunity → 404, not 500. Task 3 test.
- `decide` twice → same Application id, one row. Task 3 test.
- Legacy rows with `user_decision='applied'` and no Application: not handled until the Neon count is measured (Task 5, conditional).
- Deciding on a `new`-decision opportunity also persists decision `interested` so it leaves the attention tabs. Task 3 test.

---

### Task 1: Core stage model

**Files:**
- Create: `packages/core/src/opportunity-stage.ts`
- Create: `packages/core/src/opportunity-stage.test.ts`
- Modify: `packages/core/src/opportunity-source.ts:12`, `packages/core/src/market-catalog.ts:198`, `packages/core/src/index.ts:185`
- Modify (tests using `'applied'` decision): `packages/core/src/opportunity-source.test.ts:206-212`, `packages/core/src/market-catalog.test.ts:260`

**Interfaces:**
- Produces:
  - `type OpportunityStage = 'new'|'evaluated'|'considered'|'decided'|'applied'|'closed'|'dismissed'`
  - `interface OpportunityState { readonly assessed: boolean; readonly decision: OpportunityUserDecision; readonly application?: Application }`
  - `deriveOpportunityStage(state: OpportunityState): OpportunityStage`

- [ ] **Step 1: Write the failing test** — `packages/core/src/opportunity-stage.test.ts`

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveOpportunityStage, createApplication, type ApplicationStatus } from './index.js'

const app = (status: ApplicationStatus) => ({ ...createApplication({ platform: 'greenhouse', opportunityId: 'opp-1' }), status })

test('shouldBeNewWhenNothingAssessedOrDecided', () => {
  assert.equal(deriveOpportunityStage({ assessed: false, decision: 'new' }), 'new')
})
test('shouldBeEvaluatedWhenAssessedAndUndecided', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'seen' }), 'evaluated')
})
test('shouldBeConsideredWhenInterested', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested' }), 'considered')
})
test('shouldBeDismissedWhenDismissed', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'dismissed' }), 'dismissed')
})
test('shouldBeDecidedWhenApplicationReady', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app('ready') }), 'decided')
})
for (const s of ['applied', 'interviewing', 'offer'] as const) {
  test(`shouldBeAppliedWhenApplicationIs_${s}`, () => {
    assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app(s) }), 'applied')
  })
}
for (const s of ['rejected', 'withdrawn', 'ghosted', 'closed'] as const) {
  test(`shouldBeClosedWhenApplicationIs_${s}`, () => {
    assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app(s) }), 'closed')
  })
}
test('shouldPreferApplicationOverDismissedWhenBothPresent', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'dismissed', application: app('ready') }), 'decided')
})
```


- [ ] **Step 2: Run to verify it fails**

Run: `node --import tsx --test packages/core/src/opportunity-stage.test.ts`
Expected: FAIL (`deriveOpportunityStage` not exported).

- [ ] **Step 3: Implement** — `packages/core/src/opportunity-stage.ts`

```ts
import type { Application } from './application.js'
import type { OpportunityUserDecision } from './opportunity-source.js'

export type OpportunityStage = 'new' | 'evaluated' | 'considered' | 'decided' | 'applied' | 'closed' | 'dismissed'

export interface OpportunityState {
  readonly assessed: boolean
  readonly decision: OpportunityUserDecision
  readonly application?: Application
}

export function deriveOpportunityStage({ assessed, decision, application }: OpportunityState): OpportunityStage {
  if (application) {
    if (application.status === 'ready') return 'decided'
    if (['applied', 'interviewing', 'offer'].includes(application.status)) return 'applied'
    return 'closed'
  }
  if (decision === 'dismissed') return 'dismissed'
  if (decision === 'interested') return 'considered'
  return assessed ? 'evaluated' : 'new'
}
```

In `packages/core/src/opportunity-source.ts:12` remove `| 'applied'`; in `packages/core/src/market-catalog.ts:198` delete the `| 'applied'` line (and its comment). In `index.ts` after line 185 add:
`export { deriveOpportunityStage } from './opportunity-stage.js'` and `export type { OpportunityStage, OpportunityState } from './opportunity-stage.js'`.
In `opportunity-source.test.ts:206-212` replace `'applied'` with `'dismissed'` (the test is about a decision surviving a closed posting). In `market-catalog.test.ts:260` drop `'applied'` from the list.

- [ ] **Step 4: Run** `npm run typecheck && node --import tsx --test packages/core/src/*.test.ts` — Expected: PASS (typecheck will also flag `packages/provena-web`/`market-postgres` uses of `'applied'`: `postgres-repositories.test.ts:91-93` uses a plain string `setDecision` so still compiles; web `index.ts:1350` is plain HTML string; fix any real error surfaced).
- [ ] **Step 5: Commit** `git add packages/core && git commit -m "feat(core): derive opportunity stage; drop 'applied' decision"`

---

### Task 2: Core commands — `decideToApply`, `markApplied`, repo lookup

**Files:**
- Modify: `packages/core/src/application.ts` (createApplication `status`, `ApplicationRepository.findByOpportunityId`, `MemoryApplicationRepository`, `markApplied`)
- Modify: `packages/core/src/opportunity-stage.ts` (add `decideToApply`)
- Modify: `packages/core/src/index.ts:185` (export `markApplied`, `decideToApply`)
- Test: `packages/core/src/application.test.ts`, `packages/core/src/opportunity-stage.test.ts`

**Interfaces:**
- Consumes: `deriveOpportunityStage`, `OpportunityState` (Task 1)
- Produces:
  - `createApplication(input: {..., status?: ApplicationStatus})` (default `'applied'`)
  - `ApplicationRepository.findByOpportunityId(id: string): Promise<Application | undefined>`
  - `markApplied(app: Application, nowIso?: string): Application`
  - `decideToApply(state: OpportunityState, input: { opportunityId: string; platform: string; url?: string }): Application`

- [ ] **Step 1: Failing tests**

Append to `opportunity-stage.test.ts`:

```ts
import { decideToApply } from './index.js'
const input = { opportunityId: 'opp-1', platform: 'greenhouse', url: 'https://x.example/1' }

for (const decision of ['seen', 'interested'] as const) {
  test(`shouldCreateReadyApplicationWhenDecidingFrom_${decision}`, () => {
    const a = decideToApply({ assessed: true, decision }, input)
    assert.equal(a.status, 'ready')
    assert.equal(a.opportunityId, 'opp-1')
  })
}
test('shouldReturnSameApplicationWhenAlreadyReady', () => {
  const existing = decideToApply({ assessed: true, decision: 'interested' }, input)
  assert.equal(decideToApply({ assessed: true, decision: 'interested', application: existing }, input), existing)
})
test('shouldReturnSameApplicationWhenAlreadyApplied', () => {
  const existing = { ...decideToApply({ assessed: true, decision: 'interested' }, input), status: 'applied' as const }
  assert.equal(decideToApply({ assessed: true, decision: 'interested', application: existing }, input), existing)
})
test('shouldThrowWhenApplicationClosed', () => {
  const closed = { ...decideToApply({ assessed: true, decision: 'interested' }, input), status: 'rejected' as const }
  assert.throws(() => decideToApply({ assessed: true, decision: 'interested', application: closed }, input), /closed/)
})
test('shouldThrowWhenDismissed', () => {
  assert.throws(() => decideToApply({ assessed: true, decision: 'dismissed' }, input), /dismissed/)
})
test('shouldThrowWhenNotAssessed', () => {
  assert.throws(() => decideToApply({ assessed: false, decision: 'new' }, input), /new/)
})
```

Append to `application.test.ts` (add `markApplied` to its import):

```ts
test('shouldMoveReadyToAppliedAndStampDateWhenMarkApplied', () => {
  const ready = createApplication({ platform: 'greenhouse', opportunityId: 'opp-1', status: 'ready' })
  const done = markApplied(ready, '2026-10-02T09:00:00.000Z')
  assert.equal(done.status, 'applied')
  assert.equal(done.appliedAt, '2026-10-02T09:00:00.000Z')
})
test('shouldThrowWhenMarkAppliedFromNonReady', () => {
  const applied = createApplication({ platform: 'greenhouse' })
  assert.throws(() => markApplied(applied), /ready/)
})
test('shouldFindApplicationByOpportunityIdWhenSaved', async () => {
  const repo = new MemoryApplicationRepository()
  const a = createApplication({ platform: 'greenhouse', opportunityId: 'opp-9' })
  await repo.save(a)
  assert.equal((await repo.findByOpportunityId('opp-9'))?.id, a.id)
  assert.equal(await repo.findByOpportunityId('nope'), undefined)
})
```

- [ ] **Step 2:** `node --import tsx --test packages/core/src/application.test.ts packages/core/src/opportunity-stage.test.ts` — Expected: FAIL.

- [ ] **Step 3: Implement**

`application.ts`:
- `createApplication` input adds `status?: ApplicationStatus`; replace `status: 'applied'` with `status: input.status ?? 'applied'`.
- `ApplicationRepository` adds `findByOpportunityId(opportunityId: string): Promise<Application | undefined>`.
- `MemoryApplicationRepository` adds:
```ts
  async findByOpportunityId(opportunityId: string): Promise<Application | undefined> {
    return [...this.#applications.values()].find((a) => a.opportunityId === opportunityId)
  }
```
- After `transitionApplication`:
```ts
export function markApplied(application: Application, nowIso: string = new Date().toISOString()): Application {
  if (application.status !== 'ready') throw new Error(`cannot mark applied from "${application.status}": application must be ready`)
  return { ...transitionApplication(application, 'applied'), appliedAt: nowIso }
}
```

`opportunity-stage.ts`:
```ts
import { createApplication } from './application.js'

export function decideToApply(
  state: OpportunityState,
  input: { opportunityId: string; platform: string; url?: string },
): Application {
  const stage = deriveOpportunityStage(state)
  if (stage === 'decided' || stage === 'applied') return state.application!
  if (stage === 'evaluated' || stage === 'considered') {
    return createApplication({ ...input, status: 'ready' })
  }
  throw new Error(`cannot decide to apply from stage "${stage}"` + (stage === 'closed' ? ': an application already exists for this opportunity' : ''))
}
```
Export `markApplied`, `decideToApply` in `index.ts`.

- [ ] **Step 4:** `npm run typecheck && node --import tsx --test packages/core/src/*.test.ts` — Expected: PASS. (`KvApplicationRepository` now fails typecheck until Task 3; do Task 3 Step 3's repo method first if running typecheck for the whole repo.)
- [ ] **Step 5: Commit** `git commit -am "feat(core): decideToApply, markApplied, findByOpportunityId"`

---

### Task 3: Web routes + chain test

**Files:**
- Modify: `packages/provena-web/src/kv-application-repository.ts` (add `findByOpportunityId`)
- Modify: `packages/provena-web/src/index.ts` (~1626 decision route; ~1676 POST /api/applications; ~1696 update route)
- Test: `packages/provena-web/src/applications.test.ts`

**Interfaces:**
- Consumes: `deriveOpportunityStage`, `decideToApply`, `markApplied`, `ApplicationRepository.findByOpportunityId`
- Produces: `POST /api/opportunities/decide` body `{id, platform?: string, url?: string}` → `201 {application, stage:'decided'}` (new) | `200` (existing) | `404` unknown opportunity | `409` invalid stage. `POST /api/applications/update` with `{id, status:'applied'}` from `ready` now stamps `appliedAt` via `markApplied`.

- [ ] **Step 1: Failing tests** — append to `applications.test.ts` (reuse `kvEnv`, `jsonPost`):

```ts
const seedOpportunity = async (env: any, id = 'opp-1', userDecision = 'new') =>
  env.PROVENA_KV.put('opportunities_memory', JSON.stringify({ opportunities: [{ id, userDecision, raw: { url: 'https://x.example/1', title: 'Eng', source: 'greenhouse', description: '' }, evaluation: {} }] }))

test('shouldRunFullChainWhenOpportunityDecidedThenApplied', async () => {
  const env = kvEnv()
  await seedOpportunity(env)

  const decided = await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)
  assert.equal(decided.status, 201)
  const { application } = await decided.json() as any
  assert.equal(application.status, 'ready')
  assert.equal(application.opportunityId, 'opp-1')

  const applied = await jsonPost('/api/applications/update', { id: application.id, status: 'applied' }, env)
  const body = await applied.json() as any
  assert.equal(body.application.status, 'applied')

  const listed = await (await worker.fetch(new Request('https://provena.example/api/applications'), env)).json() as any
  assert.equal(listed.applications.length, 1)
  assert.equal(listed.applications[0].status, 'applied')
})

test('shouldReturnSameApplicationWhenDecideCalledTwice', async () => {
  const env = kvEnv(); await seedOpportunity(env)
  const a = await (await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)).json() as any
  const bRes = await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)
  assert.equal(bRes.status, 200)
  assert.equal((await bRes.json() as any).application.id, a.application.id)
  const listed = await (await worker.fetch(new Request('https://provena.example/api/applications'), env)).json() as any
  assert.equal(listed.applications.length, 1)
})

test('shouldReturn404WhenDecidingUnknownOpportunity', async () => {
  const res = await jsonPost('/api/opportunities/decide', { id: 'nope', platform: 'greenhouse' }, kvEnv())
  assert.equal(res.status, 404)
})

test('shouldReturn409WhenDecidingDismissedOpportunity', async () => {
  const env = kvEnv(); await seedOpportunity(env, 'opp-1', 'dismissed')
  assert.equal((await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)).status, 409)
})

test('shouldReturn409WhenCreatingSecondApplicationForSameOpportunity', async () => {
  const env = kvEnv(); await seedOpportunity(env)
  await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)
  assert.equal((await jsonPost('/api/applications', { platform: 'greenhouse', opportunityId: 'opp-1' }, env)).status, 409)
})

test('shouldPersistInterestedDecisionWhenDecidingFromNew', async () => {
  const env = kvEnv(); await seedOpportunity(env)
  await jsonPost('/api/opportunities/decide', { id: 'opp-1', platform: 'greenhouse' }, env)
  const stored = await env.PROVENA_KV.get('opportunities_memory', 'json') as any
  assert.equal(stored.opportunities[0].userDecision, 'interested')
})
```

- [ ] **Step 2:** `cd packages/provena-web && node --import tsx --test src/applications.test.ts` — Expected: FAIL (404 route missing).

- [ ] **Step 3: Implement**

`kv-application-repository.ts` add:
```ts
  async findByOpportunityId(opportunityId: string): Promise<Application | undefined> {
    return (await this.readAll()).find((a) => a.opportunityId === opportunityId)
  }
```

`index.ts`: extract the persistence part of the existing decision route into a helper (above `export default`, near other helpers) and reuse it:

```ts
async function persistDecision(env: Env, id: string, decision: OpportunityUserDecision): Promise<void> {
  if (env.DATABASE_URL) {
    const sql = postgres(env.DATABASE_URL, { max: 1 })
    try { await new PostgresUserDecisionRepository(sql).setDecision(id, decision, 'valentin') } finally { await sql.end() }
  }
  if (env.PROVENA_KV) await new KvOpportunityRepository(env.PROVENA_KV).updateDecision(id, decision)
}

// Resolves {assessed, decision} for one opportunity; null when the opportunity is unknown.
async function resolveOpportunityState(env: Env, id: string): Promise<{ assessed: boolean; decision: OpportunityUserDecision } | null> {
  if (env.DATABASE_URL) {
    const sql = postgres(env.DATABASE_URL, { max: 1 })
    try {
      const rows = await sql<Array<{ d: string | null }>>`
        SELECT d.user_decision AS d FROM current_opportunity_assessments a
        LEFT JOIN user_opportunity_decisions d ON d.opportunity_id = a.opportunity_id AND d.user_id = 'valentin'
        WHERE a.opportunity_id = ${id} AND a.profile_id = 'valentin' LIMIT 1`
      if (rows.length === 0) return null
      return { assessed: true, decision: (rows[0]!.d ?? 'new') as OpportunityUserDecision }
    } finally { await sql.end() }
  }
  const opp = env.PROVENA_KV ? await new KvOpportunityRepository(env.PROVENA_KV).findById(id) : null
  return opp ? { assessed: true, decision: opp.userDecision } : null
}
```
Make the existing `/api/opportunities/decision` handler call `persistDecision`. Add the new route right after it:

```ts
    if (request.method === 'POST' && url.pathname === '/api/opportunities/decide') {
      try {
        if (!env.PROVENA_KV) return new Response('PROVENA_KV is not configured', { status: 503 })
        const body = (await request.json()) as { id?: string; platform?: string; url?: string }
        if (!body.id) return new Response('Missing id', { status: 400 })
        const base = await resolveOpportunityState(env, body.id)
        if (!base) return new Response('Opportunity not found', { status: 404 })
        const repository = new KvApplicationRepository(env.PROVENA_KV)
        const existing = await repository.findByOpportunityId(body.id)
        const application = decideToApply(
          { ...base, ...(existing ? { application: existing } : {}) },
          { opportunityId: body.id, platform: body.platform ?? 'other', ...(body.url ? { url: body.url } : {}) },
        )
        const created = application !== existing
        if (created) {
          await repository.save(application)
          if (base.decision === 'new' || base.decision === 'seen') await persistDecision(env, body.id, 'interested')
        }
        return new Response(JSON.stringify({ application, stage: deriveOpportunityStage({ ...base, application }) }), {
          status: created ? 201 : 200,
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 409 })
      }
    }
```
In `POST /api/applications` (before `createApplication`) add:
```ts
        if (typeof body.opportunityId === 'string' && body.opportunityId &&
            await new KvApplicationRepository(env.PROVENA_KV).findByOpportunityId(body.opportunityId)) {
          return new Response('An application already exists for this opportunity', { status: 409 })
        }
```
In `/api/applications/update`, replace `updated = transitionApplication(updated, body.status as ApplicationStatus)` with:
```ts
          updated = body.status === 'applied' && updated.status === 'ready'
            ? markApplied(updated)
            : transitionApplication(updated, body.status as ApplicationStatus)
```
Add `decideToApply, deriveOpportunityStage, markApplied` to the `@provena/core` import in `index.ts`.

- [ ] **Step 4:** `npm run typecheck && npm test` — Expected: PASS.
- [ ] **Step 5: Commit** `git commit -am "feat(web): decide-to-apply route, applied stamp, one application per opportunity"`

---

### Task 4: Inbox shows stage and valid actions

**Files:**
- Modify: `packages/provena-web/src/index.ts` (items mapping ~1465-1478; row template ~1335-1355; add `decideToApply`/`markApplied` client fns near `setDecision` ~1387)
- Test: `packages/provena-web/src/pages.test.ts` (or `attention-data-path.test.ts` if it already asserts inbox HTML — check first with `grep -n "Apply" packages/provena-web/src/*.test.ts`)

**Interfaces:**
- Consumes: `deriveOpportunityStage`, `KvApplicationRepository.list`
- Produces: each inbox item has `stage: OpportunityStage` and `applicationId?: string`; row buttons: `⭐ Save`, `✗ Dismiss` always; `Decide to apply` when stage ∈ `evaluated|considered`; `Mark applied` only when stage = `decided`; a stage badge otherwise.

- [ ] **Step 1: Failing test.** Add a test asserting the rendered inbox script/page no longer contains the old `✓ Apply` / `setDecision(…'applied')` button and contains `Mark applied` and `Decide to apply`:
```ts
test('shouldOfferDecideAndMarkAppliedInsteadOfLegacyApplyWhenRenderingInbox', async () => {
  const html = await (await worker.fetch(new Request('https://provena.example/inbox'), {} as never)).text()
  assert.ok(!html.includes("'applied')"))
  assert.ok(html.includes('Decide to apply'))
  assert.ok(html.includes('Mark applied'))
})
```
(Confirm the inbox route path with `grep -n "pathname === '/" packages/provena-web/src/index.ts` and use it.)

- [ ] **Step 2:** run it — Expected: FAIL.

- [ ] **Step 3: Implement.**
Server, before `const items = pageItems.map(`:
```ts
            const appsByOpp = new Map(
              (env.PROVENA_KV ? await new KvApplicationRepository(env.PROVENA_KV).list() : [])
                .filter((a) => a.opportunityId).map((a) => [a.opportunityId as string, a]),
            )
```
In the item object add:
```ts
              stage: deriveOpportunityStage({ assessed: true, decision: (r.userDecision || 'new') as OpportunityUserDecision, ...(appsByOpp.get(r.id) ? { application: appsByOpp.get(r.id)! } : {}) }),
              applicationId: appsByOpp.get(r.id)?.id,
```
Row template: replace the `✓ Apply` button with
```js
(item.stage === 'evaluated' || item.stage === 'considered'
  ? '<button title="Decide to apply" onclick="decideToApply(\\'' + item.id + '\\')">Decide to apply</button>'
  : item.stage === 'decided'
    ? '<button class="active" title="Mark applied" onclick="markApplied(\\'' + item.applicationId + '\\')">Mark applied</button>'
    : '<span class="badge ' + item.stage + '">' + item.stage + '</span>') +
```
Client fns next to `setDecision`:
```js
async function decideToApply(id) {
  await fetch('/api/opportunities/decide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, platform: 'other' }) })
  switchTab(currentTab)
}
async function markApplied(applicationId) {
  await fetch('/api/applications/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: applicationId, status: 'applied' }) })
  switchTab(currentTab)
}
```
Keep the `⭐ Save` / `✗ Dismiss` buttons as they are. (`.badge.applied` CSS already exists.)

- [ ] **Step 4:** `npm run typecheck && npm test` — Expected: PASS. Then smoke manually: `npm run dev` in `packages/provena-web` if available, load the inbox, confirm the three states render (report honestly if not run).
- [ ] **Step 5: Commit** `git commit -am "feat(web): inbox stage and decide/mark-applied actions"`

---

### Task 5: Postgres guard + backfill (CONDITIONAL on measured count)

**Files:**
- Modify: `packages/market-postgres/src/postgres-user-decision-repository.ts`, `packages/market-postgres/src/postgres-repositories.test.ts:91-93`
- Create (only if count > 0): `scripts/backfill-applied-decisions.mjs`

- [ ] **Step 1:** Wait for the Neon count (`SELECT count(*), min(updated_at), max(updated_at) FROM user_opportunity_decisions WHERE user_decision='applied'`).
- [ ] **Step 2: Reject `'applied'`.** In `setDecision`, change the `decision` param type to `Exclude<OpportunityUserDecision, never>`-equivalent — simply import `OpportunityUserDecision` from `@provena/core`, type the param with it, and update `postgres-repositories.test.ts:91-93` to use `'interested'`. Run `npm run typecheck && npm test` — Expected: PASS.
- [ ] **Step 3: If count = 0** → done, no script. **If N > 0** → write `scripts/backfill-applied-decisions.mjs` using the `postgres` driver and `KvApplicationRepository`-compatible JSON: for each `applied` row without an Application for that `opportunity_id` (idempotent check), create `Application{status:'applied', appliedAt: updated_at, platform:'other', opportunityId}`; write via `wrangler kv key put applications`; then `UPDATE … SET user_decision='interested'`. Dry-run flag by default; print the plan before writing. Exact script is written once N and the KV access path are known.
- [ ] **Step 4: Commit** `git commit -am "feat(market-postgres): reject applied as a stored decision"` (+ script if any).

---

## Self-review

- **Spec coverage:** stage table → T1; decideToApply/markApplied/idempotence/closed conflict → T2; findByOpportunityId, KV reuse → T2/T3; Postgres reject + backfill-after-measure → T5; routes, Inbox, `Mark applied` only at `decided` → T3/T4; chain + negative → T3 (chain) / T4 (button visibility). E2E in CI → covered by `npm test`.
- **Type consistency:** `OpportunityState`, `deriveOpportunityStage`, `decideToApply(state,{opportunityId,platform,url?})`, `markApplied(app, nowIso?)`, `findByOpportunityId` used identically across tasks.
- **Known soft spot:** Task 4's Postgres inbox path has no automated test (needs a live DB); verified by manual smoke only.
