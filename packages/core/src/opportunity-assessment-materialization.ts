// CARD-028: the one shared on-demand-assessment contract. Both
// /api/opportunities/ingest (packages/provena-web) and the periodic market
// sync (packages/market-postgres/src/sync-market.ts) must call this, not
// reimplement it, so "needs-attention" is decided the same way regardless
// of which path ingested the opportunity -- this is exactly the formula
// /api/opportunities/ingest already computed inline before CARD-028
// extracted it here.
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import {
  resolveRequirements,
  evaluateSufficiency,
  projectProfessionalFit,
  assessPreferences,
  projectPersonalFit,
  computeRecognitionCoverage,
  applyPolicy,
} from './opportunity.js'

export interface OpportunityAssessmentRecord {
  readonly opportunityId: string
  readonly profileId: string
  readonly profileVersion: string
  readonly protocolVersion: number
  readonly marketKnowledgeVersion: number
  readonly recommendation: string
  readonly decisionTier: number
  readonly professionalFit: number
  readonly personalFit: number
  readonly confidence: number
  readonly evaluatedAt: string
}

export function deriveOpportunityDedupeKey(
  companyName: string | undefined,
  fallbackName: string | undefined,
  externalId: string,
): string {
  const resolvedCompany = companyName ?? fallbackName ?? 'Unknown'
  const normalizedCompany = resolvedCompany.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `opp-${normalizedCompany}-${externalId}`
}

export function assessOpportunityDescription(
  opportunityId: string,
  description: string,
  profile: Profile,
  recognizer: IMarketRecognizer,
  now: string,
): OpportunityAssessmentRecord {
  const marketModel = recognizer.extractMarketRequirements(description)
  const resolved = resolveRequirements(marketModel, profile)
  const sufficiencyList = resolved.map(evaluateSufficiency)
  const professionalFit = projectProfessionalFit(sufficiencyList)
  const preferenceAssessments = assessPreferences(description, profile.preferences)
  const personalFit = projectPersonalFit(preferenceAssessments)
  const recognitionCoverage = computeRecognitionCoverage(description, marketModel)
  const assessment = applyPolicy(professionalFit, personalFit, recognitionCoverage)

  const decisionTier = assessment.recommendation === 'strong-candidate' ? 4 :
    assessment.recommendation === 'consider' ? 3 :
    assessment.recommendation === 'abstain' ? 2 : 1

  return {
    opportunityId,
    profileId: 'valentin',
    profileVersion: '1.0.0',
    protocolVersion: 1,
    // NOTE: hardcoded, matching the pre-existing on-demand contract exactly
    // -- opportunity_assessments.market_knowledge_version is an INT column
    // and the real composed version is a string ("1.0.0+1.0.0"), so the
    // on-demand path never wrote it either. Not this card's semantics to
    // change.
    marketKnowledgeVersion: 1,
    recommendation: assessment.recommendation,
    decisionTier,
    professionalFit: professionalFit.score,
    personalFit: personalFit.assessedCount > 0 ? personalFit.score : 0,
    confidence: assessment.confidence,
    evaluatedAt: now,
  }
}
