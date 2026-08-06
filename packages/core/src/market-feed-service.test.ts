import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MarketIngestionEngine,
  MarketFeedService,
  MemoryMarketOpportunityRepository,
  MemoryMarketPostingRepository,
  MemoryMarketModelStore,
} from './index.js'
import type { RawOpportunity, MarketRecognizer } from './index.js'

class MockSource {
  constructor(public jobs: RawOpportunity[]) {}
  async fetchAllBoardJobs(): Promise<RawOpportunity[]> {
    return this.jobs
  }
}

class DummyRecognizer implements MarketRecognizer {
  extractMarketRequirements(jd: string) {
    return {
      requirements: [{ id: 'req-1', concept: 'Engineering', kind: 'capability' as const, rawText: jd.slice(0, 10) }],
      recognitionCoverage: 0.9,
    }
  }
}

const recognizer = new DummyRecognizer()

test('MarketFeedService: Sync #1 (initial), Sync #2 (idempotent), Sync #3 (controlled delta)', async () => {
  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()
  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
  const service = new MarketFeedService(postRepo, engine)

  const jobA: RawOpportunity = { externalId: 'a', source: 'greenhouse', url: 'https://a', title: 'Job A', company: 'Stripe', description: 'Desc A' }
  const jobB: RawOpportunity = { externalId: 'b', source: 'greenhouse', url: 'https://b', title: 'Job B', company: 'Stripe', description: 'Desc B' }
  const jobC: RawOpportunity = { externalId: 'c', source: 'greenhouse', url: 'https://c', title: 'Job C', company: 'Stripe', description: 'Desc C' }
  const jobD: RawOpportunity = { externalId: 'd', source: 'greenhouse', url: 'https://d', title: 'Job D', company: 'Stripe', description: 'Desc D' }

  const mockSource = new MockSource([jobA, jobB, jobC, jobD])

  const registration = {
    id: 'stripe-board',
    sourceType: 'greenhouse' as const,
    source: mockSource,
    sourceBoardId: 'stripe',
  }

  // SYNC #1: Initial Ingest
  const res1 = await service.syncSource(registration, {
    now: '2026-08-06T10:00:00.000Z',
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 100,
  })

  assert.equal(res1.ingestResult.newlyAddedPostings, 4)
  assert.equal(res1.ingestResult.newMarketModelsGenerated, 4)
  assert.equal(res1.affectedOpportunityIds.length, 4)

  // SYNC #2: Identical Re-Sync (0 Delta)
  const res2 = await service.syncSource(registration, {
    now: '2026-08-06T11:00:00.000Z',
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 101,
  })

  assert.equal(res2.ingestResult.newlyAddedPostings, 0)
  assert.equal(res2.ingestResult.updatedPostings, 0)
  assert.equal(res2.ingestResult.unchangedPostings, 4)
  assert.equal(res2.ingestResult.newMarketModelsGenerated, 0)

  // SYNC #3: Controlled Delta (+1 new jobE, 1 changed jobA description, 1 removed jobD)
  const jobAUpdated: RawOpportunity = { ...jobA, description: 'Desc A Updated text' }
  const jobE: RawOpportunity = { externalId: 'e', source: 'greenhouse', url: 'https://e', title: 'Job E', company: 'Stripe', description: 'Desc E' }

  // mockSource jobs updated to [jobAUpdated, jobB, jobC, jobE] (jobD removed)
  mockSource.jobs = [jobAUpdated, jobB, jobC, jobE]

  const res3 = await service.syncSource(registration, {
    now: '2026-08-06T12:00:00.000Z',
    marketKnowledgeVersion: '1.0.1',
    recognitionOrder: 102,
  })

  assert.equal(res3.ingestResult.newlyAddedPostings, 1)   // jobE
  assert.equal(res3.ingestResult.updatedPostings, 1)      // jobAUpdated
  assert.equal(res3.ingestResult.deactivatedPostings, 1)  // jobD deactivated
  assert.equal(res3.ingestResult.newMarketModelsGenerated, 2) // jobE + jobAUpdated

  // Verify Work_{t+1} ∝ ΔMarket invariant holds
  assert.equal(res3.affectedOpportunityIds.length, 4)
})
