import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateSafeUrl, extractJobFromHtml, DeclarativeMarketRecognizer, composeKnowledge, DEFAULT_SOFTWARE_KNOWLEDGE, MLOPS_KNOWLEDGE, GreenhousePublicSource, hashOpportunityKey } from './index.js'

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
