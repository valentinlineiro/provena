import { DeclarativeMarketRecognizer } from './market-knowledge.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'

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

const defaultRecognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)

export function extractMarketRequirements(jd: string): MarketModel {
  return defaultRecognizer.extractMarketRequirements(jd)
}

