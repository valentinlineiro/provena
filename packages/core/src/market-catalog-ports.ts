// ── O2.3: Market Catalog Persistence Ports ───────────────────────────────────
//
// Defines the persistence boundary for the Market Catalog domain (O2.2).
// Core defines the ports; infrastructure adapters live outside core.
//
// Principle:    Domain Model ⊥ Persistence Technology
//
// These interfaces are the full contract that O2.4 (PostgreSQL) must satisfy.
// MemoryMarket* classes are the reference implementations: tested here, and
// used by O2.4 contract tests to verify PostgreSQL against the same suite.
//
// Scope of O2.3:
//   ✓ Ports (interfaces)
//   ✓ Query types
//   ✓ Memory reference implementations
//   ✓ Contract test helper (runMarketRepositoryContractTests)
//   ✗ PostgreSQL  — O2.4
//   ✗ Fuzzy deduplication  — O2.5
//   ✗ PreferenceSet retrieval  — O2.5
//   ✗ User assessments  — O2.7
//   ✗ Migration of O1 StoredOpportunity  — separate

import type {
  Opportunity,
  OpportunityId,
  OpportunityPosting,
  OpportunityPostingId,
  MarketModelRecord,
  SourceType,
} from './market-catalog.js'
import type { RoleFamily, RoleLevel } from './preference-set.js'

// ── Query types ───────────────────────────────────────────────────────────────
//
// Intentionally narrow for O2.3. Pagination, sorting, and full retrieval
// criteria (from RetrievalCriteria in retrieval.ts) are O2.5 concerns.

export interface OpportunityQuery {
  readonly roleFamily?: RoleFamily
  readonly roleLevel?: RoleLevel
  /** When true, only return opportunities with at least one active posting. */
  readonly hasActivePosting?: boolean
}

// ── MarketOpportunityRepository ───────────────────────────────────────────────
//
// Port for canonical Opportunity entities.
//
// save() is upsert semantics: insert if not present, replace if present.
// The caller is responsible for identity — two calls with the same id
// produce exactly one stored record (idempotent ingest).

export interface MarketOpportunityRepository {
  findById(id: OpportunityId): Promise<Opportunity | null>
  list(query?: OpportunityQuery): Promise<readonly Opportunity[]>
  save(opportunity: Opportunity): Promise<void>
}

// ── MarketPostingRepository ───────────────────────────────────────────────────
//
// Port for OpportunityPosting observations.
//
// findBySource() is the intra-source deduplication query:
//   UNIQUE(sourceType, externalId) within one source is exact.
//
// listByOpportunity() enables the cross-source view:
//   "all postings that map to this canonical opportunity"
//
// markInactive() is NOT delete — postings are immutable once written except
// for the active flag and lastSeenAt. A user decision on a closed posting
// must survive.

export interface MarketPostingRepository {
  findById(id: OpportunityPostingId): Promise<OpportunityPosting | null>
  findBySource(sourceType: SourceType, externalId: string): Promise<OpportunityPosting | null>
  listByOpportunity(opportunityId: OpportunityId): Promise<readonly OpportunityPosting[]>
  save(posting: OpportunityPosting): Promise<void>
  /**
   * Mark a posting as inactive without deleting it.
   * Updates active=false and lastSeenAt on the stored record.
   */
  markInactive(id: OpportunityPostingId, lastSeenAt: string): Promise<void>
}

// ── MarketModelStore ──────────────────────────────────────────────────────────
//
// Port for versioned MarketModelRecords.
//
// MarketModelRecord is append-only / immutable per (opportunityId, version):
// when K_market evolves, new records are added — old ones are never overwritten.
//
//   Opportunity #123
//     ├── MarketModel(K_market=v15)   ← preserved
//     ├── MarketModel(K_market=v16)   ← preserved
//     └── MarketModel(K_market=v17)   ← current
//
// This enables:
//   - Measuring ΔK_market effect on real market data (as demonstrated in K12A)
//   - Re-evaluating assessments under a new K_market without losing history
//   - Exact reproducibility: any past assessment can reference its MarketModel
//
// save() throws if (opportunityId, marketKnowledgeVersion) already exists.
// Callers must check findByVersion() before saving if they need idempotency.
//
// findCurrent() returns the record with the lexicographically highest
// marketKnowledgeVersion (semver ordering). Adapters MUST sort correctly.

export interface MarketModelStore {
  findCurrent(opportunityId: OpportunityId): Promise<MarketModelRecord | null>
  findByVersion(
    opportunityId: OpportunityId,
    marketKnowledgeVersion: string,
  ): Promise<MarketModelRecord | null>
  listByOpportunity(opportunityId: OpportunityId): Promise<readonly MarketModelRecord[]>
  /**
   * Append a new MarketModelRecord.
   * @throws {MarketModelVersionConflict} if (opportunityId, marketKnowledgeVersion) already exists.
   */
  save(record: MarketModelRecord): Promise<void>
}

// ── MarketModelVersionConflict ────────────────────────────────────────────────

export class MarketModelVersionConflict extends Error {
  constructor(
    readonly opportunityId: OpportunityId,
    readonly marketKnowledgeVersion: string,
  ) {
    super(
      `MarketModelRecord already exists for opportunity "${opportunityId}" at version "${marketKnowledgeVersion}". ` +
      `MarketModelStore is append-only: each (opportunityId, version) pair is immutable once written.`,
    )
    this.name = 'MarketModelVersionConflict'
  }
}

// ── Memory reference implementations ─────────────────────────────────────────
//
// These are the canonical correct implementations of the three ports.
// They are used:
//   1. In O2.3 tests to verify the contracts hold.
//   2. As the reference suite for O2.4: PostgreSQL implementations must pass
//      runMarketRepositoryContractTests() with identical results.
//   3. In test fixtures across the codebase (no I/O overhead, deterministic).

export class MemoryMarketOpportunityRepository implements MarketOpportunityRepository {
  private readonly byId = new Map<OpportunityId, Opportunity>()

  async findById(id: OpportunityId): Promise<Opportunity | null> {
    return this.byId.get(id) ?? null
  }

  async list(query?: OpportunityQuery): Promise<readonly Opportunity[]> {
    let results = [...this.byId.values()]
    if (query?.roleFamily !== undefined) {
      results = results.filter(o => o.roleFamily === query.roleFamily)
    }
    if (query?.roleLevel !== undefined) {
      results = results.filter(o => o.roleLevel === query.roleLevel)
    }
    // hasActivePosting is not evaluated here — the Memory implementation
    // has no access to the posting store. O2.4 resolves this via a join.
    // Callers that need hasActivePosting filtering should use a coordinating
    // service layer, not the repository directly.
    return results
  }

  async save(opportunity: Opportunity): Promise<void> {
    this.byId.set(opportunity.id, opportunity)
  }
}

export class MemoryMarketPostingRepository implements MarketPostingRepository {
  private readonly byId = new Map<OpportunityPostingId, OpportunityPosting>()

  async findById(id: OpportunityPostingId): Promise<OpportunityPosting | null> {
    return this.byId.get(id) ?? null
  }

  async findBySource(sourceType: SourceType, externalId: string): Promise<OpportunityPosting | null> {
    for (const posting of this.byId.values()) {
      if (posting.sourceType === sourceType && posting.externalId === externalId) {
        return posting
      }
    }
    return null
  }

  async listByOpportunity(opportunityId: OpportunityId): Promise<readonly OpportunityPosting[]> {
    return [...this.byId.values()].filter(p => p.opportunityId === opportunityId)
  }

  async save(posting: OpportunityPosting): Promise<void> {
    this.byId.set(posting.id, posting)
  }

  async markInactive(id: OpportunityPostingId, lastSeenAt: string): Promise<void> {
    const existing = this.byId.get(id)
    if (!existing) return
    this.byId.set(id, { ...existing, active: false, lastSeenAt })
  }
}

export class MemoryMarketModelStore implements MarketModelStore {
  // Keyed by `${opportunityId}@${marketKnowledgeVersion}` — composite key
  private readonly records = new Map<string, MarketModelRecord>()

  private key(opportunityId: OpportunityId, version: string): string {
    return `${opportunityId}@${version}`
  }

  async findCurrent(opportunityId: OpportunityId): Promise<MarketModelRecord | null> {
    const forOpportunity = [...this.records.values()]
      .filter(r => r.opportunityId === opportunityId)
    if (forOpportunity.length === 0) return null
    // recognitionOrder is the authoritative ordering field — higher = newer.
    // Both Memory and PostgreSQL use the same semantics (ORDER BY recognition_order DESC).
    return forOpportunity.sort((a, b) => b.recognitionOrder - a.recognitionOrder)[0]!
  }

  async findByVersion(
    opportunityId: OpportunityId,
    marketKnowledgeVersion: string,
  ): Promise<MarketModelRecord | null> {
    return this.records.get(this.key(opportunityId, marketKnowledgeVersion)) ?? null
  }

  async listByOpportunity(opportunityId: OpportunityId): Promise<readonly MarketModelRecord[]> {
    return [...this.records.values()].filter(r => r.opportunityId === opportunityId)
  }

  async save(record: MarketModelRecord): Promise<void> {
    const k = this.key(record.opportunityId, record.marketKnowledgeVersion)
    if (this.records.has(k)) {
      throw new MarketModelVersionConflict(record.opportunityId, record.marketKnowledgeVersion)
    }
    this.records.set(k, record)
  }
}


