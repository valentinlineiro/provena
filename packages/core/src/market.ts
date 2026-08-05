export interface MarketRequirement {
  readonly id: string
  readonly concept: string
  readonly kind: 'capability' | 'constraint' | 'domain' | 'practice'
  readonly rawText: string
  readonly qualifiers?: readonly string[]
}

export interface MarketModel {
  readonly requirements: readonly MarketRequirement[]
  readonly recognitionCoverage: number
}

// Global market recognition patterns independent of candidate profile
const MARKET_PATTERNS: readonly {
  readonly re: RegExp
  readonly concept: string
  readonly kind: MarketRequirement['kind']
  readonly qualifiers?: readonly string[]
}[] = [
  // Core Languages & Technologies
  { re: /\bpython\b/i, concept: 'Python', kind: 'capability' },
  { re: /\bkubernetes\b|\bk8s\b/i, concept: 'Kubernetes', kind: 'capability' },
  { re: /\b(rest\s*apis?|apis?)\b/i, concept: 'REST APIs', kind: 'capability' },
  { re: /\bsql\b|\bmysql\b|\bpostgres\b/i, concept: 'SQL', kind: 'capability' },
  { re: /\bdevops\b|\bci\/cd\b/i, concept: 'DevOps / CI-CD', kind: 'capability' },
  { re: /\b(software\s*development|software\s*engineering)\b/i, concept: 'Software Development', kind: 'capability' },
  { re: /\b(clean\s*architecture|hexagonal\s*architecture|ddd|domain\s*driven\s*design|software\s*architecture|architectural\s*design)\b/i, concept: 'Software Architecture', kind: 'capability' },
  { re: /\b(distributed\s*systems|distributed\s*architecture|microservices|event-driven)\b/i, concept: 'Distributed Systems', kind: 'capability' },
  { re: /\b(cloud-native|aws|azure|gcp|public\s*cloud)\b/i, concept: 'Cloud-Native Architecture', kind: 'capability' },
  { re: /\b(technical\s*leadership|technical\s*direction|squad\s*leadership)\b/i, concept: 'Technical Leadership', kind: 'capability' },

  // GenAI & LLM Specifics (Minimal linguistic normalization)
  { re: /\b(llm\s*evaluation|evals?\s*strategy|evals?)\b/i, concept: 'LLM Evaluation & Benchmarking', kind: 'practice', qualifiers: ['evals'] },
  { re: /\b(rag|retrieval|vector\s*(?:db|search))\b/i, concept: 'RAG & Retrieval', kind: 'capability', qualifiers: ['vector-search'] },
  { re: /\b(agentic\s*workflows?|multi-agent)\b/i, concept: 'Agentic Workflows', kind: 'practice', qualifiers: ['orchestration'] },
  { re: /\b(prompt\s*(?:versioning|engineering|optimization))\b/i, concept: 'Prompt Lifecycle', kind: 'practice' },
  { re: /\b(red\s*teaming|bias\s*mitigation|responsible\s*ai|ai\s*safety)\b/i, concept: 'AI Safety & Guardrails', kind: 'domain' },

  // AppSec & Security Domain (Minimal linguistic normalization)
  { re: /\b(aspm|application\s*security\s*posture)\b/i, concept: 'ASPM', kind: 'domain' },
  { re: /\b(sast|dast|sca)\b/i, concept: 'Static & Dynamic Code Analysis (SAST/DAST/SCA)', kind: 'domain' },
  { re: /\b(sbom|spdx|cyclonedx)\b/i, concept: 'Software Bill of Materials (SBOM)', kind: 'practice' },
  { re: /\b(appsec|cloud-native\s*security)\b/i, concept: 'Application Security', kind: 'domain' },

  // Delivery, Process & Ownership (Minimal linguistic normalization)
  { re: /\b(sdlc|ttm|time-to-market)\b/i, concept: 'SDLC Optimization & Time-to-Market', kind: 'practice' },
  { re: /\b(agile|scrum|kanban)\b/i, concept: 'Agile Delivery Frameworks', kind: 'practice' },
  { re: /\b(budget|tco|total\s*cost\s*of\s*ownership)\b/i, concept: 'Technical Ownership & Budget', kind: 'practice' },

  // Domain Specifics (Minimal linguistic normalization)
  { re: /\b(healthcare|clinical|ehr|regulated)\b/i, concept: 'Regulated Healthcare Systems', kind: 'domain' },
  { re: /\b(rent-to-own|proptech|fintech|fundraising|due\s*diligence)\b/i, concept: 'Fintech / Proptech Operations', kind: 'domain' },

  // Work Mode Constraints
  { re: /\bremote\b|\bwork\s*from\s*home\b|\bwfh\b/i, concept: 'Remote Work', kind: 'constraint' },
  { re: /\bhybrid\b/i, concept: 'Hybrid Work', kind: 'constraint' },
]

export function extractMarketRequirements(jd: string): MarketModel {
  const text = jd.toLowerCase()
  const requirements: MarketRequirement[] = []
  let matchedCharCount = 0

  for (let i = 0; i < MARKET_PATTERNS.length; i++) {
    const p = MARKET_PATTERNS[i]!
    const match = p.re.exec(jd)
    if (match) {
      requirements.push({
        id: `mr-${i + 1}`,
        concept: p.concept,
        kind: p.kind,
        rawText: match[0],
        qualifiers: p.qualifiers,
      })
      matchedCharCount += match[0].length
    }
  }

  const textLen = text.trim().length
  const recognitionCoverage = textLen > 0 ? Math.min(1, Math.round((matchedCharCount / (textLen * 0.15)) * 100) / 100) : 0

  return {
    requirements,
    recognitionCoverage,
  }
}
