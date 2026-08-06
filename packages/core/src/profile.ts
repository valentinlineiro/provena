import type {
  Identity,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Capability,
  Evidence,
  Contribution,
  Preferences,
} from './types.js'
import type { PreferenceSet } from './preference-set.js'

export interface Profile {
  readonly identity: Identity
  readonly experiences: readonly Experience[]
  readonly projects: readonly Project[]
  readonly education: readonly Education[]
  readonly publications: readonly Publication[]
  readonly certifications: readonly Certification[]
  readonly recommendations: readonly Recommendation[]
  readonly capabilities: readonly Capability[]
  readonly evidence: readonly Evidence[]
  readonly contributions?: readonly Contribution[]
  /** @deprecated Use preferenceSet instead. Retained for YAML workspace compatibility. */
  readonly preferences?: Preferences
  /** O2.1: structured preferences — authoritative when present. */
  readonly preferenceSet?: PreferenceSet
}
