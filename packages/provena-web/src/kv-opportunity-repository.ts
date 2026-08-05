import type { OpportunityRepository, OpportunityUserDecision, StoredOpportunity } from '@provena/core'

const KV_KEY = 'opportunities_memory'

// ponytail: single JSON blob under one KV key (same storage already deployed for O1.2),
// not per-id keys + an index — at this scale (a few hundred opportunities at most) a blob
// well under KV's 25MB value limit is simpler and has no index-consistency failure mode.
// Split into `opportunity:{id}` keys + a listing index if that stops being true.
export class KvOpportunityRepository implements OpportunityRepository {
  constructor(private readonly kv: KVNamespace) {}

  private async readAll(): Promise<StoredOpportunity[]> {
    const raw = await this.kv.get(KV_KEY, 'json')
    return (raw as { opportunities: StoredOpportunity[] } | null)?.opportunities ?? []
  }

  private async writeAll(opportunities: StoredOpportunity[]): Promise<void> {
    await this.kv.put(KV_KEY, JSON.stringify({ opportunities }))
  }

  async findById(id: string): Promise<StoredOpportunity | null> {
    const all = await this.readAll()
    return all.find(o => o.id === id) ?? null
  }

  async findByDedupeKey(key: string): Promise<StoredOpportunity | null> {
    return this.findById(key)
  }

  async list(): Promise<StoredOpportunity[]> {
    return this.readAll()
  }

  async save(opportunity: StoredOpportunity): Promise<void> {
    const all = await this.readAll()
    const index = all.findIndex(o => o.id === opportunity.id)
    if (index >= 0) all[index] = opportunity
    else all.unshift(opportunity)
    await this.writeAll(all)
  }

  async saveMany(opportunities: readonly StoredOpportunity[]): Promise<void> {
    await this.writeAll([...opportunities])
  }

  async updateDecision(id: string, decision: OpportunityUserDecision): Promise<void> {
    const all = await this.readAll()
    const index = all.findIndex(o => o.id === id)
    if (index < 0) return
    all[index] = { ...all[index]!, userDecision: decision, updatedAt: new Date().toISOString() }
    await this.writeAll(all)
  }
}
