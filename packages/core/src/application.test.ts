import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createApplication, parseApplication, MemoryApplicationRepository, makeOpportunityId, markApplied, transitionApplication, summarizeApplications } from './index.js'

test('shouldPersistApplicationLinkedToOpportunityWhenMarkedApplied', async () => {
  const repo = new MemoryApplicationRepository()
  const opportunityId = makeOpportunityId('opp-netflix-staff')

  const application = createApplication({
    platform: 'greenhouse',
    opportunityId,
    url: 'https://boards.greenhouse.io/netflix/123',
  })
  await repo.save(application)

  const reloaded = await repo.list()
  assert.equal(reloaded.length, 1)
  assert.equal(reloaded[0]!.id, application.id)
  assert.equal(reloaded[0]!.opportunityId, opportunityId)
  assert.equal(reloaded[0]!.status, 'applied')
})

test('shouldReferenceOpportunityWithoutDuplicatingItsDataWhenSaving', () => {
  const application = createApplication({
    platform: 'lever',
    opportunityId: 'opp-acme-senior',
  })
  const keys = Object.keys(application)
  for (const duplicated of ['company', 'title', 'description', 'salary', 'requirements']) {
    assert.ok(!keys.includes(duplicated), `Application must not duplicate opportunity field "${duplicated}"`)
  }
  assert.equal(application.opportunityId, 'opp-acme-senior')
})

test('shouldRejectUnknownPlatformWhenCreatingApplication', () => {
  assert.throws(() => createApplication({ platform: 'telepathy' }), /platform/)
})

test('shouldRejectMalformedApplicationWhenParsing', () => {
  assert.throws(() => parseApplication({ id: 'x', platform: 'greenhouse' }), /appliedAt/)
  assert.throws(() => parseApplication({ id: 'x', platform: 'greenhouse', appliedAt: 'not-a-date', status: 'hired-tomorrow' }), /status|appliedAt/)
})

test('shouldAllowOnlyValidTransitionsWhenAdvancingStatus', () => {
  const applied = createApplication({ platform: 'greenhouse' })
  assert.equal(transitionApplication(applied, 'interviewing').status, 'interviewing')
  assert.throws(() => transitionApplication(applied, 'offer'), /cannot transition/)
  const rejected = transitionApplication(applied, 'rejected')
  assert.throws(() => transitionApplication(rejected, 'interviewing'), /cannot transition/)
})

test('shouldAnswerWhatIsOpenAndWhatIsNextWhenSummarizing', async () => {
  const repo = new MemoryApplicationRepository()
  const a = createApplication({ platform: 'greenhouse', appliedAt: '2026-09-01T10:00:00.000Z' })
  const b = { ...createApplication({ platform: 'lever', appliedAt: '2026-09-20T10:00:00.000Z' }), nextAction: 'Prepare system design', nextActionDue: '2026-10-05' }
  const c = { ...createApplication({ platform: 'linkedin', appliedAt: '2026-09-21T10:00:00.000Z' }), nextAction: 'Reply to recruiter', nextActionDue: '2026-10-02' }
  const d = transitionApplication(createApplication({ platform: 'ashby' }), 'rejected')
  for (const app of [a, b, c, d]) await repo.save(app)

  const reloaded = await repo.list()
  const summary = summarizeApplications(reloaded, '2026-10-01T00:00:00.000Z')

  assert.equal(summary.active.length, 3)
  assert.deepEqual(summary.nextActions.map((n) => n.action), ['Reply to recruiter', 'Prepare system design'])
  assert.deepEqual(summary.stale.map((s) => s.id), [a.id])
  assert.equal(summary.waitingOnMe.length, 2)
  assert.equal(summary.waitingOnCompany.length, 1)
})

test('shouldMoveReadyToAppliedAndStampDateWhenMarkApplied', () => {
  const ready = createApplication({ platform: 'greenhouse', opportunityId: 'opp-1', status: 'ready' })
  const done = markApplied(ready, '2026-10-02T09:00:00.000Z')
  assert.equal(done.status, 'applied')
  assert.equal(done.appliedAt, '2026-10-02T09:00:00.000Z')
})
test('shouldThrowWhenMarkAppliedFromNonReady', () => {
  const applied = createApplication({ platform: 'greenhouse' })
  assert.throws(() => markApplied(applied), /ready/)
})
test('shouldFindApplicationByOpportunityIdWhenSaved', async () => {
  const repo = new MemoryApplicationRepository()
  const a = createApplication({ platform: 'greenhouse', opportunityId: 'opp-9' })
  await repo.save(a)
  assert.equal((await repo.findByOpportunityId('opp-9'))?.id, a.id)
  assert.equal(await repo.findByOpportunityId('nope'), undefined)
})
