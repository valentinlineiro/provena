// ── O2.1: Retrieval Port & Policy ───────────────────────────────────────────
//
// This module defines the retrieval abstraction layer. Core defines the port;
// adapters (PostgresOpportunitySearchAdapter, etc.) live outside core.
//
// Principle: Retrieval may produce false positives; it must not produce
// false negatives due to missing information.
//
//   Retrieval(o) = false  only when there is sufficient structured evidence
//   to assert the opportunity is outside the searched space.
//
//   UNKNOWN → pass through to K1–K6C.
//
// This mirrors the ABSTAIN discipline already present in opportunity.ts:
// absence of observation is not silently converted to negative evidence.

import type { PreferenceSet, RoleFamily, RoleLevel, WorkMode } from './preference-set.js'

// ── RetrievalTreatment ──────────────────────────────────────────────────────
//
// Encodes how a preference dimension is used during retrieval.
// The mapping from PreferenceStrength to RetrievalTreatment is NOT automatic:
// it depends on whether the dimension is reliably observable in market data.
//
//   hard-filter:       exclude if data contradicts (safe because reliably observed)
//                      e.g. excludedCompanies, excludedRoleFamilies
//   candidate-filter:  include if data matches OR if field is unknown/absent
//                      e.g. roleFamilies, roleLevels, workModes
//                      SQL: WHERE x IN (...) OR x IS NULL
//   ranking-only:      not used in retrieval at all — passed downstream to K5B

export type RetrievalTreatment = 'hard-filter' | 'candidate-filter' | 'ranking-only'

// ── CandidateOpportunity ────────────────────────────────────────────────────
//
// Minimal shape returned by the search port. The full JD text is included
// so K1–K6C can operate without a second round-trip.

export interface CandidateOpportunity {
  readonly id: string
  readonly externalId: string
  readonly title: string
  readonly companyName: string
  readonly rawDescription: string
  readonly url?: string
  readonly publishedAt?: string
}

// ── RetrievalCriteria ───────────────────────────────────────────────────────
//
// Produced by RetrievalPolicy from a PreferenceSet.
// The field grouping makes the treatment of each dimension explicit:
//
//   hardExclusions.*       → hard-filter treatment
//   candidateFilters.*     → candidate-filter treatment (include unknowns)
//
// This separation maps directly to future SQL:
//   hardExclusions  → WHERE NOT (company IN (...))
//   candidateFilters → WHERE (role_family IN (...) OR role_family IS NULL)

export interface RetrievalCriteria {
  /**
   * Hard exclusions — reliable, structured facts.
   * Opportunities matching any of these are excluded regardless of unknowns.
   */
  readonly hardExclusions: {
    readonly companyNames?: readonly string[]
    readonly companyDomains?: readonly string[]
    readonly roleFamilies?: readonly RoleFamily[]
  }

  /**
   * Candidate filters — include opportunities that match OR whose value is absent.
   * Required preferences whose observability is unreliable use candidate-filter,
   * not hard-filter, to prevent false negatives.
   */
  readonly candidateFilters: {
    readonly roleFamilies?: readonly RoleFamily[]
    readonly roleLevels?: readonly RoleLevel[]
    readonly workModes?: readonly WorkMode[]
    readonly countryCodes?: readonly string[]
  }

  readonly activeOnly: boolean

  /**
   * Upper bound on results returned to the evaluation pipeline.
   * Retrieval is intentionally broad; K1–K6C narrows the set further.
   * Default: 500 (chosen conservatively; tune after observing real market data).
   */
  readonly limit: number
}

// ── OpportunitySearchPort ───────────────────────────────────────────────────
//
// Defined in core; implemented by adapters outside core.
// PostgresOpportunitySearchAdapter will live in packages/market/.

export interface OpportunitySearchPort {
  search(criteria: RetrievalCriteria): Promise<readonly CandidateOpportunity[]>
}

// ── RetrievalPolicy ─────────────────────────────────────────────────────────
//
// Pure function: PreferenceSet → RetrievalCriteria.
// No I/O, no storage. Independently testable.

export interface RetrievalPolicy {
  toRetrievalCriteria(preferences: PreferenceSet): RetrievalCriteria
}

// ── DirectRetrievalPolicy ───────────────────────────────────────────────────
//
// Default implementation for O2.1.
//
// Mapping rules:
//   excludedCompanies  → hard-filter (name + domain; reliable identity)
//   excludedRoleFamilies → hard-filter (structured enum; reliable)
//   targets.roleFamilies → candidate-filter (include unknowns — JD may omit)
//   targets.roleLevels   → candidate-filter (include unknowns)
//   targets.workModes with strength='required' → candidate-filter (NOT hard)
//     Rationale: many JDs don't declare work mode; required != reliably observed.
//   targets.workModes with strength='preferred' → ranking-only (not in criteria)
//   targets.geographies → candidate-filter (country codes extracted from targets)
//
// legacyAvoidTerms: not translated to RetrievalCriteria.
// They are consumed by compat.ts for K5B; retrieval doesn't use free-text terms.

export class DirectRetrievalPolicy implements RetrievalPolicy {
  toRetrievalCriteria(preferences: PreferenceSet): RetrievalCriteria {
    const { targets, constraints } = preferences

    // Hard exclusions — only structurally reliable dimensions
    const excludedCompanyNames = constraints.excludedCompanies
      ?.map(c => c.name)
      .filter(Boolean)
    const excludedCompanyDomains = constraints.excludedCompanies
      ?.map(c => c.domain)
      .filter((d): d is string => d !== undefined)

    // Candidate filters — include unknowns (UNKNOWN → pass through)
    // Only workModes with strength='required' enter candidate filters;
    // 'preferred' modes are ranking hints, not retrieval gates.
    const requiredWorkModes = targets.workModes
      ?.filter(w => w.strength === 'required')
      .map(w => w.mode)

    // Geography: country codes take precedence over continent/city for indexing.
    // Continent is not included in criteria — too coarse for candidate-filter.
    const countryCodes = targets.geographies
      ?.map(g => g.country)
      .filter((c): c is string => c !== undefined)

    return {
      hardExclusions: {
        ...(excludedCompanyNames?.length ? { companyNames: excludedCompanyNames } : {}),
        ...(excludedCompanyDomains?.length ? { companyDomains: excludedCompanyDomains } : {}),
        ...(constraints.excludedRoleFamilies?.length
          ? { roleFamilies: constraints.excludedRoleFamilies }
          : {}),
      },
      candidateFilters: {
        ...(targets.roleFamilies?.length ? { roleFamilies: targets.roleFamilies } : {}),
        ...(targets.roleLevels?.length ? { roleLevels: targets.roleLevels } : {}),
        ...(requiredWorkModes?.length ? { workModes: requiredWorkModes } : {}),
        ...(countryCodes?.length ? { countryCodes } : {}),
      },
      activeOnly: true,
      limit: 500,
    }
  }
}
