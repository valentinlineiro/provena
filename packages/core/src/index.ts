export type {
  Metadata,
  EvidenceSource,
  Evidence,
  Capability,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Person,
  Identity,
} from './types.js'

export type { Profile } from './profile.js'

export type {
  ResumeExperience,
  ResumeProject,
  ResumeSkill,
  ResumeProjection,
  LinkedInExperience,
  LinkedInProject,
  LinkedInCapability,
  LinkedInProjection,
} from './projections.js'
export { toResumeProjection, toLinkedInProjection } from './projections.js'

export type { Renderer } from './renderer.js'

export type { WorkspaceLoader } from './workspace.js'

export { validate } from './validate.js'
export type { ValidationError } from './validate.js'
