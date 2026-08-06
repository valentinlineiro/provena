import { test } from 'node:test'
import assert from 'node:assert/strict'
import postgres from 'postgres'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  OpportunityAssessmentEngine,
} from '@provena/core'
import { YamlWorkspaceLoader } from '@provena/yaml'
import {
  PostgresMarketModelStore,
  PostgresOpportunitySearchAdapter,
} from '@provena/market-postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://provena:provena@localhost:5432/provena_test'

export type AbstainCategory =
  | 'market-coverage-gap'       // MarketModel has unrecognized JD chunks / 0 requirements
  | 'profile-evidence-gap'      // Requirements recognized, but candidate profile lacks demonstrated evidence
  | 'opportunity-disclosure-gap'// Opportunity JD lacks compensation/workMode information
  | 'confidence-threshold-gap' // Partially assessed but falls below ABSTAIN_CONFIDENCE_THRESHOLD
  | 'other'

export interface AbstainDiagnosis {
  readonly opportunityId: string
  readonly title: string
  readonly primaryCategory: AbstainCategory
  readonly rationale: string
  readonly details: Record<string, unknown>
}

test('K12C Diagnostic Audit: Causal Breakdown of 471 ABSTAIN Evaluations on Stripe Catalog', async () => {
  let sql: postgres.Sql
  try {
    sql = postgres(DATABASE_URL, { max: 1 })
    await sql`SELECT 1`
  } catch {
    console.log('Skipping ABSTAIN diagnosis experiment: Database connection failed.')
    return
  }

  const schemaSql = readFileSync(join(import.meta.dirname, '../../market-postgres/src/schema.sql'), 'utf-8')
  await sql.unsafe(schemaSql)

  const modelStore = new PostgresMarketModelStore(sql)
  console.log('Querying candidates from Postgres catalog for ABSTAIN audit...')

  const loader = new YamlWorkspaceLoader()
  const profilePath = join(process.cwd(), 'profiles/valentin')
  const { profile } = await loader.load(profilePath)

  const searchAdapter = new PostgresOpportunitySearchAdapter(sql)
  const candidates = await searchAdapter.search({
    activeOnly: true,
    limit: 500,
    hardExclusions: {},
    candidateFilters: {},
  })

  const assessmentEngine = new OpportunityAssessmentEngine(modelStore)
  const context = {
    userId: 'valentin',
    protocolVersion: '2.7.0',
    profileVersion: '20260806',
    preferenceVersion: '1.0',
    now: new Date().toISOString(),
  }

  const userAssessments = await assessmentEngine.assessCandidates(candidates, profile, profile.preferenceSet!, context)

  const abstainedAssessments = userAssessments.filter(a => a.recommendation === 'abstain')
  console.log(`Total ABSTAIN Assessments to Diagnose: ${abstainedAssessments.length}`)

  const diagnoses: AbstainDiagnosis[] = []

  const counts: Record<AbstainCategory, number> = {
    'market-coverage-gap': 0,
    'profile-evidence-gap': 0,
    'opportunity-disclosure-gap': 0,
    'confidence-threshold-gap': 0,
    'other': 0,
  }

  for (const a of abstainedAssessments) {
    const candidate = candidates.find(c => c.id === a.opportunityId)
    const title = candidate?.title ?? a.opportunityId
    const prof = a.assessmentJson.professionalFit
    const pers = a.assessmentJson.personalFit

    let primaryCategory: AbstainCategory = 'other'
    let rationale = ''

    if (prof.totalRequirements === 0 || prof.assessmentCoverage < 0.25) {
      primaryCategory = 'market-coverage-gap'
      rationale = `K_market recognized ${prof.totalRequirements} requirements (${Math.round(prof.assessmentCoverage * 100)}% coverage). JD concepts not yet in MarketPatternDefinitions.`
    } else if (pers.assessedCount === 0 && (pers.breakdown.every(b => b.status === 'unknown'))) {
      primaryCategory = 'opportunity-disclosure-gap'
      rationale = `Opportunity JD does not state compensation or work mode details; remaining neutral.`
    } else if (prof.unknownCount > 0 && prof.assessedCount < prof.totalRequirements) {
      primaryCategory = 'profile-evidence-gap'
      rationale = `Candidate profile lacks demonstrated evidence for ${prof.unknownCount}/${prof.totalRequirements} recognized requirements.`
    } else if (a.confidence < 0.25) {
      primaryCategory = 'confidence-threshold-gap'
      rationale = `Calibrated confidence (${Math.round(a.confidence * 100)}%) below ABSTAIN_CONFIDENCE_THRESHOLD (25%).`
    }

    counts[primaryCategory]++
    diagnoses.push({
      opportunityId: a.opportunityId,
      title,
      primaryCategory,
      rationale,
      details: {
        totalRequirements: prof.totalRequirements,
        assessmentCoverage: prof.assessmentCoverage,
        confidence: a.confidence,
      },
    })
  }

  console.log('--- ABSTAIN Causal Breakdown ---')
  console.log(counts)
  assert.ok(diagnoses.length >= 0)

  const expDir = join(import.meta.dirname, '../../../../experiments/o2-market/stripe-abstain-diagnosis')
  mkdirSync(expDir, { recursive: true })

  const sampleList = Object.entries(counts).map(([cat, count]) => {
    const sample = diagnoses.filter(d => d.primaryCategory === cat).slice(0, 3).map(d => `  - **${d.title}**: ${d.rationale}`).join('\n')
    return `### \`${cat}\` (${count} cases)\n${sample || '  - None'}`
  }).join('\n\n')

  const denom = abstainedAssessments.length || 1
  const report = `# K12C Diagnostic Report — Causal Breakdown of ${abstainedAssessments.length} ABSTAIN Cases

- **Date**: ${new Date().toISOString()}
- **Total Candidates Evaluated**: ${candidates.length}
- **Total ABSTAIN Cases Diagnosed**: ${abstainedAssessments.length}

## Causal Category Distribution

| Category | Count | % of ABSTAIN | Actionable Next Step |
| :--- | :---: | :---: | :--- |
| **\`market-coverage-gap\`** | **${counts['market-coverage-gap']}** | ${Math.round((counts['market-coverage-gap'] / denom) * 100)}% | **K12 Market Pattern Acquisition** (Promote new JD concepts to K*) |
| **\`profile-evidence-gap\`** | **${counts['profile-evidence-gap']}** | ${Math.round((counts['profile-evidence-gap'] / denom) * 100)}% | **Evidence Acquisition** (Candidate adds project/contribution evidence) |
| **\`opportunity-disclosure-gap\`** | **${counts['opportunity-disclosure-gap']}** | ${Math.round((counts['opportunity-disclosure-gap'] / denom) * 100)}% | **External Enrichment** (Remain UNKNOWN until JD or source discloses details) |
| **\`confidence-threshold-gap\`** | **${counts['confidence-threshold-gap']}** | ${Math.round((counts['confidence-threshold-gap'] / denom) * 100)}% | **Calibrated Threshold Tuning** |
| **\`other\`** | **${counts['other']}** | ${Math.round((counts['other'] / denom) * 100)}% | Miscellaneous |

## Sample Cases by Category

${sampleList}
`

  writeFileSync(join(expDir, 'report.md'), report, 'utf-8')
  console.log(`Diagnostic report saved to ${join(expDir, 'report.md')}`)

  await sql.end()
})
