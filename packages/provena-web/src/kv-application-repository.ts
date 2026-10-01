import type { Application, ApplicationRepository } from '@provena/core'
import { parseApplication } from '@provena/core'

const KV_KEY = 'applications'

export class KvApplicationRepository implements ApplicationRepository {
  constructor(private readonly kv: KVNamespace) {}

  private async readAll(): Promise<Application[]> {
    if (!this.kv) return []
    try {
      const raw = await this.kv.get(KV_KEY, 'json')
      const list = (raw as { applications: unknown[] } | null)?.applications ?? []
      return list.map((a) => parseApplication(a))
    } catch (e) {
      console.error('[KvApplicationRepository.readAll] KV read error:', e)
      return []
    }
  }

  async list(): Promise<readonly Application[]> {
    return this.readAll()
  }

  // ponytail: read-modify-write on one KV blob; concurrent saves can drop a write. Single-user today; add versioned CAS if that changes.
  async save(application: Application): Promise<void> {
    if (!this.kv) return
    const all = await this.readAll()
    const index = all.findIndex((a) => a.id === application.id)
    if (index >= 0) all[index] = application
    else all.push(application)
    await this.kv.put(KV_KEY, JSON.stringify({ applications: all }))
  }

  async findByOpportunityId(opportunityId: string): Promise<Application | undefined> {
    return (await this.readAll()).find((a) => a.opportunityId === opportunityId)
  }
}
