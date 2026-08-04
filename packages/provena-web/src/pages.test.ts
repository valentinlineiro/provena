import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = {} as never

test('Home renders the site nav with Story active and no Prepare CV button', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('<nav class="site">'))
  assert.equal((html.match(/<nav class="site">/g) || []).length, 1)
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Prepare</a>'))
  assert.ok(!html.includes('Prepare CV'))
})

test('Prepare page renders the site nav with Prepare active and no back link', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.equal((html.match(/<nav class="site">/g) || []).length, 1)
  assert.ok(html.includes('<a href="/">Story</a>'))
  assert.ok(html.includes('<a class="active" href="/cv">Prepare</a>'))
  assert.ok(html.includes('<h1>Prepare</h1>'))
  assert.ok(html.includes('Target a role, review suggestions, export.'))
  assert.ok(!html.includes('← Home'))
  assert.ok(!html.includes('Preview CV'))
  assert.ok(html.includes('Your CV'))
  assert.ok(html.includes('Download .md'))
  assert.ok(html.includes('Open HTML / Print PDF'))
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