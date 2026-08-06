import type { Sql } from 'postgres'
import type {
  MarketOpportunityRepository,
  OpportunityQuery,
  Opportunity,
  OpportunityId,
  RoleFamily,
  RoleLevel,
} from '@provena/core'
import { makeOpportunityId } from '@provena/core'

export class PostgresMarketOpportunityRepository implements MarketOpportunityRepository {
  constructor(private readonly sql: Sql) {}

  async findById(id: OpportunityId): Promise<Opportunity | null> {
    const rows = await this.sql<Array<{
      id: string
      company_name: string
      company_domain: string | null
      title: string
      normalized_title: string
      role_family: string | null
      role_level: string | null
    }>>`
      SELECT id, company_name, company_domain, title, normalized_title, role_family, role_level
      FROM opportunities
      WHERE id = ${id}
    `

    if (rows.length === 0) return null
    const row = rows[0]!

    return {
      id: makeOpportunityId(row.id),
      company: {
        name: row.company_name,
        ...(row.company_domain ? { domain: row.company_domain } : {}),
      },
      title: row.title,
      normalizedTitle: row.normalized_title,
      ...(row.role_family ? { roleFamily: row.role_family as RoleFamily } : {}),
      ...(row.role_level ? { roleLevel: row.role_level as RoleLevel } : {}),
    }
  }

  async list(query?: OpportunityQuery): Promise<readonly Opportunity[]> {
    let rows
    if (query?.roleFamily && query?.roleLevel) {
      rows = await this.sql`
        SELECT id, company_name, company_domain, title, normalized_title, role_family, role_level
        FROM opportunities
        WHERE role_family = ${query.roleFamily} AND role_level = ${query.roleLevel}
      `
    } else if (query?.roleFamily) {
      rows = await this.sql`
        SELECT id, company_name, company_domain, title, normalized_title, role_family, role_level
        FROM opportunities
        WHERE role_family = ${query.roleFamily}
      `
    } else if (query?.roleLevel) {
      rows = await this.sql`
        SELECT id, company_name, company_domain, title, normalized_title, role_family, role_level
        FROM opportunities
        WHERE role_level = ${query.roleLevel}
      `
    } else {
      rows = await this.sql`
        SELECT id, company_name, company_domain, title, normalized_title, role_family, role_level
        FROM opportunities
      `
    }

    return rows.map(row => ({
      id: makeOpportunityId(row.id),
      company: {
        name: row.company_name,
        ...(row.company_domain ? { domain: row.company_domain } : {}),
      },
      title: row.title,
      normalizedTitle: row.normalized_title,
      ...(row.role_family ? { roleFamily: row.role_family as RoleFamily } : {}),
      ...(row.role_level ? { roleLevel: row.role_level as RoleLevel } : {}),
    }))
  }

  async save(opportunity: Opportunity): Promise<void> {
    await this.sql`
      INSERT INTO opportunities (
        id, company_name, company_domain, title, normalized_title, role_family, role_level
      ) VALUES (
        ${opportunity.id},
        ${opportunity.company.name},
        ${opportunity.company.domain ?? null},
        ${opportunity.title},
        ${opportunity.normalizedTitle},
        ${opportunity.roleFamily ?? null},
        ${opportunity.roleLevel ?? null}
      )
      ON CONFLICT (id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        company_domain = EXCLUDED.company_domain,
        title = EXCLUDED.title,
        normalized_title = EXCLUDED.normalized_title,
        role_family = EXCLUDED.role_family,
        role_level = EXCLUDED.role_level,
        updated_at = NOW()
    `
  }
}
