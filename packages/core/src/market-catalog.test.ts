import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  makeOpportunityId,
  makeOpportunityPostingId,
  normalizeOpportunityTitle,
  makePostingDedupeKey,
} from './market-catalog.js'
import type {
  Opportunity,
  OpportunityPosting,
  MarketModelRecord,
  UserOpportunityAssessment,
  UserOpportunityDecision,
} from './market-catalog.js'

// ── Branded IDs ───────────────────────────────────────────────────────────────
//
// TypeScript structural typing would allow passing any string where an
// OpportunityId is expected. The branded types prevent this at compile time.
// These tests verify the runtime helpers and document the nominal contract.

test('makeOpportunityId produces an OpportunityId from a string', () => {
  const id = makeOpportunityId('opp-123')
  assert.equal(id, 'opp-123')
})

test('makeOpportunityPostingId produces an OpportunityPostingId from a string', () => {
  const id = makeOpportunityPostingId('post-456')
  assert.equal(id, 'post-456')
})

test('OpportunityId and OpportunityPostingId are distinct nominal types', () => {
  // At runtime both are strings, but the branded symbols make them
  // incompatible at the TypeScript level. This test documents the intent.
  const oppId = makeOpportunityId('abc')
  const postId = makeOpportunityPostingId('abc')
  // Same underlying string value, different nominal type
  assert.equal(oppId as string, postId as string)
})

// ── Opportunity shape ─────────────────────────────────────────────────────────

test('Opportunity accepts partial classification (roleFamily optional)', () => {
  const opp: Opportunity = {
    id: makeOpportunityId('opp-stripe-staff-eng'),
    company: { name: 'Stripe', domain: 'stripe.com' },
    title: 'Staff Software Engineer',
    normalizedTitle: 'software engineer',
  }
  assert.equal(opp.roleFamily, undefined)
  assert.equal(opp.roleLevel, undefined)
})

test('Opportunity with full classification', () => {
  const opp: Opportunity = {
    id: makeOpportunityId('opp-stripe-staff-eng'),
    company: { name: 'Stripe', domain: 'stripe.com' },
    title: 'Staff Software Engineer',
    normalizedTitle: 'software engineer',
    roleFamily: 'software-engineering',
    roleLevel: 'staff',
  }
  assert.equal(opp.roleFamily, 'software-engineering')
  assert.equal(opp.roleLevel, 'staff')
})

// ── OpportunityPosting shape ──────────────────────────────────────────────────

test('OpportunityPosting requires opportunityId (one-to-one FK)', () => {
  const posting: OpportunityPosting = {
    id: makeOpportunityPostingId('post-greenhouse-req123'),
    opportunityId: makeOpportunityId('opp-stripe-staff-eng'),
    sourceType: 'greenhouse',
    externalId: 'req_123',
    url: 'https://boards.greenhouse.io/stripe/jobs/req_123',
    firstSeenAt: '2026-08-06T09:00:00Z',
    lastSeenAt: '2026-08-06T09:00:00Z',
    active: true,
    rawDescription: 'We are looking for a Staff Software Engineer...',
  }
  assert.equal(posting.opportunityId, makeOpportunityId('opp-stripe-staff-eng'))
})

test('Multiple postings can share the same opportunityId (cross-source)', () => {
  // Invariant: Posting_n → Opportunity (many-to-one)
  // Two observations from different sources pointing at the same canonical entity
  const oppId = makeOpportunityId('opp-stripe-staff-eng')

  const postingGreenhouse: OpportunityPosting = {
    id: makeOpportunityPostingId('post-greenhouse'),
    opportunityId: oppId,
    sourceType: 'greenhouse',
    externalId: 'req_123',
    url: 'https://boards.greenhouse.io/stripe/jobs/req_123',
    firstSeenAt: '2026-08-01T00:00:00Z',
    lastSeenAt: '2026-08-06T00:00:00Z',
    active: true,
    rawDescription: 'Staff Software Engineer at Stripe (Greenhouse)',
  }

  const postingCareers: OpportunityPosting = {
    id: makeOpportunityPostingId('post-stripe-careers'),
    opportunityId: oppId,   // same canonical opportunity
    sourceType: 'url-fetch',
    externalId: 'stripe.com/careers/staff-eng',
    url: 'https://stripe.com/jobs/listing/staff-software-engineer/12345',
    firstSeenAt: '2026-08-02T00:00:00Z',
    lastSeenAt: '2026-08-06T00:00:00Z',
    active: true,
    rawDescription: 'Staff Software Engineer at Stripe (Careers page)',
  }

  // Both postings point at the same opportunity
  assert.equal(postingGreenhouse.opportunityId, postingCareers.opportunityId)
  // But they are distinct observations
  assert.notEqual(postingGreenhouse.id, postingCareers.id)
  assert.notEqual(postingGreenhouse.sourceType, postingCareers.sourceType)
})

test('inactive posting preserves its content (never deleted)', () => {
  // A user decision (e.g. 'applied') must survive the position closing.
  const posting: OpportunityPosting = {
    id: makeOpportunityPostingId('post-closed'),
    opportunityId: makeOpportunityId('opp-xyz'),
    sourceType: 'lever',
    externalId: 'lever-abc',
    url: 'https://jobs.lever.co/company/lever-abc',
    firstSeenAt: '2026-07-01T00:00:00Z',
    lastSeenAt: '2026-08-01T00:00:00Z',
    active: false,   // disappeared from source listing
    rawDescription: 'Original JD text preserved after closing',
  }
  assert.equal(posting.active, false)
  assert.ok(posting.rawDescription.length > 0)
})

// ── MarketModelRecord — shared, user-free ─────────────────────────────────────

test('MarketModelRecord is keyed by (opportunityId, marketKnowledgeVersion)', () => {
  const record: MarketModelRecord = {
    opportunityId: makeOpportunityId('opp-stripe-staff-eng'),
    marketKnowledgeVersion: '1.4.0',
    recognitionOrder: 14,
    marketModelJson: { requirements: [], recognitionCoverage: 0 },
    recognitionCoverage: 0,
    recognizedAt: '2026-08-06T09:00:00Z',
  }
  assert.equal(record.opportunityId, makeOpportunityId('opp-stripe-staff-eng'))
  assert.equal(record.marketKnowledgeVersion, '1.4.0')
})

test('MarketModelRecord has no userId — it is shared across all users', () => {
  const record: MarketModelRecord = {
    opportunityId: makeOpportunityId('opp-abc'),
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 1,
    marketModelJson: { requirements: [], recognitionCoverage: 0 },
    recognitionCoverage: 0,
    recognizedAt: '2026-08-06T00:00:00Z',
  }
  // Type-level check: MarketModelRecord has no userId field
  assert.equal('userId' in record, false)
})

// ── UserOpportunityAssessment — four-axis versioning ──────────────────────────
//
// Assessment = f(Profile_v, PreferenceSet_v, MarketModel_{K_m}, Protocol_v)
// All four versioned inputs must be present for exact reproducibility.

test('UserOpportunityAssessment records all four version axes', () => {
  const assessment: UserOpportunityAssessment = {
    userId: 'user-valentin',
    opportunityId: makeOpportunityId('opp-stripe-staff-eng'),
    marketKnowledgeVersion: '1.4.0',
    protocolVersion: '2.1.0',       // K1–K6C version — the transformation engine
    profileVersion: '20260806',
    preferenceVersion: '1',
    assessmentJson: {
      professionalFit: {
        score: 8.5,
        assessmentCoverage: 0.9,
        totalRequirements: 10,
        assessedCount: 9,
        unknownCount: 1,
        breakdown: [],
      },
      personalFit: {
        score: 7.0,
        assessmentCoverage: 1.0,
        totalRequirements: 3,
        assessedCount: 3,
        eligible: true,
        breakdown: [],
      },
      confidence: 0.85,
      eligibility: 'eligible',
      recommendation: 'strong-candidate',
      rationale: 'Strong match across professional and personal dimensions.',
    },
    professionalFitScore: 8.5,
    personalFitScore: 7.0,
    confidence: 0.85,
    recommendation: 'strong-candidate',
    evaluatedAt: '2026-08-06T09:30:00Z',
  }

  assert.equal(assessment.marketKnowledgeVersion, '1.4.0')
  assert.equal(assessment.protocolVersion, '2.1.0')
  assert.equal(assessment.profileVersion, '20260806')
  assert.equal(assessment.preferenceVersion, '1')
})

test('protocolVersion is distinct from marketKnowledgeVersion', () => {
  // protocolVersion = which version of K1–K6C ran
  // marketKnowledgeVersion = which K_market snapshot was used
  // They can differ: a new protocol release re-evaluates existing MarketModels
  const assessment: UserOpportunityAssessment = {
    userId: 'user-valentin',
    opportunityId: makeOpportunityId('opp-abc'),
    marketKnowledgeVersion: '1.3.0',   // older market knowledge
    protocolVersion: '3.0.0',          // newer protocol
    profileVersion: '20260806',
    preferenceVersion: '2',
    assessmentJson: {
      professionalFit: { score: 0, assessmentCoverage: 0, totalRequirements: 0, assessedCount: 0, unknownCount: 0, breakdown: [] },
      personalFit: { score: 0, assessmentCoverage: 0, totalRequirements: 0, assessedCount: 0, eligible: true, breakdown: [] },
      confidence: 0,
      eligibility: 'eligible',
      recommendation: 'abstain',
      rationale: 'Insufficient data.',
    },
    professionalFitScore: 0,
    personalFitScore: 0,
    confidence: 0,
    recommendation: 'abstain',
    evaluatedAt: '2026-08-06T10:00:00Z',
  }
  assert.notEqual(assessment.marketKnowledgeVersion, assessment.protocolVersion)
})

// ── UserOpportunityDecision — separated from Assessment ───────────────────────

test('UserOpportunityDecision is independent of Assessment', () => {
  // A user can decide (dismiss, apply) without a full assessment
  const decision: UserOpportunityDecision = {
    userId: 'user-valentin',
    opportunityId: makeOpportunityId('opp-stripe-staff-eng'),
    status: 'dismissed',
    updatedAt: '2026-08-06T09:00:00Z',
    reason: 'Location incompatible',
  }
  assert.equal(decision.status, 'dismissed')
  assert.equal('assessmentJson' in decision, false)
})

test('UserOpportunityDecision survives across DecisionStatus transitions', () => {
  // Document the lifecycle of a user decision
  const statuses: UserOpportunityDecision['status'][] = [
    'new', 'seen', 'interested', 'applied',
  ]
  for (const status of statuses) {
    const decision: UserOpportunityDecision = {
      userId: 'user-valentin',
      opportunityId: makeOpportunityId('opp-abc'),
      status,
      updatedAt: '2026-08-06T09:00:00Z',
    }
    assert.equal(decision.status, status)
  }
})

// ── normalizeOpportunityTitle ─────────────────────────────────────────────────

test('normalizeOpportunityTitle strips level words', () => {
  assert.equal(normalizeOpportunityTitle('Staff Software Engineer'), 'software engineer')
  assert.equal(normalizeOpportunityTitle('Senior Staff Software Engineer'), 'software engineer')
  assert.equal(normalizeOpportunityTitle('Principal Engineer'), 'engineer')
})

test('normalizeOpportunityTitle strips punctuation and normalizes case', () => {
  assert.equal(
    normalizeOpportunityTitle('Staff Software Engineer, Payments'),
    'software engineer payments',
  )
  assert.equal(
    normalizeOpportunityTitle('Principal Engineer - Platform'),
    'engineer platform',
  )
})

test('normalizeOpportunityTitle produces same output for equivalent titles', () => {
  // Cross-source deduplication heuristic: these two titles should normalize identically
  const a = normalizeOpportunityTitle('Staff Software Engineer, Payments (Remote)')
  const b = normalizeOpportunityTitle('Staff Software Engineer Payments Remote')
  assert.equal(a, b)
})

test('normalizeOpportunityTitle drops single-character tokens', () => {
  assert.equal(normalizeOpportunityTitle('Software Engineer II'), 'software engineer')
})

// ── makePostingDedupeKey ──────────────────────────────────────────────────────

test('makePostingDedupeKey is deterministic', () => {
  const k1 = makePostingDedupeKey('greenhouse', 'req_123')
  const k2 = makePostingDedupeKey('greenhouse', 'req_123')
  assert.equal(k1, k2)
})

test('makePostingDedupeKey distinguishes same externalId from different sources', () => {
  const gh = makePostingDedupeKey('greenhouse', 'job-123')
  const lv = makePostingDedupeKey('lever', 'job-123')
  assert.notEqual(gh, lv)
})

test('makePostingDedupeKey format is source:externalId', () => {
  assert.equal(makePostingDedupeKey('ashby', 'abc-def'), 'ashby:abc-def')
})
