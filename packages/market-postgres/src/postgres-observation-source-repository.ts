import type { Sql } from 'postgres'

export interface ObservationSourceRecord {
  id: string
  profileId: string
  name: string
  provider: string
  url: string
  status: string
  jobsObserved: number
  createdAt: string
  updatedAt: string
  lastSyncedAt: string | null
}

export class PostgresObservationSourceRepository {
  constructor(private readonly sql: Sql) {}

  async list(profileId = 'valentin'): Promise<ObservationSourceRecord[]> {
    const rows = await this.sql<Array<{
      id: string
      profile_id: string
      name: string
      provider: string
      url: string
      status: string
      jobs_observed: number
      created_at: string
      updated_at: string
      last_synced_at: string | null
    }>>`
      SELECT id, profile_id, name, provider, url, status, jobs_observed, created_at, updated_at, last_synced_at
      FROM observation_sources
      WHERE profile_id = ${profileId}
      ORDER BY created_at ASC
    `
    return rows.map(r => ({
      id: r.id,
      profileId: r.profile_id,
      name: r.name,
      provider: r.provider,
      url: r.url,
      status: r.status,
      jobsObserved: r.jobs_observed,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      lastSyncedAt: r.last_synced_at,
    }))
  }

  async upsert(source: {
    id: string
    profileId?: string
    name: string
    provider: string
    url: string
    status?: string
    jobsObserved?: number
  }): Promise<void> {
    const profileId = source.profileId || 'valentin'
    const status = source.status || 'Watching'
    const jobsObserved = source.jobsObserved || 0
    await this.sql`
      INSERT INTO observation_sources (id, profile_id, name, provider, url, status, jobs_observed, updated_at, last_synced_at)
      VALUES (${source.id}, ${profileId}, ${source.name}, ${source.provider}, ${source.url}, ${status}, ${jobsObserved}, NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        provider = EXCLUDED.provider,
        url = EXCLUDED.url,
        status = EXCLUDED.status,
        jobs_observed = EXCLUDED.jobs_observed,
        updated_at = NOW(),
        last_synced_at = NOW()
    `
  }

  async delete(id: string, profileId = 'valentin'): Promise<void> {
    await this.sql`
      DELETE FROM observation_sources
      WHERE id = ${id} AND profile_id = ${profileId}
    `
  }
}
