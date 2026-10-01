import { test } from 'node:test'
import assert from 'node:assert/strict'
import postgres from 'postgres'
import worker from './index.js'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://provena:provena@localhost:5432/provena_test'
const ID = 'opp-stage-pg-1'

function kvEnv(databaseUrl: string) {
  const store = new Map<string, string>()
  return {
    DATABASE_URL: databaseUrl,
    PROVENA_KV: {
      get: async (key: string, type?: string) => {
        const v = store.get(key)
        return v === undefined ? null : type === 'json' ? JSON.parse(v) : v
      },
      put: async (key: string, value: string) => { store.set(key, value) },
    },
  } as never
}

const post = (path: string, body: unknown, env: never) =>
  worker.fetch(new Request('https://provena.example' + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), env)

const inboxStage = async (env: never) => {
  for (const tab of ['needs-attention', 'worth-considering', 'unresolved', 'decided']) {
    const res = await worker.fetch(new Request(`https://provena.example/api/opportunities?tab=${tab}&limit=50`), env)
    const body = await res.json() as { items: Array<{ id: string; stage: string; applicationId?: string }> }
    const hit = body.items.find((i) => i.id === ID)
    if (hit) return hit
  }
  return undefined
}

test('shouldDeriveStageFromPostgresDecisionAndKvApplicationWhenListingInbox', async (t) => {
  const sql = postgres(DATABASE_URL, { max: 1 })
  try {
    await sql`SELECT 1 FROM current_opportunity_assessments LIMIT 1`
  } catch {
    await sql.end().catch(() => {})
    t.skip('Postgres with the market schema is not available')
    return
  }
  try {
    await sql`INSERT INTO opportunities (id, company_name, title, normalized_title) VALUES (${ID}, 'Test Corp', 'Engineer', 'engineer') ON CONFLICT (id) DO NOTHING`
    await sql`INSERT INTO opportunity_postings (id, opportunity_id, source_type, external_id, url, first_seen_at, last_seen_at, status, raw_description)
              VALUES (${ID + '-p'}, ${ID}, 'greenhouse', ${ID}, 'https://x.example/pg', NOW(), NOW(), 'ACTIVE', 'd') ON CONFLICT (id) DO NOTHING`
    await sql`INSERT INTO opportunity_assessments (opportunity_id, recommendation, decision_tier, professional_fit, personal_fit, confidence)
              VALUES (${ID}, 'STRONG_FIT', 4, 8, 8, 0.9) ON CONFLICT DO NOTHING`
    await sql`DELETE FROM user_opportunity_decisions WHERE opportunity_id = ${ID}`

    const env = kvEnv(DATABASE_URL)
    assert.equal((await inboxStage(env))?.stage, 'evaluated')

    const decided = await post('/api/opportunities/decide', { id: ID, platform: 'greenhouse' }, env)
    assert.equal(decided.status, 201)
    const { application } = await decided.json() as { application: { id: string } }
    const afterDecide = await inboxStage(env)
    assert.equal(afterDecide?.stage, 'decided')
    assert.equal(afterDecide?.applicationId, application.id)

    await post('/api/applications/update', { id: application.id, status: 'applied' }, env)
    assert.equal((await inboxStage(env))?.stage, 'applied')
  } finally {
    await sql`DELETE FROM opportunities WHERE id = ${ID}`
    await sql.end()
  }
})
