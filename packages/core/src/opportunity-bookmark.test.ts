import { test } from 'node:test'
import assert from 'node:assert/strict'
import { encodeBookmark, decodeBookmark } from './opportunity-bookmark.js'

test('encodeBookmark and decodeBookmark roundtrip versioned payload', () => {
  const payload = {
    bookmarkVersion: 1 as const,
    orderingVersion: 1 as const,
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
