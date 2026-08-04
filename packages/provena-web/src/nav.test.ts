import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteNav } from './index.js'

test('siteNav renders the brand and both section links', () => {
  const html = siteNav('story')
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Prepare</a>'))
})

test('siteNav marks the current section active and the other inactive', () => {
  assert.ok(siteNav('story').includes('<a class="active" href="/">Story</a>'))
  assert.ok(!siteNav('story').includes('class="active" href="/cv"'))
  assert.ok(siteNav('prepare').includes('<a class="active" href="/cv">Prepare</a>'))
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
