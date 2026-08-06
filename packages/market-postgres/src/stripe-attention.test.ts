import { test } from 'node:test'
import assert from 'node:assert/strict'
import postgres from 'postgres'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  GreenhousePublicSource,
  MarketIngestionEngine,
  DeclarativeMarketRecognizer,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  DirectRetrievalPolicy,
  OpportunityAssessmentEngine,
  DefaultOpportunityRankingPolicy,
} from '@provena/core'
import { YamlWorkspaceLoader } from '@provena/yaml'
import {
  PostgresMarketOpportunityRepository,
  PostgresMarketPostingRepository,
  PostgresMarketModelStore,
  PostgresOpportunitySearchAdapter,
} from '@provena/market-postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://provena:provena@localhost:5432/provena_test'

test('O2.7 End-to-End Experiment: Full Pipeline & Attention Reduction Benchmark on Stripe Catalog', async () => {
  let sql: postgres.Sql
  try {
    sql = postgres(DATABASE_URL, { max: 1 })
    await sql`SELECT 1`
  } catch {
    console.log('Skipping Stripe attention experiment: Database connection failed.')
    return
  }

  // 1. Setup DB Schema
  const schemaSql = readFileSync(join(import.meta.dirname, '../../market-postgres/src/schema.sql'), 'utf-8')
  await sql.unsafe(schemaSql)

  const oppRepo = new PostgresMarketOpportunityRepository(sql)
  const postRepo = new PostgresMarketPostingRepository(sql)
  const modelStore = new PostgresMarketModelStore(sql)
  const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)

  // 2. Global Market Ingestion (O2.5A)
  const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
  const source = new GreenhousePublicSource('stripe', { maxSizeBytes: 10 * 1024 * 1024 })

  console.log('Ensuring global market catalog is synced...')
  const rawJobs = await source.fetchAllBoardJobs()
  await engine.ingest(rawJobs, {
    now: new Date().toISOString(),
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 100,
    sourceType: 'greenhouse',
    sourceBoardId: 'stripe',
  })

  // 3. Candidate Profile & PreferenceSet Loading from YAML (O2.6)
  const loader = new YamlWorkspaceLoader()
  const profilePath = join(process.cwd(), 'profiles/valentin')
  const { profile } = await loader.load(profilePath)

  assert.ok(profile.preferenceSet, 'Profile must have preferenceSet loaded from YAML')

  // 4. Candidate Retrieval (O2.5B)
  const retrievalPolicy = new DirectRetrievalPolicy()
  const criteria = retrievalPolicy.toRetrievalCriteria(profile.preferenceSet)
  const searchAdapter = new PostgresOpportunitySearchAdapter(sql)
  const candidates = await searchAdapter.search(criteria)

  console.log(`Observed Market: ${rawJobs.length} postings`)
  console.log(`Retrieved Candidates: ${candidates.length} opportunities`)

  // 5. Personalized Candidate Assessment (O2.7A)
  const assessmentEngine = new OpportunityAssessmentEngine(modelStore)
  const context = {
    userId: 'valentin',
    protocolVersion: '2.7.0',
    profileVersion: '20260806',
    preferenceVersion: '1.0',
    now: new Date().toISOString(),
  }

  const userAssessments = await assessmentEngine.assessCandidates(
    candidates,
    profile,
    profile.preferenceSet,
    context,
  )

  // 6. Ranking & Attention Reduction Inbox (O2.7B)
  const rankingPolicy = new DefaultOpportunityRankingPolicy()
  const ranked = rankingPolicy.rank(userAssessments)
  const inbox = rankingPolicy.buildAttentionInbox(ranked, rawJobs.length)

  console.log('--- Provena Attention Inbox ---')
  console.log(`Needs Immediate Attention (Strong Candidate): ${inbox.needsAttention.length}`)
  console.log(`Worth Considering: ${inbox.worthConsidering.length}`)
  console.log(`Uncertain (Abstain / Insufficient Info): ${inbox.uncertain.length}`)
  console.log(`Filtered Out (Skip / Ineligible): ${inbox.filtered.length}`)
  console.log(`Attention Reduction Ratio: ${inbox.attentionReductionRatio}%`)

  assert.ok(inbox.attentionReductionRatio > 0, 'Attention reduction ratio must be positive')
  assert.ok(inbox.attentionSetCount <= candidates.length, 'Attention set must be <= candidates retrieved')

  // Known Control Positions Recall Guardrail Audit
  const knownControlTitles = [
    'Staff Engineer',
    'Principal Engineer',
    'AI Engineer',
    'Platform Engineer',
  ]

  const controlMatchesInAttention = inbox.needsAttention.filter(item => {
    const candidateObj = candidates.find(c => c.id === item.assessment.opportunityId)
    return candidateObj && knownControlTitles.some(t => candidateObj.title.includes(t))
  })

  console.log(`Control Relevant Roles in Immediate Attention Set: ${controlMatchesInAttention.length}`)

  // Write experiment report
  const expDir = join(import.meta.dirname, '../../../../experiments/o2-market/stripe-attention')
  mkdirSync(expDir, { recursive: true })

  const topItems = inbox.needsAttention.slice(0, 10).map(item => {
    const opp = candidates.find(c => c.id === item.assessment.opportunityId)
    return `- **${opp?.title ?? item.assessment.opportunityId}** (Fit: ${item.assessment.professionalFitScore}, Confidence: ${Math.round(item.assessment.confidence * 100)}%)\n  *Rationale*: ${item.assessment.assessmentJson.rationale}`
  }).join('\n\n')

  const report = `# O2.7 End-to-End Experiment Report — Personalized Assessment & Attention Reduction

- **Date**: ${new Date().toISOString()}
- **Observed Market**: ${rawJobs.length} postings
- **Retrieved Candidates**: ${candidates.length} opportunities
- **Attention Set (Needs Attention + Worth Considering)**: ${inbox.attentionSetCount}
- **Attention Reduction Ratio**: **${inbox.attentionReductionRatio}%**

## Pipeline Funnel Breakdown
| Stage | Count | Ratio |
| :--- | :---: | :---: |
| **1. Observed Market (Stripe Board)** | ${rawJobs.length} | 100% |
| **2. Candidates Retrieved (SQL Filter)** | ${candidates.length} | ${Math.round((candidates.length / rawJobs.length) * 100)}% |
| **3. Needs Immediate Attention (Strong Candidate)** | ${inbox.needsAttention.length} | ${Math.round((inbox.needsAttention.length / rawJobs.length) * 100)}% |
| **4. Worth Considering** | ${inbox.worthConsidering.length} | ${Math.round((inbox.worthConsidering.length / rawJobs.length) * 100)}% |
| **5. Uncertain (Abstain)** | ${inbox.uncertain.length} | - |
| **6. Filtered Out / Ineligible** | ${inbox.filtered.length} | - |

## Top Attention Items
${topItems}
`

  writeFileSync(join(expDir, 'report.md'), report, 'utf-8')
  console.log(`Experiment report written to ${join(expDir, 'report.md')}`)

  await sql.end()
})
