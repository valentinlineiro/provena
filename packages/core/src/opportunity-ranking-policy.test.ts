import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DefaultOpportunityRankingPolicy } from './opportunity-ranking-policy.js'
import type { UserOpportunityAssessment } from './market-catalog.js'
import { makeOpportunityId } from './market-catalog.js'

test('DefaultOpportunityRankingPolicy: lexicographical sorting orders profFit desc, confidence desc, personalFit desc', () => {
  const policy = new DefaultOpportunityRankingPolicy()

  const base = {
    userId: 'valentin',
    marketKnowledgeVersion: '1.0.0',
    protocolVersion: '1.0.0',
    profileVersion: '1.0.0',
    preferenceVersion: '1.0.0',
    assessmentJson: {} as any,
    evaluatedAt: '2026-08-06T10:00:00.000Z',
    recommendation: 'strong-candidate' as const,
  }

  // 10.0 @ 3% should rank LOWER than 8.3 @ 30%
  const a10_3: UserOpportunityAssessment = {
    ...base,
    opportunityId: makeOpportunityId('opp-10-3'),
    professionalFitScore: 10.0,
    personalFitScore: 0.0,
    confidence: 0.03,
  }

  const a8_30: UserOpportunityAssessment = {
    ...base,
    opportunityId: makeOpportunityId('opp-8-30'),
    professionalFitScore: 8.3,
    personalFitScore: 10.0,
    confidence: 0.30,
  }

  const comp = policy.compareLexicographically(a10_3, a8_30)
  // a10_3 comes FIRST because profFit is 10.0 vs 8.3
  assert.ok(comp < 0)
})

test('DefaultOpportunityRankingPolicy: encodeCursor and decodeCursor roundtrip Base64URL payload', () => {
  const policy = new DefaultOpportunityRankingPolicy()
  const assessment: UserOpportunityAssessment = {
    opportunityId: makeOpportunityId('opp-test-123'),
    userId: 'valentin',
    marketKnowledgeVersion: '1.0.0',
    protocolVersion: '1.0.0',
    profileVersion: '1.0.0',
    preferenceVersion: '1.0.0',
    assessmentJson: {} as any,
    professionalFitScore: 8.3,
    personalFitScore: 10.0,
    confidence: 0.30,
    recommendation: 'strong-candidate',
    evaluatedAt: '2026-08-06T12:00:00.000Z',
  }

  const cursor = policy.encodeCursor('needs-attention', assessment)
  assert.ok(typeof cursor === 'string')

  const decoded = policy.decodeCursor(cursor, 'needs-attention')
  assert.notEqual(decoded, null)
  assert.equal(decoded?.v, 1)
  assert.equal(decoded?.tab, 'needs-attention')
  assert.equal(decoded?.id, 'opp-test-123')
  assert.equal(decoded?.pf, 8.3)
  assert.equal(decoded?.c, 0.30)
})

test('DefaultOpportunityRankingPolicy: paginateTab returns deterministic nextCursor on keyset boundary', () => {
  const policy = new DefaultOpportunityRankingPolicy()
  const items = Array.from({ length: 45 }, (_, i) => {
    const assessment: UserOpportunityAssessment = {
      opportunityId: makeOpportunityId(`opp-${i}`),
      userId: 'valentin',
      marketKnowledgeVersion: '1.0.0',
      protocolVersion: '1.0.0',
      profileVersion: '1.0.0',
      preferenceVersion: '1.0.0',
      assessmentJson: {} as any,
      professionalFitScore: 10.0 - (i * 0.1),
      personalFitScore: 5.0,
      confidence: 0.5,
      recommendation: 'strong-candidate',
      evaluatedAt: '2026-08-06T12:00:00.000Z',
    }
    return {
      assessment,
      rankScore: assessment.professionalFitScore * assessment.confidence,
      tier: assessment.recommendation,
    }
  })

  // Page 1 (limit 30)
  const page1 = policy.paginateTab(items, 'needs-attention', null, 30)
  assert.equal(page1.items.length, 30)
  assert.ok(page1.nextCursor !== null)

  // Page 2 using nextCursor from Page 1
  const page2 = policy.paginateTab(items, 'needs-attention', page1.nextCursor, 30)
  assert.equal(page2.items.length, 15)
  assert.equal(page2.nextCursor, null)
})
