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

export class DefaultOpportunityRankingPolicy {
  rank(assessments: readonly UserOpportunityAssessment[]): readonly RankedOpportunity[] {
    return assessments
      .map(assessment => {
        const tier = assessment.recommendation
        // RankScore calculation: Base tier priority weight + combined fit/confidence score
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
      .sort((a, b) => b.rankScore - a.rankScore)
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
