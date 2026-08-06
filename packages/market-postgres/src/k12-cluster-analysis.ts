// K12 Fase 1 — Semantic family characterization of market-coverage-gaps.
//
// Operates over the LIVE Stripe board (548 jobs) entirely in-memory:
//   - No writes to O2 Postgres storage (O2 remains inalterable).
//   - Uses the real profile + unmodified OpportunityAssessmentEngine (K1-K6C).
//
// Pipeline: LiveBoard -> MarketIngestionEngine(in-memory) -> AssessmentEngine
//           -> filter market-coverage-gap -> semantic family clustering
//           -> frequency ranking -> select K12 unit #1 -> report + delta.

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  GreenhousePublicSource,
  MarketIngestionEngine,
  DeclarativeMarketRecognizer,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  OpportunityAssessmentEngine,
  MemoryMarketOpportunityRepository,
  MemoryMarketPostingRepository,
  MemoryMarketModelStore,
} from '@provena/core'
import { YamlWorkspaceLoader } from '@provena/yaml'

interface Family {
  readonly name: string
  readonly keywords: readonly string[]
}

// First-match-wins; specific titles before generic ones.
// Titles are the reliable signal — Stripe JDs all share an identical
// "financial infrastructure platform" boilerplate, so descriptions would
// misclassify every role as Engineering.
const FAMILIES: readonly Family[] = [
  {
    name: 'GTM / Commercial Sales',
    keywords: [
      'account executive', 'sales development', 'sales manager', 'head of sales', 'business development',
      'account manager', 'customer success', 'partner development', 'partnerships', 'revenue',
      'sales compensation', 'sales excellence', 'startup and venture', 'scaled', 'grower', 'hunter',
      'bridge', 'sdr', 'bdr', 'quota',
    ],
  },
  {
    name: 'Engineering & Data',
    keywords: [
      'engineer', 'software', 'frontend', 'backend', 'fullstack', 'data science', 'data products',
      'machine learning', ' ml ', ' ai ', 'ai product manager', 'solutions architecture', 'analytics',
      'design engineer', 'scientist', 'intern',
    ],
  },
  {
    name: 'Risk, Compliance & Legal',
    keywords: [
      'risk', 'compliance', 'sanctions', 'aml', 'financial crimes', 'fraud', 'counsel', 'legal',
      'privacy', 'regulatory', 'mlro', 'investigations', 'law enforcement', 'verifications',
      'government relations',
    ],
  },
  {
    name: 'Finance, Accounting & Tax',
    keywords: [
      'accounting', 'accounts receivable', 'tax', 'treasury', 'controller', 'finance', 'audit',
      'fp&a', 'payroll', 'financial analyst',
    ],
  },
  {
    name: 'Customer Support & Operations',
    keywords: [
      'support', 'success', 'operations', 'delivery', 'technical account management', 'taxjar',
      'managed', 'help', 'supply', 'seller systems',
    ],
  },
  {
    name: 'Marketing & Communications',
    keywords: [
      'marketing', 'communications', 'content', 'social', 'brand', 'video', 'motion', 'writer',
      'seo', 'geo', 'campaigns', 'market intelligence', 'events', 'press', 'product marketing',
    ],
  },
  {
    name: 'Product, Design & Program',
    keywords: [
      'designer', 'design ', 'product manager', 'product lead', 'staff product', 'program manager',
      'project manager', 'strategy & operations', 'strategy & ops', 'product strategy', 'product operations',
    ],
  },
  {
    name: 'People, HR & Business Ops',
    keywords: [
      'people', 'recruiter', 'recruiting', 'talent', 'administrative', 'coordinator', 'workplace',
      'hr ', 'reward', 'university',
    ],
  },
]

function classifyTitle(title: string): Family {
  const lower = ` ${title.toLowerCase()} `
  for (const family of FAMILIES) {
    if (family.keywords.some(kw => lower.includes(kw))) return family
  }
  return { name: 'Uncategorized', keywords: [] }
}

async function runClusterAnalysis() {
  const loader = new YamlWorkspaceLoader()
  const { profile } = await loader.load(join(process.cwd(), 'profiles/valentin'))

  const oppRepo = new MemoryMarketOpportunityRepository()
  const postRepo = new MemoryMarketPostingRepository()
  const modelStore = new MemoryMarketModelStore()
  const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
  const ingestionEngine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
  const source = new GreenhousePublicSource('stripe', { maxSizeBytes: 20 * 1024 * 1024 })

  console.log('Fetching live Stripe board...')
  const rawJobs = await source.fetchAllBoardJobs()
  console.log(`Fetched ${rawJobs.length} raw jobs.`)

  await ingestionEngine.ingest(rawJobs, {
    now: new Date().toISOString(),
    marketKnowledgeVersion: '1.0.0',
    recognitionOrder: 100,
    sourceType: 'greenhouse',
    sourceBoardId: 'stripe',
  })

  const candidates = []
  for (const o of await oppRepo.list()) {
    const postings = await postRepo.listByOpportunity(o.id)
    const active = postings.find(p => p.active) || postings[0]
    if (active) {
      candidates.push({
        id: o.id,
        externalId: active.externalId,
        title: o.title,
        companyName: o.company.name,
        rawDescription: active.rawDescription,
        url: active.url,
      })
    }
  }

  const assessor = new OpportunityAssessmentEngine(modelStore)
  const assessments = await assessor.assessCandidates(candidates, profile, profile.preferenceSet!, {
    userId: 'valentin',
    protocolVersion: '1.0.0',
    profileVersion: '1.0.0',
    preferenceVersion: '1.0.0',
    now: new Date().toISOString(),
  })

  const abstained = assessments.filter(a => a.recommendation === 'abstain')
  const gaps = abstained.filter(a => {
    const prof = a.assessmentJson.professionalFit
    return prof.totalRequirements === 0 || prof.assessmentCoverage < 0.25
  })

  console.log(`Total Active Candidates: ${candidates.length}`)
  console.log(`Total ABSTAINs: ${abstained.length}`)
  console.log(`Total Market-Coverage-Gaps: ${gaps.length}`)

  const buckets = new Map<string, { count: number; titles: string[]; externalIds: string[]; keywords: Record<string, number> }>()
  for (const gap of gaps) {
    const cand = candidates.find(c => c.id === gap.opportunityId)
    if (!cand) continue
    const family = classifyTitle(cand.title)
    const bucket = buckets.get(family.name) ?? { count: 0, titles: [], externalIds: [], keywords: {} }
    bucket.count++
    bucket.titles.push(cand.title)
    bucket.externalIds.push(cand.externalId)
    const lower = cand.title.toLowerCase()
    for (const kw of family.keywords) {
      if (lower.includes(kw)) bucket.keywords[kw] = (bucket.keywords[kw] ?? 0) + 1
    }
    buckets.set(family.name, bucket)
  }

  const sorted = [...buckets.entries()].sort((a, b) => b[1].count - a[1].count)
  const target = sorted[0]!

  console.log('\n=== K12 Semantic Family Breakdown ===')
  for (const [name, info] of sorted) {
    const pct = Math.round((info.count / gaps.length) * 100)
    console.log(`[${pct}%] ${name} — ${info.count} positions`)
    console.log(`     Sample Titles: ${info.titles.slice(0, 3).join(', ')}`)
  }

  const expDir = join(process.cwd(), 'experiments/k12-learning/stripe-gap-clusters')
  mkdirSync(expDir, { recursive: true })

  const familyRows = sorted.map(([name, info]) => {
    const pct = Math.round((info.count / gaps.length) * 100)
    const samples = info.titles.slice(0, 6).map(t => `  - ${t}`).join('\n')
    return `### \`${name}\` — ${info.count} (${pct}%)\n${samples || '  - (none)'}`
  }).join('\n\n')

  const report = `# K12 Cluster Analysis — Semantic Breakdown of ${gaps.length} Market-Coverage-Gaps

- **Date**: ${new Date().toISOString()}
- **Market Observed**: Stripe live Greenhouse board (${rawJobs.length} jobs, in-memory ingestion)
- **Total ABSTAIN Evaluations**: ${abstained.length}
- **Total Coverage Gaps Diagnosed**: ${gaps.length}

## Semantic Family Frequency

${familyRows}

## K12 Target Unit #1
**\`${target[0]}\`** — ${target[1].count} positions (${Math.round((target[1].count / gaps.length) * 100)}% of coverage gaps).

Selection rule (ΔResolutionRate/ΔK_patterns): a single MarketPatternDefinition for this family
resolves the most ABSTAINs to explicit decisions per rule introduced.

### Observed titles in target cluster
${target[1].titles.map(t => `  - ${t}`).join('\n')}

### External IDs (for Recovery / Virgin Holdout / Controls)
${target[1].externalIds.join(', ')}
`

  writeFileSync(join(expDir, 'report.md'), report, 'utf-8')

  const clustersJson = JSON.stringify({
    date: new Date().toISOString(),
    marketSize: candidates.length,
    abstains: abstained.length,
    coverageGaps: gaps.length,
    families: Object.fromEntries(sorted),
    targetUnit: { name: target[0], count: target[1].count },
  }, null, 2)
  writeFileSync(join(expDir, 'clusters.json'), clustersJson, 'utf-8')

  const delta = {
    k12Unit: 'U1',
    family: target[0],
    observedFrequency: target[1].count,
    observedExternalIds: target[1].externalIds,
    observedTitles: target[1].titles,
    candidateMatchers: Object.entries(target[1].keywords)
      .sort((a, b) => b[1] - a[1])
      .map(([kw, n]) => ({ matcher: kw, observedIn: n })),
  }
  writeFileSync(join(expDir, 'candidate-delta.json'), JSON.stringify(delta, null, 2), 'utf-8')

  console.log(`\nReport saved to ${join(expDir, 'report.md')}`)
  console.log(`Candidate delta saved to ${join(expDir, 'candidate-delta.json')}`)
}

runClusterAnalysis().catch(err => {
  console.error(err)
  process.exit(1)
})
