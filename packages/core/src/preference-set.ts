// ── O2.1: PreferenceSet ─────────────────────────────────────────────────────
//
// Represents what a person wants from the market. This type is intentionally
// decoupled from retrieval mechanics: it does not know about SQL, indexes, or
// search ports. Those concerns live in retrieval.ts.
//
// Vocabulary: reuses the same family/level literals already established in
// opportunity.ts (RoleRequirement), ensuring a single source of truth for
// role classification across the pipeline.

// ── Role classification ─────────────────────────────────────────────────────

export type RoleFamily =
  | 'software-engineering'
  | 'ai-engineering'
  | 'project-management'
  | 'executive-management'
  | 'academia'

export type RoleLevel =
  | 'junior'
  | 'mid'
  | 'senior'
  | 'staff'
  | 'principal'
  | 'executive'

// ── Work mode ───────────────────────────────────────────────────────────────

export type WorkMode = 'remote' | 'hybrid' | 'onsite'

// 'required': necessary for acceptance of an offer.
// 'preferred': increases desirability but does not veto.
// Note: required ≠ hard retrieval filter. See retrieval.ts for that mapping.
export type PreferenceStrength = 'required' | 'preferred'

export interface WorkModeTarget {
  readonly mode: WorkMode
  readonly strength: PreferenceStrength
}

// ── Geography ───────────────────────────────────────────────────────────────

export interface GeographyTarget {
  /** e.g. 'Europe', 'North America' */
  readonly continent?: string
  /** ISO 3166-1 alpha-2: 'ES', 'DE', 'FR' */
  readonly country?: string
  /** e.g. 'Barcelona', 'Berlin' */
  readonly city?: string
}

// ── Language ────────────────────────────────────────────────────────────────

export interface LanguageTarget {
  /** ISO 639-1: 'en', 'es', 'fr' */
  readonly code: string
  readonly proficiency: 'native' | 'fluent' | 'working'
}

// ── Compensation ────────────────────────────────────────────────────────────

export interface CompensationTarget {
  /** Hard floor — below this is an eligibility violation in K5B */
  readonly minimum: number
  /** Soft ceiling — above this earns 'preferred' status in K5B scoring */
  readonly preferred?: number
  /** ISO 4217: 'EUR', 'USD' */
  readonly currency: 'EUR' | 'USD'
}

// ── Company reference ───────────────────────────────────────────────────────

export interface CompanyRef {
  /** Canonical name used for display and fuzzy matching */
  readonly name: string
  /** Primary web domain, used for reliable deduplication */
  readonly domain?: string
}

// ── Location constraint ─────────────────────────────────────────────────────

export interface LocationConstraint {
  /** ISO 3166-1 alpha-2 */
  readonly country?: string
  readonly city?: string
}

// ── Constraints ─────────────────────────────────────────────────────────────
//
// Separating targets (what you want) from constraints (what you exclude)
// is architecturally important: excluded dimensions can become reliable
// hard SQL filters in O2.4+, while targets are candidate-retrieval hints.

export interface PreferenceConstraints {
  /** Companies to exclude from retrieval entirely */
  readonly excludedCompanies?: readonly CompanyRef[]

  /** Role families that are explicitly incompatible */
  readonly excludedRoleFamilies?: readonly RoleFamily[]

  /** Locations that are explicitly excluded */
  readonly excludedLocations?: readonly LocationConstraint[]

  /** Visa sponsorship required to be legally eligible */
  readonly visaSponsorshipRequired?: boolean

  /**
   * O2 migration only — free-text avoid terms from legacy Preferences.avoid.
   * Consumed by compat.ts adapter for K5B until K5B reads PreferenceSet directly.
   * @deprecated Replace with structured excludedCompanies / excludedRoleFamilies.
   */
  readonly legacyAvoidTerms?: readonly string[]
}

// ── PreferenceSet ───────────────────────────────────────────────────────────

export interface PreferenceSet {
  /** What the person is actively looking for */
  readonly targets: {
    readonly roleFamilies?: readonly RoleFamily[]
    readonly roleLevels?: readonly RoleLevel[]
    readonly geographies?: readonly GeographyTarget[]
    readonly workModes?: readonly WorkModeTarget[]
    readonly languages?: readonly LanguageTarget[]
    readonly compensation?: CompensationTarget
  }

  /** Hard and soft limits on what the person will accept */
  readonly constraints: PreferenceConstraints
}
