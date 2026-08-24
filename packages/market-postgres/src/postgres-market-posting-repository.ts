import type { Sql } from 'postgres'
import type {
  MarketPostingRepository,
  OpportunityPosting,
  OpportunityPostingId,
  OpportunityId,
  PostingStatus,
  SourceType,
} from '@provena/core'
import { makeOpportunityPostingId, makeOpportunityId } from '@provena/core'

export class PostgresMarketPostingRepository implements MarketPostingRepository {
  constructor(private readonly sql: Sql) {}

  private mapRow(row: any): OpportunityPosting {
    return {
      id: makeOpportunityPostingId(row.id),
      opportunityId: makeOpportunityId(row.opportunity_id),
      sourceType: row.source_type as SourceType,
      externalId: row.external_id,
      url: row.url,
      ...(row.location ? { location: row.location } : {}),
      ...(row.published_at ? { publishedAt: new Date(row.published_at).toISOString() } : {}),
      firstSeenAt: new Date(row.first_seen_at).toISOString(),
      lastSeenAt: new Date(row.last_seen_at).toISOString(),
      active: row.status === 'ACTIVE' || row.status === 'NOT_SEEN',
      status: row.status as PostingStatus,
      rawDescription: row.raw_description,
    }
  }

  async findById(id: OpportunityPostingId): Promise<OpportunityPosting | null> {
    const rows = await this.sql`
      SELECT id, opportunity_id, source_type, external_id, url, location, published_at, first_seen_at, last_seen_at, status, raw_description
      FROM opportunity_postings
      WHERE id = ${id}
    `
    if (rows.length === 0) return null
    return this.mapRow(rows[0])
  }

  async findBySource(sourceType: SourceType, externalId: string): Promise<OpportunityPosting | null> {
    const rows = await this.sql`
      SELECT id, opportunity_id, source_type, external_id, url, location, published_at, first_seen_at, last_seen_at, status, raw_description
      FROM opportunity_postings
      WHERE source_type = ${sourceType} AND external_id = ${externalId}
    `
    if (rows.length === 0) return null
    return this.mapRow(rows[0])
  }

  async listByOpportunity(opportunityId: OpportunityId): Promise<readonly OpportunityPosting[]> {
    const rows = await this.sql`
      SELECT id, opportunity_id, source_type, external_id, url, location, published_at, first_seen_at, last_seen_at, status, raw_description
      FROM opportunity_postings
      WHERE opportunity_id = ${opportunityId}
    `
    return rows.map(r => this.mapRow(r))
  }

  async save(posting: OpportunityPosting): Promise<void> {
    const status: PostingStatus = posting.status ?? (posting.active ? 'ACTIVE' : 'INACTIVE')
    await this.sql`
      INSERT INTO opportunity_postings (
        id, opportunity_id, source_type, external_id, url, location, published_at, first_seen_at, last_seen_at, status, raw_description
      ) VALUES (
        ${posting.id},
        ${posting.opportunityId},
        ${posting.sourceType},
        ${posting.externalId},
        ${posting.url},
        ${posting.location ?? null},
        ${posting.publishedAt ?? null},
        ${posting.firstSeenAt},
        ${posting.lastSeenAt},
        ${status},
        ${posting.rawDescription}
      )
      ON CONFLICT (id) DO UPDATE SET
        opportunity_id = EXCLUDED.opportunity_id,
        source_type = EXCLUDED.source_type,
        external_id = EXCLUDED.external_id,
        url = EXCLUDED.url,
        location = EXCLUDED.location,
        published_at = EXCLUDED.published_at,
        first_seen_at = EXCLUDED.first_seen_at,
        last_seen_at = EXCLUDED.last_seen_at,
        status = EXCLUDED.status,
        raw_description = EXCLUDED.raw_description,
        updated_at = NOW()
    `
  }

  async markInactive(id: OpportunityPostingId, lastSeenAt: string): Promise<void> {
    await this.sql`
      UPDATE opportunity_postings
      SET status = 'INACTIVE',
          last_seen_at = ${lastSeenAt},
          updated_at = NOW()
      WHERE id = ${id}
    `
  }
}
