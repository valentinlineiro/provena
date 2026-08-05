export interface RequirementQualifier {
  readonly kind: 'context' | 'proficiency' | 'scale' | 'duration' | 'cardinality'
  readonly value: string
  readonly rawText: string
}

export interface MarketRequirement {
  readonly id: string
  readonly concept: string
  readonly kind: 'capability' | 'constraint' | 'domain' | 'practice'
  readonly rawText: string
  readonly qualifiers?: readonly RequirementQualifier[]
}

export interface MarketModel {
  readonly requirements: readonly MarketRequirement[]
  readonly recognitionCoverage: number
}

function extractSentenceQualifiers(sentence: string): RequirementQualifier[] {
  const qualifiers: RequirementQualifier[] = []

  // 1. Proficiency qualifiers (e.g. "deep proficiency", "expert-level", "hands-on experience", "strong knowledge")
  const profMatch = /(?:deep proficiency|expert-level|expert|strong knowledge|hands-on experience|proven experience|proficiency)/i.exec(sentence)
  if (profMatch) {
    qualifiers.push({
      kind: 'proficiency',
      value: profMatch[0].toLowerCase(),
      rawText: profMatch[0],
    })
  }

  // 2. Scale qualifiers (e.g. "at scale", "production-grade", "production", "high load")
  const scaleMatch = /(?:at scale|production-grade|production|high load|high-volume|enterprise)/i.exec(sentence)
  if (scaleMatch) {
    qualifiers.push({
      kind: 'scale',
      value: scaleMatch[0].toLowerCase(),
      rawText: scaleMatch[0],
    })
  }

  // 3. Duration & Cardinality qualifiers (e.g. "5+ years", "3+ years", "multiple products")
  const durMatch = /(?:\d+\+?\s*years?|multiple products|multiple systems)/i.exec(sentence)
  if (durMatch) {
    qualifiers.push({
      kind: 'duration',
      value: durMatch[0].toLowerCase(),
      rawText: durMatch[0],
    })
  }

  // 4. Contextual qualifiers (e.g. "for data and ml engineering", "in healthcare", "for backend systems")
  const ctxMatch = /(?:for\s+[a-z0-9\s/&]+(?:systems|engineering|workflows|applications)?|in\s+[a-z0-9\s/&]+(?:environment|systems|healthcare|finance)?)/i.exec(sentence)
  if (ctxMatch) {
    qualifiers.push({
      kind: 'context',
      value: ctxMatch[0].trim().toLowerCase(),
      rawText: ctxMatch[0].trim(),
    })
  }

  return qualifiers
}

// Global market recognition patterns independent of candidate profile
const MARKET_PATTERNS: readonly {
  readonly re: RegExp
  readonly concept: string
  readonly kind: MarketRequirement['kind']
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

  // GenAI & LLM Specifics (Expanded for K3)
  { re: /\b(llm\s*evaluation|evals?\s*strategy|evals?)\b/i, concept: 'LLM Evaluation & Benchmarking', kind: 'practice' },
  { re: /\b(rag|retrieval|vector\s*(?:db|search))\b/i, concept: 'RAG & Retrieval', kind: 'capability' },
  { re: /\b(agentic\s*workflows?|multi-agent)\b/i, concept: 'Agentic Workflows', kind: 'practice' },
  { re: /\b(prompt\s*(?:versioning|engineering|optimization))\b/i, concept: 'Prompt Lifecycle', kind: 'practice' },
  { re: /\b(red\s*teaming|bias\s*mitigation|responsible\s*ai|ai\s*safety)\b/i, concept: 'AI Safety & Guardrails', kind: 'domain' },
  { re: /\b(ai-assisted\s*(?:engineering|software|tools)|use\s*ai\s*aggressively|ai\s*patent\s*drafting)\b/i, concept: 'AI-Assisted Engineering', kind: 'practice' },

  // AppSec & Security Domain (Expanded for K3)
  { re: /\b(aspm|application\s*security\s*posture)\b/i, concept: 'ASPM', kind: 'domain' },
  { re: /\b(sast|dast|sca)\b/i, concept: 'Static & Dynamic Code Analysis (SAST/DAST/SCA)', kind: 'domain' },
  { re: /\b(sbom|spdx|cyclonedx)\b/i, concept: 'Software Bill of Materials (SBOM)', kind: 'practice' },
  { re: /\b(appsec|cloud-native\s*security)\b/i, concept: 'Application Security', kind: 'domain' },

  // Delivery, Process & Ownership (Expanded for K3)
  { re: /\b(sdlc|ttm|time-to-market)\b/i, concept: 'SDLC Optimization & Time-to-Market', kind: 'practice' },
  { re: /\b(agile|scrum|kanban)\b/i, concept: 'Agile Delivery Frameworks', kind: 'practice' },
  { re: /\b(budget|tco|total\s*cost\s*of\s*ownership)\b/i, concept: 'Technical Ownership & Budget', kind: 'practice' },

  // Domain Specifics
  { re: /\b(healthcare|clinical|ehr|regulated)\b/i, concept: 'Regulated Healthcare Systems', kind: 'domain' },
  { re: /\b(rent-to-own|proptech|fintech|fundraising|due\s*diligence)\b/i, concept: 'Fintech / Proptech Operations', kind: 'domain' },

  // Work Mode Constraints
  { re: /\bremote\b|\bwork\s*from\s*home\b|\bwfh\b/i, concept: 'Remote Work', kind: 'constraint' },
  { re: /\bhybrid\b/i, concept: 'Hybrid Work', kind: 'constraint' },
]

export function extractMarketRequirements(jd: string): MarketModel {
  const text = jd.toLowerCase()
  const sentences = jd.split(/(?:\n+|\.\s+|\;\s+)/).map(s => s.trim()).filter(Boolean)
  const requirements: MarketRequirement[] = []
  let matchedCharCount = 0

  for (let i = 0; i < MARKET_PATTERNS.length; i++) {
    const p = MARKET_PATTERNS[i]!
    const match = p.re.exec(jd)
    if (match) {
      // Find the sentence containing this match to extract clause-level qualifiers
      const containingSentence = sentences.find(s => p.re.test(s)) ?? match[0]
      const qualifiers = extractSentenceQualifiers(containingSentence)

      requirements.push({
        id: `mr-${i + 1}`,
        concept: p.concept,
        kind: p.kind,
        rawText: match[0],
        qualifiers: qualifiers.length > 0 ? qualifiers : undefined,
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
