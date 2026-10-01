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
