// ── Contract Tests Sub-module Export ──────────────────────────────────────────
// Exported separately from main bundle to avoid bundling 'node:test' in Cloudflare Workers.

import { test } from 'node:test'
import assert from 'node:assert/strict'
import type {
  MarketOpportunityRepository,
  MarketPostingRepository,
  MarketModelStore,
} from './market-catalog-ports.js'
import type { Opportunity, OpportunityPosting, MarketModelRecord } from './market-catalog.js'
import { makeOpportunityId, makeOpportunityPostingId } from './market-catalog.js'

export function runMarketRepositoryContractTests(
  makeOpportunityRepo: () => MarketOpportunityRepository | Promise<MarketOpportunityRepository>,
  makePostingRepo: () => MarketPostingRepository | Promise<MarketPostingRepository>,
  makeModelStore: () => MarketModelStore | Promise<MarketModelStore>,
): void {

  // ── MarketOpportunityRepository ────────────────────────────────────────────

  test('MarketOpportunityRepository: findById returns null for missing id', async () => {
    const repo = await makeOpportunityRepo()
    const result = await repo.findById(makeOpportunityId('nonexistent'))
    assert.equal(result, null)
  })

  test('MarketOpportunityRepository: save then findById round-trips', async () => {
    const repo = await makeOpportunityRepo()
    const opp: Opportunity = {
      id: makeOpportunityId('opp-1'),
      company: { name: 'Stripe', domain: 'stripe.com' },
      title: 'Staff Software Engineer',
      normalizedTitle: 'software engineer',
      roleFamily: 'software-engineering',
      roleLevel: 'staff',
    }
    await repo.save(opp)
    const found = await repo.findById(opp.id)
    assert.deepEqual(found, opp)
  })

  test('MarketOpportunityRepository: save is upsert (overwrite on same id)', async () => {
    const repo = await makeOpportunityRepo()
    const id = makeOpportunityId('opp-upsert')
    const v1: Opportunity = {
      id,
      company: { name: 'Acme' },
      title: 'Engineer',
      normalizedTitle: 'engineer',
    }
    const v2: Opportunity = {
      id,
      company: { name: 'Acme' },
      title: 'Senior Engineer',
      normalizedTitle: 'engineer',
      roleLevel: 'senior',
    }
    await repo.save(v1)
    await repo.save(v2)
    const found = await repo.findById(id)
    assert.equal(found?.title, 'Senior Engineer')
    assert.equal(found?.roleLevel, 'senior')
  })

  test('MarketOpportunityRepository: list returns all saved opportunities', async () => {
    const repo = await makeOpportunityRepo()
    const a: Opportunity = { id: makeOpportunityId('a'), company: { name: 'A' }, title: 'A', normalizedTitle: 'a' }
    const b: Opportunity = { id: makeOpportunityId('b'), company: { name: 'B' }, title: 'B', normalizedTitle: 'b', roleFamily: 'ai-engineering' }
    await repo.save(a)
    await repo.save(b)
    const all = await repo.list()
    assert.equal(all.length, 2)
  })

  test('MarketOpportunityRepository: list filters by roleFamily', async () => {
    const repo = await makeOpportunityRepo()
    const sw: Opportunity = { id: makeOpportunityId('sw'), company: { name: 'X' }, title: 'SW Eng', normalizedTitle: 'sw eng', roleFamily: 'software-engineering' }
    const ai: Opportunity = { id: makeOpportunityId('ai'), company: { name: 'Y' }, title: 'AI Eng', normalizedTitle: 'ai eng', roleFamily: 'ai-engineering' }
    await repo.save(sw)
    await repo.save(ai)
    const swOnly = await repo.list({ roleFamily: 'software-engineering' })
    assert.equal(swOnly.length, 1)
    assert.equal(swOnly[0]!.id, makeOpportunityId('sw'))
  })

  // ── MarketPostingRepository ─────────────────────────────────────────────────

  test('MarketPostingRepository: findById returns null for missing id', async () => {
    const repo = await makePostingRepo()
    const result = await repo.findById(makeOpportunityPostingId('nonexistent'))
    assert.equal(result, null)
  })

  test('MarketPostingRepository: save then findById round-trips', async () => {
    const oppRepo = await makeOpportunityRepo()
    const repo = await makePostingRepo()
    const oppId = makeOpportunityId('opp-1')
    await oppRepo.save({
      id: oppId,
      company: { name: 'Stripe' },
      title: 'Staff Engineer',
      normalizedTitle: 'engineer',
    })
    const posting: OpportunityPosting = {
      id: makeOpportunityPostingId('post-1'),
      opportunityId: oppId,
      sourceType: 'greenhouse',
      externalId: 'req_001',
      url: 'https://boards.greenhouse.io/stripe/jobs/req_001',
      firstSeenAt: '2026-08-01T00:00:00.000Z',
      lastSeenAt: '2026-08-06T00:00:00.000Z',
      active: true,
      rawDescription: 'Staff Engineer role at Stripe.',
    }
    await repo.save(posting)
    const found = await repo.findById(posting.id)
    assert.deepEqual(found, posting)
  })

  test('MarketPostingRepository: findBySource returns posting by (sourceType, externalId)', async () => {
    const oppRepo = await makeOpportunityRepo()
    const repo = await makePostingRepo()
    const oppId = makeOpportunityId('opp-stripe')
    await oppRepo.save({
      id: oppId,
      company: { name: 'Stripe' },
      title: 'Staff Engineer',
      normalizedTitle: 'engineer',
    })
    const posting: OpportunityPosting = {
      id: makeOpportunityPostingId('post-gh-123'),
      opportunityId: oppId,
      sourceType: 'greenhouse',
      externalId: 'req_123',
      url: 'https://boards.greenhouse.io/stripe/jobs/req_123',
      firstSeenAt: '2026-08-01T00:00:00.000Z',
      lastSeenAt: '2026-08-06T00:00:00.000Z',
      active: true,
      rawDescription: 'JD text.',
    }
    await repo.save(posting)
    const found = await repo.findBySource('greenhouse', 'req_123')
    assert.ok(found !== null)
    assert.equal(found.id, posting.id)
  })

  test('MarketPostingRepository: findBySource returns null for wrong source', async () => {
    const oppRepo = await makeOpportunityRepo()
    const repo = await makePostingRepo()
    const oppId = makeOpportunityId('opp-x')
    await oppRepo.save({
      id: oppId,
      company: { name: 'Company X' },
      title: 'Engineer',
      normalizedTitle: 'engineer',
    })
    const posting: OpportunityPosting = {
      id: makeOpportunityPostingId('post-gh-456'),
      opportunityId: oppId,
      sourceType: 'greenhouse',
      externalId: 'req_456',
      url: 'https://boards.greenhouse.io/x/jobs/req_456',
      firstSeenAt: '2026-08-01T00:00:00.000Z',
      lastSeenAt: '2026-08-06T00:00:00.000Z',
      active: true,
      rawDescription: 'JD.',
    }
    await repo.save(posting)
    const found = await repo.findBySource('lever', 'req_456')
    assert.equal(found, null)
  })

  test('MarketPostingRepository: listByOpportunity returns all postings for an opportunity', async () => {
    const oppRepo = await makeOpportunityRepo()
    const repo = await makePostingRepo()
    const oppId = makeOpportunityId('opp-multi')
    const oppOtherId = makeOpportunityId('opp-other')

    await oppRepo.save({ id: oppId, company: { name: 'Multi' }, title: 'Eng', normalizedTitle: 'eng' })
    await oppRepo.save({ id: oppOtherId, company: { name: 'Other' }, title: 'Eng', normalizedTitle: 'eng' })

    const base = {
      opportunityId: oppId,
      firstSeenAt: '2026-08-01T00:00:00.000Z',
      lastSeenAt: '2026-08-06T00:00:00.000Z',
      active: true,
      rawDescription: 'JD.',
    }
    const p1: OpportunityPosting = { ...base, id: makeOpportunityPostingId('p1'), sourceType: 'greenhouse', externalId: 'gh-1', url: 'https://greenhouse.io/1' }
    const p2: OpportunityPosting = { ...base, id: makeOpportunityPostingId('p2'), sourceType: 'url-fetch', externalId: 'url-1', url: 'https://stripe.com/jobs/1' }
    const other: OpportunityPosting = { ...base, id: makeOpportunityPostingId('p3'), opportunityId: oppOtherId, sourceType: 'lever', externalId: 'lv-1', url: 'https://jobs.lever.co/1' }
    await repo.save(p1)
    await repo.save(p2)
    await repo.save(other)
    const forOpp = await repo.listByOpportunity(oppId)
    assert.equal(forOpp.length, 2)
    const ids = forOpp.map(p => p.id).sort()
    assert.deepEqual(ids, [makeOpportunityPostingId('p1'), makeOpportunityPostingId('p2')].sort())
  })

  test('MarketPostingRepository: markInactive sets active=false without deleting', async () => {
    const oppRepo = await makeOpportunityRepo()
    const repo = await makePostingRepo()
    const oppId = makeOpportunityId('opp-z')
    await oppRepo.save({ id: oppId, company: { name: 'Z' }, title: 'Eng', normalizedTitle: 'eng' })

    const posting: OpportunityPosting = {
      id: makeOpportunityPostingId('post-active'),
      opportunityId: oppId,
      sourceType: 'ashby',
      externalId: 'ash-1',
      url: 'https://jobs.ashbyhq.com/co/ash-1',
      firstSeenAt: '2026-07-01T00:00:00.000Z',
      lastSeenAt: '2026-08-01T00:00:00.000Z',
      active: true,
      rawDescription: 'Original JD — must survive closing.',
    }
    await repo.save(posting)
    await repo.markInactive(posting.id, '2026-08-06T00:00:00.000Z')

    const found = await repo.findById(posting.id)
    assert.ok(found !== null, 'posting must still exist after markInactive')
    assert.equal(found.active, false)
    assert.equal(found.lastSeenAt, '2026-08-06T00:00:00.000Z')
    assert.ok(found.rawDescription.includes('Original JD'))
  })

  test('MarketPostingRepository: markInactive on unknown id is a no-op', async () => {
    const repo = await makePostingRepo()
    await repo.markInactive(makeOpportunityPostingId('nonexistent'), '2026-08-06T00:00:00Z')
  })

  // ── MarketModelStore ────────────────────────────────────────────────────────

  test('MarketModelStore: findCurrent returns null for unknown opportunity', async () => {
    const store = await makeModelStore()
    const result = await store.findCurrent(makeOpportunityId('unknown'))
    assert.equal(result, null)
  })

  test('MarketModelStore: save then findByVersion round-trips', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppId = makeOpportunityId('opp-mmr-1')
    await oppRepo.save({ id: oppId, company: { name: 'Acme' }, title: 'Eng', normalizedTitle: 'eng' })

    const record: MarketModelRecord = {
      opportunityId: oppId,
      marketKnowledgeVersion: '1.0.0',
      recognitionOrder: 100,
      marketModelJson: { requirements: [], recognitionCoverage: 0 },
      recognitionCoverage: 0,
      recognizedAt: '2026-08-06T09:00:00.000Z',
    }
    await store.save(record)
    const found = await store.findByVersion(record.opportunityId, '1.0.0')
    assert.deepEqual(found, record)
  })

  test('MarketModelStore: save throws MarketModelVersionConflict on duplicate (opportunityId, version)', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppId = makeOpportunityId('opp-conflict')
    await oppRepo.save({ id: oppId, company: { name: 'Acme' }, title: 'Eng', normalizedTitle: 'eng' })

    const record: MarketModelRecord = {
      opportunityId: oppId,
      marketKnowledgeVersion: '1.0.0',
      recognitionOrder: 100,
      marketModelJson: { requirements: [], recognitionCoverage: 0 },
      recognitionCoverage: 0,
      recognizedAt: '2026-08-06T09:00:00.000Z',
    }
    await store.save(record)
    await assert.rejects(
      () => store.save({ ...record }),
      (err: Error) => {
        assert.equal(err.name, 'MarketModelVersionConflict')
        return true
      },
    )
  })

  test('MarketModelStore: multiple versions coexist for the same opportunity', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppId = makeOpportunityId('opp-versioned')
    await oppRepo.save({ id: oppId, company: { name: 'Acme' }, title: 'Eng', normalizedTitle: 'eng' })

    const v15: MarketModelRecord = {
      opportunityId: oppId,
      marketKnowledgeVersion: '1.5.0',
      recognitionOrder: 15,
      marketModelJson: { requirements: [], recognitionCoverage: 0.3 },
      recognitionCoverage: 0.3,
      recognizedAt: '2026-06-01T00:00:00.000Z',
    }
    const v16: MarketModelRecord = {
      opportunityId: oppId,
      marketKnowledgeVersion: '1.6.0',
      recognitionOrder: 16,
      marketModelJson: { requirements: [], recognitionCoverage: 0.6 },
      recognitionCoverage: 0.6,
      recognizedAt: '2026-07-01T00:00:00.000Z',
    }
    const v17: MarketModelRecord = {
      opportunityId: oppId,
      marketKnowledgeVersion: '1.7.0',
      recognitionOrder: 17,
      marketModelJson: { requirements: [], recognitionCoverage: 0.85 },
      recognitionCoverage: 0.85,
      recognizedAt: '2026-08-01T00:00:00.000Z',
    }
    await store.save(v15)
    await store.save(v16)
    await store.save(v17)

    const all = await store.listByOpportunity(oppId)
    assert.equal(all.length, 3)
  })

  test('MarketModelStore: findCurrent returns highest recognitionOrder', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppId = makeOpportunityId('opp-current')
    await oppRepo.save({ id: oppId, company: { name: 'Acme' }, title: 'Eng', normalizedTitle: 'eng' })

    await store.save({ opportunityId: oppId, marketKnowledgeVersion: '1.7.0', recognitionOrder: 17, marketModelJson: { requirements: [], recognitionCoverage: 0.85 }, recognitionCoverage: 0.85, recognizedAt: '2026-08-01T00:00:00.000Z' })
    await store.save({ opportunityId: oppId, marketKnowledgeVersion: '1.5.0', recognitionOrder: 15, marketModelJson: { requirements: [], recognitionCoverage: 0.3 }, recognitionCoverage: 0.3, recognizedAt: '2026-06-01T00:00:00.000Z' })
    await store.save({ opportunityId: oppId, marketKnowledgeVersion: '1.6.0', recognitionOrder: 16, marketModelJson: { requirements: [], recognitionCoverage: 0.6 }, recognitionCoverage: 0.6, recognizedAt: '2026-07-01T00:00:00.000Z' })

    const current = await store.findCurrent(oppId)
    assert.ok(current !== null)
    assert.equal(current.marketKnowledgeVersion, '1.7.0')
    assert.equal(current.recognitionOrder, 17)
    assert.equal(current.recognitionCoverage, 0.85)
  })

  test('MarketModelStore: findByVersion returns null for missing version', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppId = makeOpportunityId('opp-missing-ver')
    await oppRepo.save({ id: oppId, company: { name: 'Acme' }, title: 'Eng', normalizedTitle: 'eng' })

    await store.save({ opportunityId: oppId, marketKnowledgeVersion: '1.0.0', recognitionOrder: 1, marketModelJson: { requirements: [], recognitionCoverage: 0 }, recognitionCoverage: 0, recognizedAt: '2026-08-06T00:00:00.000Z' })
    const found = await store.findByVersion(oppId, '9.9.9')
    assert.equal(found, null)
  })

  test('MarketModelStore: records for different opportunities are isolated', async () => {
    const oppRepo = await makeOpportunityRepo()
    const store = await makeModelStore()
    const oppA = makeOpportunityId('opp-a')
    const oppB = makeOpportunityId('opp-b')
    await oppRepo.save({ id: oppA, company: { name: 'Acme A' }, title: 'Eng', normalizedTitle: 'eng' })
    await oppRepo.save({ id: oppB, company: { name: 'Acme B' }, title: 'Eng', normalizedTitle: 'eng' })

    await store.save({ opportunityId: oppA, marketKnowledgeVersion: '1.0.0', recognitionOrder: 1, marketModelJson: { requirements: [], recognitionCoverage: 0.5 }, recognitionCoverage: 0.5, recognizedAt: '2026-08-06T00:00:00.000Z' })
    await store.save({ opportunityId: oppB, marketKnowledgeVersion: '1.0.0', recognitionOrder: 1, marketModelJson: { requirements: [], recognitionCoverage: 0.9 }, recognitionCoverage: 0.9, recognizedAt: '2026-08-06T00:00:00.000Z' })

    const currentA = await store.findCurrent(oppA)
    const currentB = await store.findCurrent(oppB)
    assert.equal(currentA?.recognitionCoverage, 0.5)
    assert.equal(currentB?.recognitionCoverage, 0.9)
  })
}
