import type { Sql } from 'postgres'

export interface AssessmentEvidenceInput {
  capabilityId: string
  weight: number
  matchedText: string
  sourceTaxon: string
}

export interface MarketAssessmentInput {
  opportunityId: string
  profileId?: string
  profileVersion?: string
  protocolVersion?: number
  marketKnowledgeVersion?: number
  recommendation: string
  decisionTier: number
  professionalFit: number
  personalFit: number
  confidence: number
  evaluatedAt?: string
  evidences?: readonly AssessmentEvidenceInput[]
}

export interface MarketAssessmentRecord {
  opportunityId: string
  profileId: string
  profileVersion: string
  protocolVersion: number
  marketKnowledgeVersion: number
  recommendation: string
  decisionTier: number
  professionalFit: number
  personalFit: number
  confidence: number
  evaluatedAt: string
}

export class PostgresMarketAssessmentRepository {
  constructor(private readonly sql: Sql) {}

  async saveAssessment(assessment: MarketAssessmentInput): Promise<void> {
    const profileId = assessment.profileId ?? 'valentin'
    const profileVersion = assessment.profileVersion ?? '1.0.0'
    const protocolVersion = assessment.protocolVersion ?? 1
    const marketKnowledgeVersion = assessment.marketKnowledgeVersion ?? 0
    const evaluatedAt = assessment.evaluatedAt ?? new Date().toISOString()

    await this.sql`
      INSERT INTO opportunity_assessments (
        opportunity_id,
        profile_id,
        profile_version,
        protocol_version,
        market_knowledge_version,
        recommendation,
        decision_tier,
        professional_fit,
        personal_fit,
        confidence,
        evaluated_at
      ) VALUES (
        ${assessment.opportunityId},
        ${profileId},
        ${profileVersion},
        ${protocolVersion},
        ${marketKnowledgeVersion},
        ${assessment.recommendation},
        ${assessment.decisionTier},
        ${assessment.professionalFit},
        ${assessment.personalFit},
        ${assessment.confidence},
        ${evaluatedAt}
      )
      ON CONFLICT (
        opportunity_id,
        profile_id,
        profile_version,
        protocol_version,
        market_knowledge_version
      ) DO NOTHING
    `

    if (assessment.evidences && assessment.evidences.length > 0) {
      for (const ev of assessment.evidences) {
        await this.sql`
          INSERT INTO assessment_evidences (
            opportunity_id,
            profile_id,
            capability_id,
            weight,
            matched_text,
            source_taxon,
            evaluated_at
          ) VALUES (
            ${assessment.opportunityId},
            ${profileId},
            ${ev.capabilityId},
            ${ev.weight},
            ${ev.matchedText},
            ${ev.sourceTaxon},
            ${evaluatedAt}
          )
        `
      }
    }
  }

  async getCurrentAssessment(
    opportunityId: string,
    profileId: string = 'valentin'
  ): Promise<MarketAssessmentRecord | null> {
    const rows = await this.sql<Array<{
      opportunity_id: string
      profile_id: string
      profile_version: string
      protocol_version: number
      market_knowledge_version: number
      recommendation: string
      decision_tier: number
      professional_fit: number
      personal_fit: number
      confidence: number
      evaluated_at: Date | string
    }>>`
      SELECT
        opportunity_id,
        profile_id,
        profile_version,
        protocol_version,
        market_knowledge_version,
        recommendation,
        decision_tier,
        professional_fit,
        personal_fit,
        confidence,
        evaluated_at
      FROM current_opportunity_assessments
      WHERE opportunity_id = ${opportunityId} AND profile_id = ${profileId}
    `

    if (rows.length === 0) return null
    const row = rows[0]!

    return {
      opportunityId: row.opportunity_id,
      profileId: row.profile_id,
      profileVersion: row.profile_version,
      protocolVersion: Number(row.protocol_version),
      marketKnowledgeVersion: Number(row.market_knowledge_version),
      recommendation: row.recommendation,
      decisionTier: Number(row.decision_tier),
      professionalFit: Number(row.professional_fit),
      personalFit: Number(row.personal_fit),
      confidence: Number(row.confidence),
      evaluatedAt: new Date(row.evaluated_at).toISOString(),
    }
  }
}
