import type { AttentionTab } from './opportunity-ranking-policy.js'

export interface OpportunityBookmark {
  readonly bookmarkVersion: 1
  readonly orderingVersion: 1
  readonly tab: AttentionTab
  readonly tier: number
  readonly pf: number
  readonly conf: number
  readonly seen: string
  readonly id: string
}

export function encodeBookmark(payload: OpportunityBookmark): string {
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeBookmark(bookmarkStr: string, expectedTab?: AttentionTab): OpportunityBookmark | null {
  try {
    let b64 = bookmarkStr.replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4 !== 0) b64 += '='
    const binary = atob(b64)
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0))
    const jsonStr = new TextDecoder().decode(bytes)
    const parsed = JSON.parse(jsonStr) as OpportunityBookmark
    if (
      parsed &&
      parsed.bookmarkVersion === 1 &&
      parsed.orderingVersion === 1 &&
      parsed.id &&
      (!expectedTab || parsed.tab === expectedTab)
    ) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}
