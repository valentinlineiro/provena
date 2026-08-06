// ── O2.7A: Opportunity Assessment Engine ─────────────────────────────────────
//
// Evaluates retrieved candidates against candidate Profile and PreferenceSet.
// Invariant: Does NOT re-parse JD text. Consumes pre-extracted MarketModelRecords.
//
// Generates reproducible UserOpportunityAssessment snapshots versioned across 4 axes:
//   - marketKnowledgeVersion
//   - protocolVersion
//   - profileVersion
//   - preferenceVersion

import type { Profile } from './profile.js'
import type { PreferenceSet } from './preference-set.js'
import type {
  CandidateOpportunity,
  MarketModelStore,
} from './index.js'
import type {
  UserOpportunityAssessment,
} from './market-catalog.js'
import { makeOpportunityId } from './market-catalog.js'
import {
  resolveRequirements,
  evaluateSufficiency,
  projectProfessionalFit,
  assessPreferences,
  projectPersonalFit,
  applyPolicy,
} from './opportunity.js'
import { preferenceSetToLegacy } from './compat.js'

export interface AssessmentContext {
  readonly userId: string
  readonly protocolVersion: string
  readonly profileVersion: string
  readonly preferenceVersion: string
  readonly now: string
}

export class OpportunityAssessmentEngine {
  constructor(private readonly modelStore: MarketModelStore) {}

  async assessCandidate(
    candidate: CandidateOpportunity,
    profile: Profile,
    preferenceSet: PreferenceSet,
    context: AssessmentContext,
  ): Promise<UserOpportunityAssessment> {
    const oppId = makeOpportunityId(candidate.id)
    const marketModelRecord = await this.modelStore.findCurrent(oppId)

    if (!marketModelRecord) {
      throw new Error(`Cannot assess candidate "${candidate.id}": missing MarketModelRecord in store.`)
    }

    const marketModel = marketModelRecord.marketModelJson

    // 1. K4 Professional Fit Resolution
    const resolved = resolveRequirements(marketModel, profile)
    const sufficiencyList = resolved.map(r => evaluateSufficiency(r))
    const professionalFit = projectProfessionalFit(sufficiencyList)

    // 2. K5B Personal Fit Resolution (using legacy adapter compatibility during transition)
    const legacyPrefs = preferenceSetToLegacy(preferenceSet)
    const preferenceAssessments = assessPreferences(candidate.rawDescription, legacyPrefs)
    const personalFit = projectPersonalFit(preferenceAssessments)

    // 3. K6 Policy Application
    const assessmentJson = applyPolicy(
      professionalFit,
      personalFit,
      marketModelRecord.recognitionCoverage,
    )

    return {
      userId: context.userId,
      opportunityId: oppId,
      marketKnowledgeVersion: marketModelRecord.marketKnowledgeVersion,
      protocolVersion: context.protocolVersion,
      profileVersion: context.profileVersion,
      preferenceVersion: context.preferenceVersion,
      assessmentJson,
      professionalFitScore: professionalFit.score,
      personalFitScore: personalFit.score,
      confidence: assessmentJson.confidence,
      recommendation: assessmentJson.recommendation,
      evaluatedAt: context.now,
    }
  }

  async assessCandidates(
    candidates: readonly CandidateOpportunity[],
    profile: Profile,
    preferenceSet: PreferenceSet,
    context: AssessmentContext,
  ): Promise<readonly UserOpportunityAssessment[]> {
    const assessments: UserOpportunityAssessment[] = []
    for (const candidate of candidates) {
      const assessment = await this.assessCandidate(candidate, profile, preferenceSet, context)
      assessments.push(assessment)
    }
    return assessments
  }
}
