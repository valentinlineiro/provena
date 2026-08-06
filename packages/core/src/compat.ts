// ── O2 migration adapter ─────────────────────────────────────────────────────
//
// Converts PreferenceSet to the legacy Preferences shape so that K5B/K6C can
// continue consuming the existing interface without modification during O2.1.
//
// Delete this file when K5B consumes PreferenceSet directly (O2.2+).
// No other module should import from compat.ts except opportunity.ts.

import type { Preferences } from './types.js'
import type { PreferenceSet } from './preference-set.js'

/**
 * O2 migration adapter.
 *
 * Translates a PreferenceSet to the legacy Preferences shape.
 * The mapping is intentionally conservative — it preserves the semantic
 * contract of each legacy field rather than attempting a lossless round-trip.
 *
 * Known approximations:
 *   - targets.roleFamilies → Preferences.roles: families are used as role
 *     tokens; the legacy checkRoles function matches against them via
 *     findMatchedRole. This is lossy (roleLevels not forwarded) but sufficient
 *     until K5B reads PreferenceSet directly.
 *   - targets.workModes: only the first 'required' mode is forwarded as the
 *     legacy remote string. Multiple required modes are not representable in
 *     the legacy shape.
 *   - constraints.compensation: minimum + currency forwarded; preferred
 *     threshold is preserved via (prefs as any).compensation.preferred in the
 *     existing assessPreferences implementation.
 *   - constraints.legacyAvoidTerms → Preferences.avoid: direct pass-through.
 *   - constraints.excludedCompanies, excludedRoleFamilies, excludedLocations:
 *     not representable in legacy shape — consumed structurally by Retrieval,
 *     not by K5B.
 *
 * @deprecated Remove when opportunity.ts consumes PreferenceSet directly.
 */
export function preferenceSetToLegacy(ps: PreferenceSet): Preferences {
  // Work mode: forward first 'required' preference only.
  // Legacy remote values: 'required' | 'hybrid' | 'optional'
  const requiredMode = ps.targets.workModes?.find(w => w.strength === 'required')?.mode
  const legacyRemote: 'required' | 'hybrid' | 'optional' | undefined =
    requiredMode === 'remote' ? 'required'
    : requiredMode === 'hybrid' ? 'hybrid'
    : undefined

  // Roles: use roleFamilies as role token list.
  // checkRoles in opportunity.ts compares these against JD via findMatchedRole.
  const roles: string[] | undefined = ps.targets.roleFamilies
    ? [...ps.targets.roleFamilies]
    : undefined

  // Compensation
  const comp = ps.targets.compensation
  const compensation: Preferences['compensation'] = comp
    ? { minimum: comp.minimum, currency: comp.currency }
    : undefined

  // Avoid: only legacy terms; structured exclusions are retrieval-only.
  const avoid = ps.constraints.legacyAvoidTerms
    ? [...ps.constraints.legacyAvoidTerms]
    : undefined

  return {
    ...(roles !== undefined ? { roles } : {}),
    ...(legacyRemote !== undefined ? { work: { remote: legacyRemote } } : {}),
    ...(compensation !== undefined ? { compensation } : {}),
    ...(avoid !== undefined ? { avoid } : {}),
  }
}
