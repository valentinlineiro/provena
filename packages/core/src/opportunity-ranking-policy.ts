// ── O2.7B: Opportunity Ranking Policy & Attention Set ────────────────────────
//
// Separates ranking logic from individual assessments.
// Rule: Policy tier dominates score. Score/confidence sort within tier.
//
// Tier Order:
//   1. strong-candidate
//   2. consider
//   3. abstain (uncertainty explicit)
//   4. skip (hard constraint / eligibility violation)

import type { UserOpportunityAssessment } from './market-catalog.js'

export interface RankedOpportunity {
  readonly assessment: UserOpportunityAssessment
  readonly rankScore: number
  readonly tier: 'strong-candidate' | 'consider' | 'abstain' | 'skip'
}

export interface AttentionInbox {
  readonly needsAttention: readonly RankedOpportunity[]      // strong-candidate
  readonly worthConsidering: readonly RankedOpportunity[]     // consider
  readonly uncertain: readonly RankedOpportunity[]            // abstain
  readonly filtered: readonly RankedOpportunity[]             // skip
  readonly attentionSetCount: number                         // needsAttention + worthConsidering
  readonly totalObservedMarket: number
  readonly attentionReductionRatio: number                   // 1 - (attentionSet / observedMarket)
}

export type AttentionTab = 'needs-attention' | 'worth-considering' | 'unresolved' | 'decided'

export interface AttentionCursorPayload {
  readonly v: 1
  readonly tab: AttentionTab
  readonly pf: number
  readonly c: number
  readonly pers: number
  readonly pub: string
  readonly id: string
}

export interface PaginatedAttentionView {
  readonly tab: AttentionTab
  readonly items: readonly RankedOpportunity[]
  readonly nextCursor: string | null
  readonly totalInTab: number
}

export class DefaultOpportunityRankingPolicy {
  // Lexicographical order:
  // 1. professionalFitScore desc
  // 2. confidence desc
  // 3. personalFitScore desc
  // 4. publishedAt desc
  // 5. opportunityId asc (stable tie-breaker)
  compareLexicographically(a: UserOpportunityAssessment, b: UserOpportunityAssessment): number {
    if (b.professionalFitScore !== a.professionalFitScore) {
      return b.professionalFitScore - a.professionalFitScore
    }
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence
    }
    if (b.personalFitScore !== a.personalFitScore) {
      return b.personalFitScore - a.personalFitScore
    }
    const pubA = a.evaluatedAt || ''
    const pubB = b.evaluatedAt || ''
    if (pubB !== pubA) {
      return pubB.localeCompare(pubA)
    }
    return a.opportunityId.localeCompare(b.opportunityId)
  }

  rank(assessments: readonly UserOpportunityAssessment[]): readonly RankedOpportunity[] {
    return assessments
      .map(assessment => {
        const tier = assessment.recommendation
        const tierWeight =
          tier === 'strong-candidate' ? 1000 :
          tier === 'consider' ? 500 :
          tier === 'abstain' ? 100 : 0

        const fitScore = (assessment.professionalFitScore * 0.7) + (assessment.personalFitScore * 0.3)
        const rankScore = tierWeight + (fitScore * assessment.confidence)

        return {
          assessment,
          rankScore: Math.round(rankScore * 100) / 100,
          tier,
        }
      })
      .sort((a, b) => {
        // Tier dominates
        if (b.rankScore !== a.rankScore) {
          const tierA = a.tier === 'strong-candidate' ? 4 : a.tier === 'consider' ? 3 : a.tier === 'abstain' ? 2 : 1
          const tierB = b.tier === 'strong-candidate' ? 4 : b.tier === 'consider' ? 3 : b.tier === 'abstain' ? 2 : 1
          if (tierB !== tierA) return tierB - tierA
        }
        // Lexicographical sorting within tier
        return this.compareLexicographically(a.assessment, b.assessment)
      })
  }

  encodeCursor(tab: AttentionTab, assessment: UserOpportunityAssessment): string {
    const payload: AttentionCursorPayload = {
      v: 1,
      tab,
      pf: Math.round(assessment.professionalFitScore * 100) / 100,
      c: Math.round(assessment.confidence * 100) / 100,
      pers: Math.round(assessment.personalFitScore * 100) / 100,
      pub: assessment.evaluatedAt || '',
      id: assessment.opportunityId,
    }
    const jsonStr = JSON.stringify(payload)
    return Buffer.from(jsonStr, 'utf-8').toString('base64url')
  }

  decodeCursor(cursorStr: string, expectedTab: AttentionTab): AttentionCursorPayload | null {
    try {
      const jsonStr = Buffer.from(cursorStr, 'base64url').toString('utf-8')
      const parsed = JSON.parse(jsonStr) as AttentionCursorPayload
      if (parsed && parsed.v === 1 && parsed.tab === expectedTab && parsed.id) {
        return parsed
      }
      return null
    } catch {
      return null
    }
  }

  paginateTab(
    rankedItems: readonly RankedOpportunity[],
    tab: AttentionTab,
    cursorStr?: string | null,
    limit = 30,
  ): PaginatedAttentionView {
    const cursor = cursorStr ? this.decodeCursor(cursorStr, tab) : null

    // Filter items to tab
    const tabItems = [...rankedItems].sort((a, b) => this.compareLexicographically(a.assessment, b.assessment))

    let startIndex = 0
    if (cursor) {
      const foundIdx = tabItems.findIndex(item => {
        const a = item.assessment
        const comp = this.compareLexicographically(a, {
          opportunityId: cursor.id,
          professionalFitScore: cursor.pf,
          confidence: cursor.c,
          personalFitScore: cursor.pers,
          evaluatedAt: cursor.pub,
        } as any)
        return comp > 0 // item comes AFTER the cursor in sort order
      })
      if (foundIdx !== -1) {
        startIndex = foundIdx
      } else {
        startIndex = tabItems.length
      }
    }

    const pageItems = tabItems.slice(startIndex, startIndex + limit)
    const hasMore = startIndex + limit < tabItems.length
    const lastItem = pageItems[pageItems.length - 1]

    const nextCursor = hasMore && lastItem
      ? this.encodeCursor(tab, lastItem.assessment)
      : null

    return {
      tab,
      items: pageItems,
      nextCursor,
      totalInTab: tabItems.length,
    }
  }

  buildAttentionInbox(
    ranked: readonly RankedOpportunity[],
    totalObservedMarket: number,
  ): AttentionInbox {
    const needsAttention = ranked.filter(r => r.tier === 'strong-candidate')
    const worthConsidering = ranked.filter(r => r.tier === 'consider')
    const uncertain = ranked.filter(r => r.tier === 'abstain')
    const filtered = ranked.filter(r => r.tier === 'skip')

    const attentionSetCount = needsAttention.length + worthConsidering.length
    const attentionReductionRatio = totalObservedMarket > 0
      ? Math.round((1 - (attentionSetCount / totalObservedMarket)) * 1000) / 10
      : 0

    return {
      needsAttention,
      worthConsidering,
      uncertain,
      filtered,
      attentionSetCount,
      totalObservedMarket,
      attentionReductionRatio,
    }
  }
}

