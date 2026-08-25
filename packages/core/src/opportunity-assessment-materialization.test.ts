import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveOpportunityDedupeKey, assessOpportunityDescription } from './opportunity-assessment-materialization.js'
import { getEmbeddedProfile } from './profile.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'
import { DeclarativeMarketRecognizer } from './market-knowledge.js'

test('deriveOpportunityDedupeKey normalizes company name and combines with externalId', () => {
  assert.equal(deriveOpportunityDedupeKey('Stripe Inc.', undefined, '12345'), 'opp-stripeinc-12345')
  assert.equal(deriveOpportunityDedupeKey(undefined, 'stripe', '12345'), 'opp-stripe-12345')
  assert.equal(deriveOpportunityDedupeKey(undefined, undefined, '12345'), 'opp-unknown-12345')
})

test('assessOpportunityDescription produces a record shaped for PostgresMarketAssessmentRepository.saveAssessment', () => {
  const profile = getEmbeddedProfile()
  const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const record = assessOpportunityDescription(
    'opp-test-1',
    'Staff Software Engineer role requiring 5+ years Go, Kubernetes, and distributed systems architecture.',
    profile,
    recognizer,
    '2026-08-25T00:00:00.000Z',
  )

  assert.equal(record.opportunityId, 'opp-test-1')
  assert.equal(record.evaluatedAt, '2026-08-25T00:00:00.000Z')
  assert.ok(['strong-candidate', 'consider', 'abstain', 'skip'].includes(record.recommendation))
  assert.ok(record.decisionTier >= 1 && record.decisionTier <= 4)
  assert.ok(Number.isFinite(record.professionalFit))
  assert.ok(Number.isFinite(record.personalFit) && record.personalFit >= 0)
  assert.ok(record.confidence >= 0 && record.confidence <= 1)
})
