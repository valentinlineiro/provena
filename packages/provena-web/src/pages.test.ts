import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = {} as never

test('Home renders the site nav with Story active and no Prepare CV button', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('<nav class="site-nav">'))
  assert.equal((html.match(/<nav class="site-nav">/g) || []).length, 1)
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Identity</a>'))
  assert.ok(!html.includes('Prepare CV'))
})

test('Home renders within AppShell and SplitView with Story content and Career Compass', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'), 'Missing app-shell')
  assert.ok(html.includes('<div class="split-view" style="--split-threshold: 56rem;">'), 'Missing split-view with 56rem threshold')
  assert.ok(html.includes('Current chapter'), 'Missing Current chapter')
  assert.ok(html.includes('Career Compass'), 'Missing Career Compass')
  assert.ok(html.includes('Market Activity'), 'Missing Market Activity')
  assert.ok(html.includes('Recent evidence'), 'Missing Recent evidence')
})


test('Prepare page renders the site nav with Prepare active and no back link', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.equal((html.match(/<nav class="site-nav">/g) || []).length, 1)
  assert.ok(html.includes('<a href="/">Story</a>'))
  assert.ok(html.includes('<a class="active" href="/cv">Identity</a>'))
  assert.ok(html.includes('<h1>Identity</h1>'))
  assert.ok(html.includes('Your canonical professional identity model.'))
  assert.ok(!html.includes('← Home'))
  assert.ok(!html.includes('Preview CV'))
  assert.ok(html.includes('Export'))
  assert.ok(html.includes('Download PDF'))
  assert.ok(html.includes('JSON Resume'))
  assert.ok(html.includes("addEventListener('input', preview)"))
  assert.ok(html.includes('.cv-workspace'))
  assert.ok(html.includes('.cv-workspace-sidebar'))
  assert.ok(html.includes('.cv-canvas'))
  assert.ok(html.includes('.cv-sheet'))
  assert.ok(html.includes('@media print'))
})

test('POST /api/cv/preview returns docHtml along with markdown and cv', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/cv/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  }), env)
  const json = await res.json() as any
  assert.ok(json.markdown)
  assert.ok(json.cv)
  assert.ok(json.docHtml)
})

test('AppShell HTML templates include container queries and layout primitives', async () => {
  const routes = ['/', '/cv', '/evaluate']
  for (const route of routes) {
    const res = await worker.fetch(new Request(`https://provena.example${route}`), env)
    const html = await res.text()
    assert.ok(html.includes('container-type: inline-size'), `Missing container-type in ${route}`)
    assert.ok(html.includes('container-name: page'), `Missing container-name in ${route}`)
    assert.ok(html.includes('.stack'), `Missing .stack in ${route}`)
    assert.ok(html.includes('.readable'), `Missing .readable in ${route}`)
    assert.ok(html.includes('.split-view'), `Missing .split-view in ${route}`)
    assert.ok(html.includes('.action-bar'), `Missing .action-bar in ${route}`)
    assert.ok(html.includes('.bottom-sheet'), `Missing .bottom-sheet in ${route}`)
  }
})

test('Responsive validation gate assertions for /evaluate', async () => {
  const res = await worker.fetch(new Request('https://provena.example/evaluate'), env)
  const html = await res.text()

  // Assert that button touch targets meet minimum sizing (padding: 0.75rem or min-height: 44px)
  assert.ok(
    html.includes('padding: 0.75rem') || html.includes('min-height: 44px'),
    'Button touch targets must meet minimum sizing (padding: 0.75rem or min-height: 44px)'
  )

  // Assert sticky positioning and backdrop styling for compact .action-bar rules
  assert.ok(
    html.includes('position: sticky') && (html.includes('backdrop-filter') || html.includes('background: rgba')),
    '.action-bar must feature sticky positioning and backdrop styling'
  )

  // Assert no fixed pixel width constraints on input containers (textarea uses width 100%)
  assert.ok(
    html.includes('width: 100%'),
    'Input containers (textarea) must use width 100%'
  )
  assert.ok(
    !/textarea\s*\{[^}]*width:\s*\d+px/.test(html),
    'Input containers (textarea) must not have fixed pixel width constraints'
  )
})

test('GET /opportunities renders within app-shell with Inbox title and table', async () => {
  const res = await worker.fetch(new Request('https://provena.example/opportunities'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<h1>Attention Inbox</h1>'))
  assert.ok(html.includes('<a class="active" href="/opportunities">Inbox</a>'))
})

test('POST /api/opportunities/ingest is idempotent across repeated syncs of the same board', async () => {
  const store = new Map<string, string>()
  const kvEnv = {
    PROVENA_KV: {
      get: async (key: string, type?: string) => {
        const v = store.get(key)
        if (v === undefined) return null
        return type === 'json' ? JSON.parse(v) : v
      },
      put: async (key: string, value: string) => { store.set(key, value) },
    },
  } as never

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({
      jobs: [
        {
          id: 42,
          internal_job_id: 1,
          title: 'Senior MLOps Engineer',
          location: { name: 'Remote' },
          absolute_url: 'https://boards.greenhouse.io/acme/jobs/42',
          updated_at: '2026-01-01T00:00:00Z',
          content: '<p>Requirements: Python, Kubernetes, MLflow.</p>',
        },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  ) as typeof fetch

  try {
    const ingest = () => worker.fetch(new Request('https://provena.example/api/opportunities/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardToken: 'acme' }),
    }), kvEnv)

    const first = await (await ingest()).json() as { fetchedCount: number; newlyAddedCount: number; totalMemoryCount: number }
    assert.equal(first.fetchedCount, 1)
    assert.equal(first.newlyAddedCount, 1)
    assert.equal(first.totalMemoryCount, 1)

    const second = await (await ingest()).json() as { fetchedCount: number; newlyAddedCount: number; totalMemoryCount: number }
    assert.equal(second.fetchedCount, 1)
    assert.equal(second.newlyAddedCount, 0, 'repeated sync of the same board must not add duplicates')
    assert.equal(second.totalMemoryCount, 1, 'memory count must stay stable across repeated ingests')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('GET /api/opportunities gracefully returns empty response when PROVENA_KV is missing', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=unresolved&limit=30'), env)
  assert.equal(res.status, 200)
  const json = await res.json() as any
  assert.equal(json.tab, 'unresolved')
  assert.deepEqual(json.items, [])
  assert.equal(json.totalInTab, 0)
})

test('GET /api/opportunities accepts bookmark param and returns nextBookmark field', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=unresolved&limit=30'), env)
  const json = await res.json() as any
  assert.ok('nextBookmark' in json)
  assert.ok(!('nextCursor' in json))
})

test('GET /sources renders within app-shell with Observation Sources title and feeds list', async () => {
  const res = await worker.fetch(new Request('https://provena.example/sources'), env)
  assert.equal(res.status, 200)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<h1>Observation Sources</h1>'))
  assert.ok(html.includes('<a class="active" href="/sources">Sources</a>'))
})

test('GET /api/sources returns list of active market feeds', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/sources'), env)
  assert.equal(res.status, 200)
  const json = await res.json() as any
  assert.ok(Array.isArray(json.sources))
  assert.ok(json.sources.length >= 4)
  assert.equal(json.sources[0].name, 'Stripe Careers')
})

test('Inbox Materialization Invariant: sum of tab counts equals totalEvaluatedCount', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=needs-attention'), env)
  const data = await res.json() as any
  if (data.counts) {
    const sum = (data.counts['needs-attention'] || 0) + (data.counts['worth-considering'] || 0) + (data.counts['unresolved'] || 0) + (data.counts['decided'] || 0)
    assert.equal(data.totalEvaluatedCount ?? sum, sum, 'Total evaluated count must equal the sum of the 4 tabs')
  }
})

test('GET /api/opportunities?tab=unresolved materializes all non-attention non-consider items', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=unresolved'), env)
  assert.equal(res.status, 200)
  const json = await res.json() as any
  assert.equal(json.tab, 'unresolved')
  assert.equal(typeof json.counts['unresolved'], 'number')
})

test('Attention Inbox presentation contract: column order and Verdict visual dominance', async () => {
  const res = await worker.fetch(new Request('https://provena.example/opportunities'), env)
  const html = await res.text()

  // Column order verification
  const expectedHeaderPattern = /<table class="opp-table"><thead><tr><th>Opportunity<\/th><th>Verdict<\/th><th>Prof Fit<\/th><th>Personal Fit<\/th><th>Evidence<\/th><th>Action<\/th><\/tr><\/thead>/
  assert.ok(expectedHeaderPattern.test(html), 'Table columns must follow presentation contract: Opportunity → Verdict → Prof Fit → Personal Fit → Evidence → Action')

  // Verdict visual dominance verification
  assert.ok(html.includes('.badge {'), 'Must include .badge CSS definition')
  assert.ok(html.includes('font-weight: 800'), 'Verdict badges must use font-weight: 800 for visual dominance')
  assert.ok(html.includes('padding: 0.3rem 0.65rem'), 'Verdict badges must use padding: 0.3rem 0.65rem')
  assert.ok(html.includes('letter-spacing: 0.04em'), 'Verdict badges must use letter-spacing: 0.04em')
  assert.ok(html.includes('box-shadow: 0 1px 2px rgba(0,0,0,0.05)'), 'Verdict badges must use box-shadow')
  assert.ok(html.includes('.opp-table td:nth-child(2) { font-weight: 600; }'), 'Must set font-weight: 600 for second column cells')
  assert.ok(html.includes('.badge.strong-candidate'), 'Must style strong-candidate verdict')
  assert.ok(html.includes('.badge.consider'), 'Must style consider verdict')
  assert.ok(html.includes('.badge.skip'), 'Must style skip verdict')
})