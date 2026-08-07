import type { OpportunityRepository, OpportunityUserDecision, StoredOpportunity } from '@provena/core'

const KV_KEY = 'opportunities_memory'

export class KvOpportunityRepository implements OpportunityRepository {
  constructor(private readonly kv: KVNamespace) {}

  private async readAll(): Promise<StoredOpportunity[]> {
    if (!this.kv) return []
    try {
      const raw = await this.kv.get(KV_KEY, 'json')
      return (raw as { opportunities: StoredOpportunity[] } | null)?.opportunities ?? []
    } catch (e) {
      console.error('[KvOpportunityRepository.readAll] KV read error:', e)
      return []
    }
  }

  private async writeAll(opportunities: StoredOpportunity[]): Promise<void> {
    if (!this.kv) return
    // Strip heavy HTML description text to keep KV blob lightweight (~50KB instead of 20MB)
    // so reading/parsing JSON in Cloudflare Workers never hits RAM or CPU limits.
    const lightweight = opportunities.map(o => {
      const { description, ...lightRaw } = (o.raw || {}) as any
      const evalCopy = o.evaluation ? ({ ...o.evaluation } as any) : undefined
      if (evalCopy && evalCopy.rawOpportunity) {
        const { description: _, ...lightRawOpp } = evalCopy.rawOpportunity
        evalCopy.rawOpportunity = lightRawOpp
      }
      return {
        ...o,
        raw: lightRaw,
        evaluation: evalCopy,
      } as StoredOpportunity
    })
    await this.kv.put(KV_KEY, JSON.stringify({ opportunities: lightweight }))
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
