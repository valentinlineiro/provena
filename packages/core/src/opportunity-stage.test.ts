import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deriveOpportunityStage, createApplication, type ApplicationStatus } from './index.js'

const app = (status: ApplicationStatus) => ({ ...createApplication({ platform: 'greenhouse', opportunityId: 'opp-1' }), status })

test('shouldBeNewWhenNothingAssessedOrDecided', () => {
  assert.equal(deriveOpportunityStage({ assessed: false, decision: 'new' }), 'new')
})
test('shouldBeEvaluatedWhenAssessedAndUndecided', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'seen' }), 'evaluated')
})
test('shouldBeConsideredWhenInterested', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested' }), 'considered')
})
test('shouldBeDismissedWhenDismissed', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'dismissed' }), 'dismissed')
})
test('shouldBeDecidedWhenApplicationReady', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app('ready') }), 'decided')
})
for (const s of ['applied', 'interviewing', 'offer'] as const) {
  test(`shouldBeAppliedWhenApplicationIs_${s}`, () => {
    assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app(s) }), 'applied')
  })
}
for (const s of ['rejected', 'withdrawn', 'ghosted', 'closed'] as const) {
  test(`shouldBeClosedWhenApplicationIs_${s}`, () => {
    assert.equal(deriveOpportunityStage({ assessed: true, decision: 'interested', application: app(s) }), 'closed')
  })
}
test('shouldPreferApplicationOverDismissedWhenBothPresent', () => {
  assert.equal(deriveOpportunityStage({ assessed: true, decision: 'dismissed', application: app('ready') }), 'decided')
})

import { decideToApply } from './index.js'
const input = { opportunityId: 'opp-1', platform: 'greenhouse', url: 'https://x.example/1' }

for (const decision of ['seen', 'interested'] as const) {
  test(`shouldCreateReadyApplicationWhenDecidingFrom_${decision}`, () => {
    const a = decideToApply({ assessed: true, decision }, input)
    assert.equal(a.status, 'ready')
    assert.equal(a.opportunityId, 'opp-1')
  })
}
test('shouldReturnSameApplicationWhenAlreadyReady', () => {
  const existing = decideToApply({ assessed: true, decision: 'interested' }, input)
  assert.equal(decideToApply({ assessed: true, decision: 'interested', application: existing }, input), existing)
})
test('shouldReturnSameApplicationWhenAlreadyApplied', () => {
  const existing = { ...decideToApply({ assessed: true, decision: 'interested' }, input), status: 'applied' as const }
  assert.equal(decideToApply({ assessed: true, decision: 'interested', application: existing }, input), existing)
})
test('shouldThrowWhenApplicationClosed', () => {
  const closed = { ...decideToApply({ assessed: true, decision: 'interested' }, input), status: 'rejected' as const }
  assert.throws(() => decideToApply({ assessed: true, decision: 'interested', application: closed }, input), /closed/)
})
test('shouldThrowWhenDismissed', () => {
  assert.throws(() => decideToApply({ assessed: true, decision: 'dismissed' }, input), /dismissed/)
})
test('shouldThrowWhenNotAssessed', () => {
  assert.throws(() => decideToApply({ assessed: false, decision: 'new' }, input), /new/)
})
