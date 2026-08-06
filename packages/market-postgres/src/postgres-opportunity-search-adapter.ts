import type { Sql } from 'postgres'
import type {
  OpportunitySearchPort,
  RetrievalCriteria,
  CandidateOpportunity,
} from '@provena/core'

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
}
