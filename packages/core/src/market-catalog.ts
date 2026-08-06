// ── O2.2: Market Catalog — Global Domain Types ──────────────────────────────
//
// These types represent the shared market layer of Provena's architecture.
// Nothing here is user-specific. The user appears only at Assessment time.
//
// Ontology:
//
//   Posting_n ──► Opportunity ──► MarketModel
//
//   MarketModel × Profile × PreferenceSet ──► Assessment  (in opportunity.ts)
//
// Invariants encoded in the type system:
//
//   1. Opportunity ≠ OpportunityPosting
//      A posting is an observation. An opportunity is a canonical entity.
//
//   2. One posting belongs to at most one canonical opportunity.
//      OpportunityPosting.opportunityId is a required foreign key.
//
//   3. MarketModel is shared — it is not computed per user.
//      It is keyed by (opportunityId, marketKnowledgeVersion).
//      100k users share one MarketModel for "Stripe Staff Engineer @ k_market_17".
//
//   4. User identity enters only at UserOpportunityAssessment.
//      Assessment = f(Profile_v, PreferenceSet_v, MarketModel_{K_m}, Protocol_v)
//      All four versioned inputs are recorded for exact reproducibility.

import type { RoleFamily, RoleLevel, CompanyRef } from './preference-set.js'

// ── Branded ID types ─────────────────────────────────────────────────────────
//
// Nominal types prevent accidentally passing an OpportunityId where an
// OpportunityPostingId is expected, and vice versa. TypeScript's structural
// typing would otherwise allow it silently.

declare const __opportunityId: unique symbol
export type OpportunityId = string & { readonly [__opportunityId]: true }

declare const __opportunityPostingId: unique symbol
export type OpportunityPostingId = string & { readonly [__opportunityPostingId]: true }

export function makeOpportunityId(s: string): OpportunityId {
  return s as OpportunityId
}

export function makeOpportunityPostingId(s: string): OpportunityPostingId {
  return s as OpportunityPostingId
}

// ── SourceType ───────────────────────────────────────────────────────────────
//
// The system that produced the posting observation.
// 'url-fetch' is the O1 fallback; named ATS systems are preferred for
// reliable externalId extraction and cross-source deduplication.

export type SourceType =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workday'
  | 'url-fetch'
  | 'manual'

// ── Opportunity ──────────────────────────────────────────────────────────────
//
// The canonical global entity. Exists once regardless of how many postings
// or users reference it. Does NOT contain the raw JD text — that belongs to
// OpportunityPosting (the observation).
//
// normalizedTitle: lowercase, stripped of level words (e.g. "staff", "senior")
// and punctuation — used for cross-source deduplication heuristics.
//
// roleFamily / roleLevel: populated by the ingestion layer using
// parseRoleRequirement (already exists in opportunity.ts). Optional because
// parsing may fail for ambiguous or non-standard titles.

export interface Opportunity {
  readonly id: OpportunityId
  readonly company: CompanyRef

  readonly title: string
  /** Normalized for cross-source deduplication. Not for display. */
  readonly normalizedTitle: string

  /** Populated by ingestion from parseRoleRequirement; null when ambiguous. */
  readonly roleFamily?: RoleFamily
  readonly roleLevel?: RoleLevel
}

// ── OpportunityPosting ───────────────────────────────────────────────────────
//
// A source observation of an opportunity. Multiple postings can reference
// the same canonical Opportunity (cross-source deduplication).
//
// Identity invariant:
//   UNIQUE(sourceType, externalId) — intra-source deduplication is exact.
//   Cross-source merging (which posting → which opportunity) is a separate
//   concern, resolved conservatively: when in doubt, don't merge.
//
// active: false means the posting has disappeared from the source listing.
//   The posting is never deleted — user decisions (applied, dismissed) must
//   survive a position closing.
//
// rawDescription: the full JD text at ingest time. Stored on the posting,
//   not on the Opportunity, because different sources may have different
//   descriptions for the same canonical role.

export interface OpportunityPosting {
  readonly id: OpportunityPostingId

  /** Foreign key to the canonical Opportunity. Required — one-to-one at write time. */
  readonly opportunityId: OpportunityId

  readonly sourceType: SourceType
  readonly externalId: string
  readonly url: string

  readonly location?: string
  readonly publishedAt?: string

  /** ISO 8601 — when Provena first observed this posting */
  readonly firstSeenAt: string
  /** ISO 8601 — when Provena last confirmed this posting was still listed */
  readonly lastSeenAt: string

  /**
   * false when the posting has disappeared from the source listing.
   * Once inactive, only lastSeenAt and active change — content is immutable.
   */
  readonly active: boolean

  readonly rawDescription: string
}

// ── MarketModelRecord ────────────────────────────────────────────────────────
//
// The shared, versioned interpretation of an Opportunity.
// Computed once per (opportunity, marketKnowledgeVersion) pair.
// Shared by all users — personal identity never enters this layer.
//
// marketKnowledgeVersion: identifies the K_market snapshot used.
//   Format: semver string, e.g. "1.4.0".
//   Provena bumps this version when new MarketPatternDefinitions are promoted
//   (as in K12a: MLOPS_KNOWLEDGE promotion).
//
// recognitionCoverage: the proportion of market-bearing JD chunks that were
//   recognized by K_market. Mirrors MarketModel.recognitionCoverage.
//   Stored here so coverage can be queried without re-parsing the JD.
//
// recognizedAt: ISO 8601 — when this record was produced.

export interface MarketModelRecord {
  readonly opportunityId: OpportunityId
  readonly marketKnowledgeVersion: string

  /**
   * Monotonically increasing integer that determines ordering for findCurrent().
   * Higher = newer. Shared between Memory and PostgreSQL so both implement
   * findCurrent() identically: ORDER BY recognition_order DESC LIMIT 1.
   *
   * The version string is retained for human readability and traceability
   * (K12A experiment logs reference versions by string). The integer is
   * authoritative for ordering.
   *
   * Ingestion pipeline sets this. Convention: use Unix seconds at recognition
   * time, or a centrally managed sequence — as long as newer > older.
   */
  readonly recognitionOrder: number

  /** The full MarketModel produced by extractMarketRequirements (market.ts) */
  readonly marketModelJson: import('./market.js').MarketModel

  readonly recognitionCoverage: number
  readonly recognizedAt: string
}

// ── UserOpportunityDecision ──────────────────────────────────────────────────
//
// The user's explicit action on an opportunity.
// Separated from Assessment — a user can decide without a full assessment
// (e.g. dismiss based on title alone), and a full assessment can exist
// without a user decision (e.g. inbox items not yet reviewed).

export type DecisionStatus =
  | 'new'          // ingested, not yet surfaced to user
  | 'seen'         // surfaced in inbox, user has not acted
  | 'interested'   // user flagged as interesting
  | 'applied'      // user has applied externally
  | 'dismissed'    // user explicitly dismissed

export interface UserOpportunityDecision {
  /** FK to the Profile owner — maps to Profile.identity.person in local usage */
  readonly userId: string
  readonly opportunityId: OpportunityId
  readonly status: DecisionStatus
  readonly updatedAt: string
  readonly reason?: string
}

// ── UserOpportunityAssessment ────────────────────────────────────────────────
//
// The personalized assessment of a shared opportunity.
// This is the only type in the market catalog that is user-specific.
//
// Versioned on four axes for exact reproducibility:
//
//   Assessment = f(
//     Profile_{profileVersion},
//     PreferenceSet_{preferenceVersion},
//     MarketModel_{marketKnowledgeVersion},
//     Protocol_{protocolVersion}
//   )
//
// marketKnowledgeVersion: which K_market snapshot produced the MarketModel used.
// protocolVersion:        which version of K1–K6C ran the evaluation.
//                         NOT "knowledge about the candidate" — the protocol is
//                         the transformation engine, not a fact about the world.
// profileVersion:         which snapshot of the candidate's Profile was used.
// preferenceVersion:      which snapshot of PreferenceSet was used.
//
// evaluatedAt: ISO 8601 — when this assessment was produced.

export interface UserOpportunityAssessment {
  readonly userId: string
  readonly opportunityId: OpportunityId

  readonly marketKnowledgeVersion: string
  readonly protocolVersion: string
  readonly profileVersion: string
  readonly preferenceVersion: string

  /** The full OpportunityAssessment from opportunity.ts */
  readonly assessmentJson: import('./opportunity.js').OpportunityAssessment

  /** Denormalized for cheap sorting/filtering without deserializing assessmentJson */
  readonly professionalFitScore: number
  readonly personalFitScore: number
  readonly confidence: number
  readonly recommendation: import('./opportunity.js').Recommendation

  readonly evaluatedAt: string
}

// ── normalizeOpportunityTitle ────────────────────────────────────────────────
//
// Produces a normalizedTitle for deduplication heuristics.
// Strips level markers, punctuation, and whitespace variations.
// The result is stable across minor rephrasing of equivalent titles.
//
// Examples:
//   "Staff Software Engineer, Payments" → "software engineer payments"
//   "Senior Staff Software Engineer"     → "software engineer"
//   "Principal Engineer - Platform"      → "engineer platform"

const LEVEL_WORDS = new Set([
  'junior', 'mid', 'senior', 'lead', 'staff', 'principal',
  'director', 'vp', 'head', 'chief',
  // Roman numeral and ordinal suffixes often appended to seniority
  'ii', 'iii', 'iv', 'vi', 'vii', 'viii',
  'st', 'nd', 'rd', 'th',
])

export function normalizeOpportunityTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')        // punctuation → space
    .split(/\s+/)
    .filter(t => t.length > 1 && !LEVEL_WORDS.has(t))
    .join(' ')
    .trim()
}

// ── dedupeKey ────────────────────────────────────────────────────────────────
//
// Deterministic key for intra-source deduplication.
// UNIQUE(sourceType, externalId) identifies a posting within one source.
// Cross-source deduplication uses normalizedTitle + company domain heuristics
// and is handled separately — this function does NOT attempt that.

export function makePostingDedupeKey(sourceType: SourceType, externalId: string): string {
  return `${sourceType}:${externalId}`
}
