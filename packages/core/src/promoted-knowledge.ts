import type { MarketKnowledge } from './market-knowledge.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'
import { FINTECH_PLATFORM_KNOWLEDGE } from './domain-knowledge.js'

// The single, code-consumable source of "what is promoted" for
// Operational Knowledge v1 (see docs/architecture/operational-knowledge-v1.md).
// Update this array in the same PR as any future promotion-record card --
// production code must never hardcode a pack list independently of it (see
// docs/architecture/governance-runtime-knowledge-contract.md).
export const PROMOTED_OPERATIONAL_KNOWLEDGE: readonly MarketKnowledge[] = [
  DEFAULT_SOFTWARE_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
]
