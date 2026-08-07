import type { Sql } from 'postgres'

export interface UserDecisionRecord {
  opportunityId: string
  userId: string
  userDecision: string
  updatedAt: string
}

export class PostgresUserDecisionRepository {
  constructor(private readonly sql: Sql) {}

  async setDecision(
    opportunityId: string,
    decision: string,
    userId: string = 'valentin'
  ): Promise<void> {
    await this.sql`
      INSERT INTO user_opportunity_decisions (
        opportunity_id,
        user_id,
        user_decision,
        updated_at
      ) VALUES (
        ${opportunityId},
        ${userId},
        ${decision},
        NOW()
      )
      ON CONFLICT (opportunity_id, user_id) DO UPDATE SET
        user_decision = EXCLUDED.user_decision,
        updated_at = NOW()
    `
  }

  async getDecision(
    opportunityId: string,
    userId: string = 'valentin'
  ): Promise<string | null> {
    const rows = await this.sql<Array<{
      user_decision: string
    }>>`
      SELECT user_decision
      FROM user_opportunity_decisions
      WHERE opportunity_id = ${opportunityId} AND user_id = ${userId}
    `

    if (rows.length === 0) return null
    return rows[0]!.user_decision
  }
}
