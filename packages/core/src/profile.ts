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
} from './types.js'

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
}
