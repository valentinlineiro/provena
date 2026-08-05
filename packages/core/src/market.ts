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
  // Capabilities / Languages / Infrastructure
  { re: /\bpython\b/i, concept: 'Python', kind: 'capability' },
  { re: /\bkubernetes\b|\bk8s\b/i, concept: 'Kubernetes', kind: 'capability' },
  { re: /\b(rest\s*apis?|apis?)\b/i, concept: 'REST APIs', kind: 'capability' },
  { re: /\bsql\b|\bmysql\b|\bpostgres\b/i, concept: 'SQL', kind: 'capability' },
  { re: /\bdevops\b|\bci\/cd\b/i, concept: 'DevOps / CI-CD', kind: 'capability' },
  { re: /\b(llm|generative\s*ai|rag|retrieval|vector\s*(?:db|search))\b/i, concept: 'LLM & GenAI Systems', kind: 'capability' },
  { re: /\b(software\s*development|software\s*engineering)\b/i, concept: 'Software Development', kind: 'capability' },
  { re: /\b(clean\s*architecture|hexagonal\s*architecture|ddd|domain\s*driven\s*design|software\s*architecture|architectural\s*design)\b/i, concept: 'Software Architecture', kind: 'capability' },
  { re: /\b(distributed\s*systems|distributed\s*architecture|microservices|event-driven)\b/i, concept: 'Distributed Systems', kind: 'capability' },
  { re: /\b(cloud-native|aws|azure|gcp|public\s*cloud)\b/i, concept: 'Cloud-Native Architecture', kind: 'capability' },
  { re: /\b(technical\s*leadership|technical\s*direction|squad\s*leadership)\b/i, concept: 'Technical Leadership', kind: 'capability' },

  // AppSec & Security Domain
  { re: /\b(appsec|aspm|sast|dast|sca|sbom|spdx|cyclonedx)\b/i, concept: 'Application Security (AppSec)', kind: 'domain' },

  // Practices & Process
  { re: /\b(agile|scrum|kanban|sdlc|ttm|time-to-market)\b/i, concept: 'Software Delivery Practices', kind: 'practice' },

  // Constraints
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
