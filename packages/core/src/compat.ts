// ── O2.1 → O1 Compatibility Adapter ──────────────────────────────────────────
//
// Converts a structured O2 PreferenceSet into an O1 legacy Preferences object
// so that existing K5B preference scoring (assessPreferences in opportunity.ts)
// works without modification until K5B is updated to read PreferenceSet natively.

import type { PreferenceSet } from './preference-set.js'
import type { Preferences } from './types.js'

export function preferenceSetToLegacy(ps: PreferenceSet): Preferences {
  const { targets, constraints } = ps

  const roles = targets.roleFamilies?.length ? [...targets.roleFamilies] : undefined

  // Find required remote work mode if any
  const requiredRemote = targets.workModes?.find(
    w => w.mode === 'remote' && w.strength === 'required',
  )
  const work = requiredRemote ? { remote: 'required' as const } : undefined

  const compensation = targets.compensation
    ? {
        minimum: targets.compensation.minimum,
        currency: targets.compensation.currency,
      }
    : undefined

  const avoid = constraints.legacyAvoidTerms?.length
    ? [...constraints.legacyAvoidTerms]
    : undefined

  return {
    ...(roles ? { roles } : {}),
    ...(work ? { work } : {}),
    ...(compensation ? { compensation } : {}),
    ...(avoid ? { avoid } : {}),
  }
}
