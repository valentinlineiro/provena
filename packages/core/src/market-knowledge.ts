import type { MarketModel, MarketRequirement, RequirementQualifier } from './market.js'

export interface MarketPatternDefinition {
  readonly id: string
  readonly concept: string
  readonly kind: MarketRequirement['kind']
  readonly matchers: readonly (string | RegExp)[]
  readonly tags?: readonly string[]
}

export interface MarketKnowledge {
  readonly name: string
  readonly version: string
  readonly patterns: readonly MarketPatternDefinition[]
}

export interface IMarketRecognizer {
  extractMarketRequirements(jd: string): MarketModel
}

function extractSentenceQualifiers(sentence: string): RequirementQualifier[] {
  const qualifiers: RequirementQualifier[] = []

  const profMatch = /(?:deep proficiency|expert-level|expert|strong knowledge|hands-on experience|proven experience|proficiency)/i.exec(sentence)
  if (profMatch) {
    qualifiers.push({
      kind: 'proficiency',
      value: profMatch[0].toLowerCase(),
      rawText: profMatch[0],
    })
  }

  const scaleMatch = /(?:at scale|production-grade|production|high load|high-volume|enterprise)/i.exec(sentence)
  if (scaleMatch) {
    qualifiers.push({
      kind: 'scale',
      value: scaleMatch[0].toLowerCase(),
      rawText: scaleMatch[0],
    })
  }

  const durMatch = /(?:\d+\+?\s*years?|multiple products|multiple systems)/i.exec(sentence)
  if (durMatch) {
    qualifiers.push({
      kind: 'duration',
      value: durMatch[0].toLowerCase(),
      rawText: durMatch[0],
    })
  }

  const ctxMatch = /(?:for\s+[a-z0-9\s/&]+(?:systems|engineering|workflows|applications)?|in\s+[a-z0-9\s/&]+(?:environment|systems|healthcare|finance)?)/i.exec(sentence)
  if (ctxMatch) {
    qualifiers.push({
      kind: 'context',
      value: ctxMatch[0].trim().toLowerCase(),
      rawText: ctxMatch[0].trim(),
    })
  }

  const constraintMatch = /(?:required|must(?: have)?|essential|mandatory|preferred|nice to have|plus|optional)/i.exec(sentence)
  if (constraintMatch) {
    const text = constraintMatch[0].toLowerCase()
    const isRequired = /required|must|essential|mandatory/.test(text)
    qualifiers.push({
      kind: 'constraint_type',
      value: isRequired ? 'required' : 'preferred',
      rawText: constraintMatch[0],
    })
  }

  return qualifiers
}

export class DeclarativeMarketRecognizer implements IMarketRecognizer {
  private readonly knowledge: MarketKnowledge

  constructor(knowledge: MarketKnowledge) {
    this.knowledge = knowledge
  }

  extractMarketRequirements(jd: string): MarketModel {
    const text = jd.toLowerCase()
    const sentences = jd.split(/(?:\n+|\.\s+|\;\s+)/).map(s => s.trim()).filter(Boolean)
    const requirements: MarketRequirement[] = []
    let matchedCharCount = 0

    let reqIndex = 1
    for (const p of this.knowledge.patterns) {
      for (const matcher of p.matchers) {
        const re = typeof matcher === 'string' ? new RegExp(`\\b${matcher}\\b`, 'i') : matcher
        const match = re.exec(jd)
        if (match) {
          const containingSentence = sentences.find(s => re.test(s)) ?? match[0]
          const qualifiers = extractSentenceQualifiers(containingSentence)

          requirements.push({
            id: `mr-${reqIndex++}`,
            concept: p.concept,
            kind: p.kind,
            rawText: match[0],
            qualifiers: qualifiers.length > 0 ? qualifiers : undefined,
          })
          matchedCharCount += match[0].length
          // Match at most once per concept pattern
          break
        }
      }
    }

    const textLen = text.trim().length
    const recognitionCoverage = textLen > 0 ? Math.min(1, Math.round((matchedCharCount / (textLen * 0.15)) * 100) / 100) : 0

    return {
      requirements,
      recognitionCoverage,
    }
  }
}

export function composeKnowledge(...knowledges: readonly MarketKnowledge[]): MarketKnowledge {
  const combinedPatterns: MarketPatternDefinition[] = []
  const seenConcepts = new Set<string>()

  for (const k of knowledges) {
    for (const p of k.patterns) {
      if (!seenConcepts.has(p.concept)) {
        seenConcepts.add(p.concept)
        combinedPatterns.push(p)
      }
    }
  }

  return {
    name: knowledges.map(k => k.name).join('+'),
    version: knowledges.map(k => k.version).join('+'),
    patterns: combinedPatterns,
  }
}
