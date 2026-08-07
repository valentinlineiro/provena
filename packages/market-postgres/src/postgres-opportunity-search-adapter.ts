import type { Sql } from 'postgres'
import type {
  OpportunitySearchPort,
  RetrievalCriteria,
  CandidateOpportunity,
  AttentionTab,
} from '@provena/core'

export interface KeysetSearchOptions {
  readonly tab?: AttentionTab
  readonly bookmark?: {
    readonly tier: number
    readonly pf: number
    readonly conf: number
    readonly seen: string
    readonly id: string
  } | null
  readonly userId?: string
  readonly profileId?: string
  readonly limit?: number
}

export interface KeysetSearchResultItem extends CandidateOpportunity {
  readonly recommendation?: string
  readonly decisionTier?: number
  readonly professionalFit?: number
  readonly personalFit?: number
  readonly confidence?: number
  readonly evaluatedAt?: string
  readonly userDecision?: string
}

export class PostgresOpportunitySearchAdapter implements OpportunitySearchPort {
  constructor(private readonly sql: Sql) {}

  async search(criteria: RetrievalCriteria): Promise<readonly CandidateOpportunity[]> {
    const { hardExclusions, candidateFilters, activeOnly, limit } = criteria

    // Build conditional query clauses
    const whereConditions = []

    if (activeOnly) {
      whereConditions.push(this.sql`p.active = true`)
    }

    // ── Hard Exclusions ──────────────────────────────────────────────────────
    if (hardExclusions?.companyNames?.length) {
      whereConditions.push(this.sql`o.company_name NOT IN ${this.sql(hardExclusions.companyNames)}`)
    }

    if (hardExclusions?.companyDomains?.length) {
      whereConditions.push(this.sql`(o.company_domain IS NULL OR o.company_domain NOT IN ${this.sql(hardExclusions.companyDomains)})`)
    }

    if (hardExclusions?.roleFamilies?.length) {
      whereConditions.push(this.sql`(o.role_family IS NULL OR o.role_family NOT IN ${this.sql(hardExclusions.roleFamilies)})`)
    }

    // ── Candidate Filters (UNKNOWN → pass through) ──────────────────────────
    // Invariant: UNKNOWN/NULL values pass through to avoid false negatives.

    if (candidateFilters?.roleFamilies?.length) {
      whereConditions.push(this.sql`(o.role_family IS NULL OR o.role_family IN ${this.sql(candidateFilters.roleFamilies)})`)
    }

    if (candidateFilters?.roleLevels?.length) {
      whereConditions.push(this.sql`(o.role_level IS NULL OR o.role_level IN ${this.sql(candidateFilters.roleLevels)})`)
    }

    // Country codes filter (if raw location contains country code or location is unknown)
    if (candidateFilters?.countryCodes?.length) {
      const ilikeClauses = candidateFilters.countryCodes.map(code => this.sql`p.location ILIKE ${'%' + code + '%'}`)
      const locationSql = ilikeClauses.reduce((acc, clause) => this.sql`${acc} OR ${clause}`)
      whereConditions.push(this.sql`(p.location IS NULL OR (${locationSql}))`)
    }

    // Combine WHERE clauses
    const whereSql = whereConditions.length > 0
      ? whereConditions.reduce((acc, cond) => this.sql`${acc} AND ${cond}`)
      : this.sql`true`

    const rows = await this.sql<Array<{
      id: string
      external_id: string
      title: string
      company_name: string
      raw_description: string
      url: string
      published_at: Date | null
    }>>`
      SELECT
        o.id,
        p.external_id,
        o.title,
        o.company_name,
        p.raw_description,
        p.url,
        p.published_at
      FROM opportunities o
      JOIN opportunity_postings p ON p.opportunity_id = o.id
      WHERE ${whereSql}
      ORDER BY p.first_seen_at DESC
      LIMIT ${limit}
    `

    return rows.map(r => ({
      id: r.id,
      externalId: r.external_id,
      title: r.title,
      companyName: r.company_name,
      rawDescription: r.raw_description,
      url: r.url,
      ...(r.published_at ? { publishedAt: new Date(r.published_at).toISOString() } : {}),
    }))
  }

  async searchKeyset(options: KeysetSearchOptions): Promise<readonly KeysetSearchResultItem[]> {
    const userId = options.userId || 'valentin'
    const profileId = options.profileId || 'valentin'
    const limit = options.limit || 30
    const tab = options.tab || 'needs-attention'

    const whereConditions = []

    whereConditions.push(this.sql`p.active = true`)

    if (tab === 'needs-attention') {
      whereConditions.push(this.sql`a.decision_tier = 4 AND (d.user_decision IS NULL OR d.user_decision = 'new')`)
    } else if (tab === 'worth-considering') {
      whereConditions.push(this.sql`a.decision_tier = 3 AND (d.user_decision IS NULL OR d.user_decision = 'new')`)
    } else if (tab === 'unresolved') {
      whereConditions.push(this.sql`(a.decision_tier IS NULL OR a.decision_tier NOT IN (3, 4)) AND (d.user_decision IS NULL OR d.user_decision = 'new')`)
    } else if (tab === 'decided') {
      whereConditions.push(this.sql`d.user_decision IS NOT NULL AND d.user_decision != 'new'`)
    }

    if (options.bookmark) {
      const { tier, pf, conf, seen, id } = options.bookmark
      const seenDate = new Date(seen)
      whereConditions.push(this.sql`
        (
          (a.decision_tier < ${tier}) OR
          (a.decision_tier = ${tier} AND a.professional_fit < ${pf}) OR
          (a.decision_tier = ${tier} AND a.professional_fit = ${pf} AND a.confidence < ${conf}) OR
          (a.decision_tier = ${tier} AND a.professional_fit = ${pf} AND a.confidence = ${conf} AND a.evaluated_at < ${seenDate}) OR
          (a.decision_tier = ${tier} AND a.professional_fit = ${pf} AND a.confidence = ${conf} AND a.evaluated_at = ${seenDate} AND o.id > ${id})
        )
      `)
    }

    const whereSql = whereConditions.reduce((acc, cond) => this.sql`${acc} AND ${cond}`)

    const rows = await this.sql<Array<{
      id: string
      external_id: string
      title: string
      company_name: string
      raw_description: string
      url: string
      published_at: Date | null
      recommendation: string | null
      decision_tier: number | null
      professional_fit: number | null
      personal_fit: number | null
      confidence: number | null
      evaluated_at: Date | null
      user_decision: string | null
    }>>`
      SELECT
        o.id,
        p.external_id,
        o.title,
        o.company_name,
        p.raw_description,
        p.url,
        p.published_at,
        a.recommendation,
        a.decision_tier,
        a.professional_fit,
        a.personal_fit,
        a.confidence,
        a.evaluated_at,
        d.user_decision
      FROM current_opportunity_assessments a
      JOIN opportunities o ON o.id = a.opportunity_id
      JOIN opportunity_postings p ON p.opportunity_id = a.opportunity_id AND p.active = true
      LEFT JOIN user_opportunity_decisions d ON d.opportunity_id = a.opportunity_id AND d.user_id = ${userId}
      WHERE a.profile_id = ${profileId} AND ${whereSql}
      ORDER BY a.decision_tier DESC, a.professional_fit DESC, a.confidence DESC, a.evaluated_at DESC, o.id ASC
      LIMIT ${limit}
    `

    return rows.map(r => ({
      id: r.id,
      externalId: r.external_id,
      title: r.title,
      companyName: r.company_name,
      rawDescription: r.raw_description,
      url: r.url,
      ...(r.published_at ? { publishedAt: new Date(r.published_at).toISOString() } : {}),
      ...(r.recommendation ? { recommendation: r.recommendation } : {}),
      ...(r.decision_tier !== null ? { decisionTier: r.decision_tier } : {}),
      ...(r.professional_fit !== null ? { professionalFit: r.professional_fit } : {}),
      ...(r.personal_fit !== null ? { personalFit: r.personal_fit } : {}),
      ...(r.confidence !== null ? { confidence: r.confidence } : {}),
      ...(r.evaluated_at ? { evaluatedAt: new Date(r.evaluated_at).toISOString() } : {}),
      ...(r.user_decision ? { userDecision: r.user_decision } : {}),
    }))
  }
}
