import type { Sql } from 'postgres'
import type {
  MarketModelStore,
  MarketModelRecord,
  OpportunityId,
} from '@provena/core'
import { makeOpportunityId, MarketModelVersionConflict } from '@provena/core'

export class PostgresMarketModelStore implements MarketModelStore {
  constructor(private readonly sql: Sql) {}

  private mapRow(row: any): MarketModelRecord {
    return {
      opportunityId: makeOpportunityId(row.opportunity_id),
      marketKnowledgeVersion: row.market_knowledge_version,
      recognitionOrder: row.recognition_order,
      marketModelJson: row.market_model_json,
      recognitionCoverage: row.recognition_coverage,
      recognizedAt: new Date(row.recognized_at).toISOString(),
    }
  }

  async findCurrent(opportunityId: OpportunityId): Promise<MarketModelRecord | null> {
    const rows = await this.sql`
      SELECT opportunity_id, market_knowledge_version, recognition_order, market_model_json, recognition_coverage, recognized_at
      FROM market_models
      WHERE opportunity_id = ${opportunityId}
      ORDER BY recognition_order DESC
      LIMIT 1
    `
    if (rows.length === 0) return null
    return this.mapRow(rows[0])
  }

  async findByVersion(
    opportunityId: OpportunityId,
    marketKnowledgeVersion: string,
  ): Promise<MarketModelRecord | null> {
    const rows = await this.sql`
      SELECT opportunity_id, market_knowledge_version, recognition_order, market_model_json, recognition_coverage, recognized_at
      FROM market_models
      WHERE opportunity_id = ${opportunityId} AND market_knowledge_version = ${marketKnowledgeVersion}
    `
    if (rows.length === 0) return null
    return this.mapRow(rows[0])
  }

  async listByOpportunity(opportunityId: OpportunityId): Promise<readonly MarketModelRecord[]> {
    const rows = await this.sql`
      SELECT opportunity_id, market_knowledge_version, recognition_order, market_model_json, recognition_coverage, recognized_at
      FROM market_models
      WHERE opportunity_id = ${opportunityId}
      ORDER BY recognition_order DESC
    `
    return rows.map(r => this.mapRow(r))
  }

  async save(record: MarketModelRecord): Promise<void> {
    try {
      await this.sql`
        INSERT INTO market_models (
          opportunity_id, market_knowledge_version, recognition_order, market_model_json, recognition_coverage, recognized_at
        ) VALUES (
          ${record.opportunityId},
          ${record.marketKnowledgeVersion},
          ${record.recognitionOrder},
          ${this.sql.json(record.marketModelJson as any)},
          ${record.recognitionCoverage},
          ${record.recognizedAt}
        )
      `
    } catch (err: any) {
      if (err?.code === '23505') { // Postgres UNIQUE violation code
        throw new MarketModelVersionConflict(record.opportunityId, record.marketKnowledgeVersion)
      }
      throw err
    }
  }
}
