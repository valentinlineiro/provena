import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateSafeUrl, extractJobFromHtml, DeclarativeMarketRecognizer, composeKnowledge, DEFAULT_SOFTWARE_KNOWLEDGE, MLOPS_KNOWLEDGE, GreenhousePublicSource, hashOpportunityKey, reconcileBoardSync, MemoryOpportunityRepository } from './index.js'
import type { RawOpportunity } from './index.js'

test('validateSafeUrl accepts valid public HTTP/HTTPS URLs', () => {
  const url1 = validateSafeUrl('https://boards.greenhouse.io/company/jobs/12345')
  assert.equal(url1.hostname, 'boards.greenhouse.io')

  const url2 = validateSafeUrl('http://example.com/job')
  assert.equal(url2.hostname, 'example.com')
})

test('validateSafeUrl blocks SSRF attempts on internal/loopback IPs', () => {
  assert.throws(() => validateSafeUrl('http://localhost:8080/job'), /Security Violation \(SSRF\)/)
  assert.throws(() => validateSafeUrl('http://127.0.0.1/admin'), /Security Violation \(SSRF\)/)
  assert.throws(() => validateSafeUrl('http://192.168.1.1/router'), /Security Violation \(SSRF\)/)
  assert.throws(() => validateSafeUrl('http://10.0.0.1/internal'), /Security Violation \(SSRF\)/)
  assert.throws(() => validateSafeUrl('http://169.254.169.254/latest/meta-data/'), /Security Violation \(SSRF\)/)
  assert.throws(() => validateSafeUrl('ftp://example.com/file'), /Forbidden protocol/)
})

test('extractJobFromHtml extracts JSON-LD schema.org/JobPosting when present', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Senior MLOps Engineer at TechCorp</title>
        <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": "Senior MLOps Engineer",
            "description": "<p>We are looking for a Senior MLOps Engineer with expertise in Python, Kubernetes, and Databricks MLflow.</p>",
            "hiringOrganization": {
              "@type": "Organization",
              "name": "TechCorp"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "addressLocality": "Remote Spain"
              }
            }
          }
        </script>
      </head>
      <body><h1>Ignore body</h1></body>
    </html>
  `

  const extracted = extractJobFromHtml('https://example.com/jobs/1', sampleHtml)
  assert.equal(extracted.title, 'Senior MLOps Engineer')
  assert.equal(extracted.company, 'TechCorp')
  assert.equal(extracted.location, 'Remote Spain')
  assert.ok(extracted.description.includes('Python'))
  assert.ok(extracted.description.includes('Kubernetes'))
  assert.ok(extracted.description.includes('Databricks MLflow'))
})

test('extractJobFromHtml falls back to clean HTML extraction when JSON-LD is absent', () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Staff Software Engineer - Acme Corp</title>
        <style>.nav { color: red; }</style>
        <script>console.log('script');</script>
      </head>
      <body>
        <nav>Nav links to ignore</nav>
        <header>Header to ignore</header>
        <main>
          <h1>Staff Software Engineer</h1>
          <p>Requisitos: Experiencia en Python, AWS y arquitecturas orientadas a eventos.</p>
        </main>
        <footer>Footer text to ignore</footer>
      </body>
    </html>
  `

  const extracted = extractJobFromHtml('https://example.com/jobs/2', sampleHtml)
  assert.equal(extracted.title, 'Staff Software Engineer - Acme Corp')
  assert.ok(!extracted.description.includes('Nav links to ignore'))
  assert.ok(!extracted.description.includes('Footer text to ignore'))
  assert.ok(extracted.description.includes('Experiencia en Python'))
})

test('O1.1 Equivalence Invariant: extracted RawOpportunity produces identical MarketModel to manual text copy', () => {
  const manualText = `Senior MLOps Engineer
Requirements: Python, Kubernetes, MLOps, MLflow, feature store, and Databricks Unity Catalog.`

  const jsonLdHtml = `
    <script type="application/ld+json">
      {
        "@type": "JobPosting",
        "title": "Senior MLOps Engineer",
        "description": "<p>Requirements: Python, Kubernetes, MLOps, MLflow, feature store, and Databricks Unity Catalog.</p>"
      }
    </script>
  `

  const extracted = extractJobFromHtml('https://example.com/mlops-job', jsonLdHtml)
  
  const composedK = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, MLOPS_KNOWLEDGE)
  const recognizer = new DeclarativeMarketRecognizer(composedK)

  const mmManual = recognizer.extractMarketRequirements(manualText)
  const mmExtracted = recognizer.extractMarketRequirements(extracted.description)

  const conceptsManual = mmManual.requirements.map(r => r.concept)
  const conceptsExtracted = mmExtracted.requirements.map(r => r.concept)

  assert.deepEqual(conceptsExtracted, conceptsManual, 'MarketModel requirements extracted via URL source must match manual copy')
})

test('GreenhousePublicSource.fetchAllBoardJobs maps the board jobs list to RawOpportunity[]', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input: string | URL) => {
    assert.ok(String(input).includes('boards-api.greenhouse.io/v1/boards/acme/jobs'))
    return new Response(JSON.stringify({
      jobs: [
        {
          id: 42,
          internal_job_id: 1,
          title: 'Senior MLOps Engineer',
          location: { name: 'Remote' },
          absolute_url: 'https://boards.greenhouse.io/acme/jobs/42',
          updated_at: '2026-01-01T00:00:00Z',
          content: '<p>Requirements: Python, Kubernetes, MLflow.</p>',
        },
      ],
    }), { status: 200, headers: { 'content-type': 'application/json' } })
  }) as typeof fetch

  try {
    const source = new GreenhousePublicSource('acme')
    const raws = await source.fetchAllBoardJobs()

    assert.equal(raws.length, 1)
    assert.equal(raws[0]!.source, 'greenhouse')
    assert.equal(raws[0]!.externalId, '42')
    assert.equal(raws[0]!.title, 'Senior MLOps Engineer')
    assert.equal(raws[0]!.location, 'Remote')
    assert.ok(raws[0]!.description.includes('Python'))
    assert.ok(!raws[0]!.description.includes('<p>'))
    assert.equal(hashOpportunityKey(raws[0]!), 'opp-acme-42')
  } finally {
    globalThis.fetch = originalFetch
  }
})

function fakeRaw(id: number, title = `Job ${id}`): RawOpportunity {
  return {
    externalId: String(id),
    source: 'greenhouse',
    url: `https://boards.greenhouse.io/acme/jobs/${id}`,
    title,
    company: 'acme',
    description: `Requirements for ${title}`,
  }
}

const fakeEvaluate = (raw: RawOpportunity) => ({
  evaluation: { rawOpportunity: raw } as any,
  knowledgeVersion: 'test-1.0.0',
})

const inScopeAcme = (raw: RawOpportunity) => raw.source === 'greenhouse' && raw.company === 'acme'

test('reconcileBoardSync: O1.3A market memory invariant — A,B,C then A,C,D reconciles seen/lastSeen/active correctly', () => {
  const t0 = '2026-08-05T00:00:00Z'
  const first = reconcileBoardSync([], [fakeRaw(1), fakeRaw(2), fakeRaw(3)], inScopeAcme, fakeEvaluate, t0)
  assert.equal(first.newlyAddedCount, 3)
  assert.ok(first.opportunities.every(o => o.active && o.firstSeenAt === t0 && o.lastSeenAt === t0))

  const t1 = '2026-08-06T00:00:00Z'
  const second = reconcileBoardSync(first.opportunities, [fakeRaw(1), fakeRaw(3), fakeRaw(4)], inScopeAcme, fakeEvaluate, t1)

  const byId = new Map(second.opportunities.map(o => [o.id, o]))
  const a = byId.get(hashOpportunityKey(fakeRaw(1)))!
  const b = byId.get(hashOpportunityKey(fakeRaw(2)))!
  const c = byId.get(hashOpportunityKey(fakeRaw(3)))!
  const d = byId.get(hashOpportunityKey(fakeRaw(4)))!

  assert.equal(second.newlyAddedCount, 1, 'only D is new')
  assert.equal(a.active, true)
  assert.equal(a.lastSeenAt, t1, 'A was seen again, lastSeenAt bumped')
  assert.equal(a.firstSeenAt, t0, 'A firstSeenAt must not change')

  assert.equal(b.active, false, 'B disappeared from the board, marked inactive not deleted')
  assert.equal(b.lastSeenAt, t0, 'B was not re-observed, lastSeenAt stays at t0')
  assert.ok(byId.has(b.id), 'B must still be present in memory, never deleted')

  assert.equal(c.active, true)
  assert.equal(c.lastSeenAt, t1)

  assert.equal(d.active, true)
  assert.equal(d.firstSeenAt, t1)
  assert.equal(d.userDecision, 'new')
})

test('reconcileBoardSync: a human decision on an opportunity survives it disappearing from the source', () => {
  const t0 = '2026-08-05T00:00:00Z'
  const first = reconcileBoardSync([], [fakeRaw(1)], inScopeAcme, fakeEvaluate, t0)
  const applied = { ...first.opportunities[0]!, userDecision: 'applied' as const }

  const t1 = '2026-08-06T00:00:00Z'
  const second = reconcileBoardSync([applied], [], inScopeAcme, fakeEvaluate, t1)

  assert.equal(second.opportunities.length, 1)
  assert.equal(second.opportunities[0]!.userDecision, 'applied', 'decision must not be lost when position closes')
  assert.equal(second.opportunities[0]!.active, false)
})

test('reconcileBoardSync only deactivates opportunities in scope for this sync, leaving other sources untouched', () => {
  const t0 = '2026-08-05T00:00:00Z'
  const acmeOpp = reconcileBoardSync([], [fakeRaw(1)], inScopeAcme, fakeEvaluate, t0).opportunities[0]!
  const urlOpp = {
    ...acmeOpp,
    id: 'opp-hash-example_com_jobs_9',
    raw: { source: 'url-fetch', url: 'https://example.com/jobs/9', title: 'Unrelated Job', description: 'x' } as RawOpportunity,
  }

  const t1 = '2026-08-06T00:00:00Z'
  const result = reconcileBoardSync([acmeOpp, urlOpp], [], inScopeAcme, fakeEvaluate, t1)
  const byId = new Map(result.opportunities.map(o => [o.id, o]))

  assert.equal(byId.get(acmeOpp.id)!.active, false, 'acme board sync deactivates its own missing posting')
  assert.equal(byId.get(urlOpp.id)!.active, true, 'unrelated url-sourced opportunity must not be touched by an acme board sync')
})

test('MemoryOpportunityRepository: save/findById/findByDedupeKey/updateDecision round trip without losing evaluation history', async () => {
  const repo = new MemoryOpportunityRepository()
  const raw = fakeRaw(1)
  const id = hashOpportunityKey(raw)
  const stored = {
    id,
    raw,
    firstSeenAt: '2026-08-05T00:00:00Z',
    lastSeenAt: '2026-08-05T00:00:00Z',
    active: true,
    evaluation: { rawOpportunity: raw } as any,
    evaluatedAt: '2026-08-05T00:00:00Z',
    knowledgeVersion: 'test-1.0.0',
    userDecision: 'new' as const,
    createdAt: '2026-08-05T00:00:00Z',
    updatedAt: '2026-08-05T00:00:00Z',
  }

  await repo.save(stored)
  assert.deepEqual(await repo.findById(id), stored)
  assert.deepEqual(await repo.findByDedupeKey(id), stored)

  await repo.updateDecision(id, 'interested')
  const updated = await repo.findById(id)
  assert.equal(updated!.userDecision, 'interested')
  assert.deepEqual(updated!.evaluation, stored.evaluation, 'evaluation snapshot must survive a decision update')
  assert.equal(updated!.firstSeenAt, stored.firstSeenAt)
})

test('GreenhousePublicSource.fetchAllBoardJobs returns empty array when jobs field is missing', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({}), { status: 200, headers: { 'content-type': 'application/json' } })
  ) as typeof fetch

  try {
    const source = new GreenhousePublicSource('empty-board')
    const raws = await source.fetchAllBoardJobs()
    assert.deepEqual(raws, [])
  } finally {
    globalThis.fetch = originalFetch
  }
})
