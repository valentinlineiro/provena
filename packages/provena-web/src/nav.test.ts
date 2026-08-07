import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteNav, renderAppShell } from './index.js'

test('siteNav renders the brand and both section links', () => {
  const html = siteNav('story')
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Identity</a>'))
})

test('siteNav marks the current section active and the other inactive', () => {
  assert.ok(siteNav('story').includes('<a class="active" href="/">Story</a>'))
  assert.ok(!siteNav('story').includes('class="active" href="/cv"'))
  assert.ok(siteNav('prepare').includes('<a class="active" href="/cv">Identity</a>'))
  assert.ok(!siteNav('prepare').includes('class="active" href="/"'))
})

test('siteNav never renders the reserved Career section', () => {
  assert.ok(!siteNav('story').includes('Career'))
  assert.ok(!siteNav('prepare').includes('Career'))
})

test('siteNav renders the Evaluate section', () => {
  assert.ok(siteNav('story').includes('<a href="/evaluate">Evaluate</a>'))
  assert.ok(siteNav('evaluate').includes('<a class="active" href="/evaluate">Evaluate</a>'))
  assert.ok(!siteNav('evaluate').includes('class="active" href="/"'))
})

test('renderAppShell outputs structural wrapper with app-shell, app-header, site-nav, page, page-content, and header/content HTML', () => {
  const headerHtml = '<div class="header-test">Header Content</div>'
  const contentHtml = '<div class="content-test">Page Main Content</div>'
  const html = renderAppShell('story', headerHtml, contentHtml)

  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<header class="app-header">'))
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<nav class="site-nav">'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<main class="page">'))
  assert.ok(html.includes('<div class="page-content">'))
  assert.ok(html.includes(headerHtml))
  assert.ok(html.includes(contentHtml))
})

test('renderAppShell outputs correct active section links for prepare and evaluate', () => {
  const prepareHtml = renderAppShell('prepare', '', '')
  assert.ok(prepareHtml.includes('<nav class="site-nav">'))
  assert.ok(prepareHtml.includes('<a class="active" href="/cv">Identity</a>'))
  assert.ok(!prepareHtml.includes('class="active" href="/"'))

  const evaluateHtml = renderAppShell('evaluate', '', '')
  assert.ok(evaluateHtml.includes('<nav class="site-nav">'))
  assert.ok(evaluateHtml.includes('<a class="active" href="/evaluate">Evaluate</a>'))
  assert.ok(!evaluateHtml.includes('class="active" href="/"'))
})

test('siteNav renders the Sources section', () => {
  assert.ok(siteNav('story').includes('<a href="/sources">Sources</a>'))
  assert.ok(siteNav('sources').includes('<a class="active" href="/sources">Sources</a>'))
  assert.ok(!siteNav('sources').includes('class="active" href="/"'))
})

test('renderAppShell includes intent-based navigation prefetch script', () => {
  const html = renderAppShell('story', '<h1>Title</h1>', '<div>Content</div>')
  assert.ok(html.includes('prefetched = new Set') || html.includes('s=new Set'))
  assert.ok(html.includes('.site-nav a:not(.active)'))
})

