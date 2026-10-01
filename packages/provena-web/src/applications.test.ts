import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

function kvEnv() {
  const store = new Map<string, string>()
  const env = {
    PROVENA_KV: {
      get: async (key: string, type?: string) => {
        const v = store.get(key)
        if (v === undefined) return null
        return type === 'json' ? JSON.parse(v) : v
      },
      put: async (key: string, value: string) => {
        store.set(key, value)
      },
    },
  } as never
  return env
}

const jsonPost = (path: string, body: unknown, env: never) =>
  worker.fetch(new Request('https://provena.example' + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }), env)

test('GET /applications renders the Applications page with nav, summary and add form', async () => {
  const res = await worker.fetch(new Request('https://provena.example/applications'), {} as never)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<h1>Applications</h1>'))
  assert.ok(html.includes('<a class="active" href="/applications">Applications</a>'))
  assert.ok(html.includes('id="add-form"'))
  assert.ok(html.includes('Application Kit'))
})

test('GET /kit renders copyable fields from the embedded profile', async () => {
  const res = await worker.fetch(new Request('https://provena.example/kit'), {} as never)
  const html = await res.text()
  assert.ok(html.includes('<h1>Application Kit</h1>'))
  assert.ok(html.includes('valentinlineiro@gmail.com'))
  assert.ok(html.includes('+34658996759'))
  assert.ok(html.includes('id="copy-all"'))
  assert.ok((html.match(/class="kit-copy"/g) || []).length > 10)
})

test('POST /api/applications creates an application that the dashboard lists with summary', async () => {
  const env = kvEnv()
  const created = await jsonPost('/api/applications', { platform: 'greenhouse', url: 'https://jobs.example/42' }, env)
  assert.equal(created.status, 201)
  const { application } = await created.json() as { application: { id: string; status: string } }
  assert.equal(application.status, 'applied')

  const listed = await (await worker.fetch(new Request('https://provena.example/api/applications'), env)).json() as any
  assert.equal(listed.applications.length, 1)
  assert.equal(listed.summary.active.length, 1)
  assert.equal(listed.summary.waitingOnCompany.length, 1)
  assert.ok(listed.statuses.includes('interviewing'))
  assert.ok(listed.platforms.includes('greenhouse'))
})

test('POST /api/applications rejects an unknown platform with 400', async () => {
  const res = await jsonPost('/api/applications', { platform: 'monster' }, kvEnv())
  assert.equal(res.status, 400)
  assert.match(await res.text(), /platform/)
})

test('POST /api/applications/update transitions status and records the next action', async () => {
  const env = kvEnv()
  const { application } = await (await jsonPost('/api/applications', { platform: 'lever' }, env)).json() as { application: { id: string } }

  const transitioned = await jsonPost('/api/applications/update', { id: application.id, status: 'interviewing' }, env)
  assert.equal(transitioned.status, 200)

  const withAction = await jsonPost('/api/applications/update', {
    id: application.id,
    nextAction: 'Prepare system design',
    nextActionDue: '2026-10-07',
  }, env)
  assert.equal(withAction.status, 200)

  const listed = await (await worker.fetch(new Request('https://provena.example/api/applications'), env)).json() as any
  assert.equal(listed.applications[0].status, 'interviewing')
  assert.equal(listed.applications[0].nextAction, 'Prepare system design')
  assert.equal(listed.summary.nextActions.length, 1)
  assert.equal(listed.summary.nextActions[0].due, '2026-10-07')
})

test('POST /api/applications/update rejects an invalid transition with 409', async () => {
  const env = kvEnv()
  const { application } = await (await jsonPost('/api/applications', { platform: 'lever' }, env)).json() as { application: { id: string } }

  const res = await jsonPost('/api/applications/update', { id: application.id, status: 'ready' }, env)
  assert.equal(res.status, 409)
  assert.match(await res.text(), /cannot transition/)
})

test('POST /api/applications/update returns 404 for an unknown application', async () => {
  const res = await jsonPost('/api/applications/update', { id: 'app-missing', status: 'interviewing' }, kvEnv())
  assert.equal(res.status, 404)
})
