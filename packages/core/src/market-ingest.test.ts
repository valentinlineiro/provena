import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MarketIngestionEngine,
  computeContentHash,
  MemoryMarketOpportunityRepository,
  MemoryMarketPostingRepository,
  MemoryMarketModelStore,
} from './index.js'
import type { RawOpportunity, MarketRecognizer, IngestionContext } from './index.js'

class DummyRecognizer implements MarketRecognizer {
  extractMarketRequirements(jd: string) {
    return {
      requirements: [
        {
          id: 'req-1',
          concept: 'Software Engineering',
          kind: 'capability' as const,
          rawText: jd.slice(0, 20),
        },
      ],
      recognitionCoverage: 0.8,
    }
  }
}

const dummyRecognizer = new DummyRecognizer()

function makeContext(overrides: Partial<IngestionContext> = {}): IngestionContext {
  return {
    now: '2026-08-06T10:00:00.000Z',
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 100,
    sourceType: 'greenhouse',
    sourceBoardId: 'stripe',
    ...overrides,
  }
}

const rawPosting1: RawOpportunity = {
  externalId: 'job-1',
  source: 'greenhouse',
  url: 'https://boards.greenhouse.io/stripe/jobs/job-1',
  title: 'Senior Backend Engineer',
  company: 'Stripe',
  description: 'We are looking for a Senior Backend Engineer to join Stripe.',
}

const rawPosting2: RawOpportunity = {
  externalId: 'job-2',
  source: 'greenhouse',
  url: 'https://boards.greenhouse.io/stripe/jobs/job-2',
  title: 'Staff Software Engineer',
  company: 'Stripe',
  description: 'Staff Software Engineer for Payments infra.',
}

test('computeContentHash produces deterministic sha256 hash', () => {
  const h1 = computeContentHash('Sample JD text')
  const h2 = computeContentHash('Sample JD text')
  const h3 = computeContentHash('Different JD text')
  assert.equal(h1, h2)
  assert.notEqual(h1, h3)
})

test('MarketIngestionEngine: initial sync creates Opportunity, Posting, and MarketModelRecord', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()

  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, dummyRecognizer)
  const result = await engine.ingest([rawPosting1, rawPosting2], makeContext())

  assert.equal(result.totalIngested, 2)
  assert.equal(result.newlyAddedPostings, 2)
  assert.equal(result.newMarketModelsGenerated, 2)

  const opps = await oppRepo.list()
  assert.equal(opps.length, 2)

  const postings = await postRepo.listByOpportunity(opps[0]!.id)
  assert.equal(postings.length, 1)
  assert.equal(postings[0]!.active, true)

  const model = await modelStore.findCurrent(opps[0]!.id)
  assert.ok(model)
  assert.equal(model.marketKnowledgeVersion, '1.0.0')
})

test('MarketIngestionEngine: identical repeated sync is idempotent (0 new models)', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()

  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, dummyRecognizer)
  const ctx1 = makeContext({ now: '2026-08-06T10:00:00.000Z' })
  await engine.ingest([rawPosting1], ctx1)

  const ctx2 = makeContext({ now: '2026-08-06T11:00:00.000Z' })
  const result2 = await engine.ingest([rawPosting1], ctx2)

  assert.equal(result2.newlyAddedPostings, 0)
  assert.equal(result2.unchangedPostings, 1)
  assert.equal(result2.newMarketModelsGenerated, 0)

  // Verify lastSeenAt was bumped
  const opps = await oppRepo.list()
  const posting = (await postRepo.listByOpportunity(opps[0]!.id))[0]!
  assert.equal(posting.lastSeenAt, '2026-08-06T11:00:00.000Z')
})

test('MarketIngestionEngine: content description edit generates updated Posting & new MarketModel', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()

  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, dummyRecognizer)
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T10:00:00.000Z' }))

  const updatedRaw: RawOpportunity = {
    ...rawPosting1,
    description: 'We are looking for a Senior Backend Engineer to join Stripe Payments (Updated Requirements).',
  }

  const result2 = await engine.ingest(
    [updatedRaw],
    makeContext({ now: '2026-08-06T12:00:00.000Z', marketKnowledgeVersion: '1.1.0', recognitionOrder: 110 }),
  )

  assert.equal(result2.updatedPostings, 1)
  assert.equal(result2.newMarketModelsGenerated, 1)

  const opps = await oppRepo.list()
  const currentModel = await modelStore.findCurrent(opps[0]!.id)
  assert.equal(currentModel?.marketKnowledgeVersion, '1.1.0')
})

test('MarketIngestionEngine: missing posting in sync transitions NOT_SEEN then inactive without deletion', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()

  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, dummyRecognizer)
  await engine.ingest([rawPosting1, rawPosting2], makeContext({ now: '2026-08-06T10:00:00.000Z' }))

  // Sync 2 only contains rawPosting1 (rawPosting2 missing once -> NOT_SEEN)
  const result2 = await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T12:00:00.000Z' }))
  assert.equal(result2.deactivatedPostings, 0)

  // Sync 3 only contains rawPosting1 (rawPosting2 missing twice -> INACTIVE)
  const result3 = await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T13:00:00.000Z' }))
  assert.equal(result3.deactivatedPostings, 1)

  const opps = await oppRepo.list()
  const opp2 = opps.find(o => o.title === 'Staff Software Engineer')!
  const p2 = (await postRepo.listByOpportunity(opp2.id))[0]!

  assert.equal(p2.active, false)
  assert.equal(p2.status, 'INACTIVE')
  assert.equal(p2.lastSeenAt, '2026-08-06T13:00:00.000Z')
})

test('MarketIngestionEngine isolation: zero coupling to candidate Profile, PreferenceSet, or User identity', () => {
  // Verifying API contracts accept no user parameters
  const engine = new MarketIngestionEngine(
    new MemoryMarketOpportunityRepository(),
    new MemoryMarketPostingRepository(),
    new MemoryMarketModelStore(),
    dummyRecognizer,
  )

  assert.equal('profile' in engine, false)
  assert.equal('user' in engine, false)
})

test('reconcileBoardSync increments consecutive_absent_runs and transitions ACTIVE to NOT_SEEN then INACTIVE to ARCHIVED without deleting', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()

  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, dummyRecognizer)
  await engine.ingest([rawPosting1, rawPosting2], makeContext({ now: '2026-08-06T10:00:00.000Z' }))

  // Run 2: Missing rawPosting2 -> NOT_SEEN (absent 1)
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T11:00:00.000Z' }))
  const opps = await oppRepo.list()
  const opp2 = opps.find(o => o.title === 'Staff Software Engineer')!
  let p2 = (await postRepo.listByOpportunity(opp2.id))[0]!

  assert.equal(p2.status, 'NOT_SEEN')
  assert.equal(p2.consecutiveAbsentRuns, 1)

  // Run 3: Missing rawPosting2 -> INACTIVE (absent 2)
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T12:00:00.000Z' }))
  p2 = (await postRepo.listByOpportunity(opp2.id))[0]!
  assert.equal(p2.status, 'INACTIVE')
  assert.equal(p2.consecutiveAbsentRuns, 2)
  assert.equal(p2.active, false)

  // Run 4, 5, 6: Absent until >= 5 -> ARCHIVED
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T13:00:00.000Z' }))
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T14:00:00.000Z' }))
  await engine.ingest([rawPosting1], makeContext({ now: '2026-08-06T15:00:00.000Z' }))
  p2 = (await postRepo.listByOpportunity(opp2.id))[0]!
  assert.equal(p2.status, 'ARCHIVED')
  assert.equal(p2.consecutiveAbsentRuns, 5)
})

