export type { Provenance } from './types.js'

export type { Importer } from './importer.js'

export type {
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
  Preferences,
  Capture,
  Identity,
} from './types.js'

export type { Profile } from './profile.js'

export type {
  Projector,
  ResumeExperience,
  ResumeProject,
  ResumeSkill,
  ResumeModel,
  CareerSnapshot,
  RecruiterBriefModel,
} from './projections.js'
export { resumeProjector, recruiterProjector } from './projections.js'

export type { ResumeBuildOptions } from './projections.js'
export { buildResumeModel } from './projections.js'

export type { DecisionContext, CVContext, ProjectionMetadata, CVProjection } from './cv-projector.js'
export { cvProjector } from './cv-projector.js'

export type { CareerExperience, CareerTimeline, Strength, Gap } from './career.js'
export { deriveStrengths, deriveEvidenceCount, findEvidenceGaps, profileToTimeline } from './career.js'

export type { Renderer } from './renderer.js'

export type { WorkspaceLoader } from './workspace.js'

export { validate, formatValidationErrors } from './validate.js'
export type { ValidationError } from './validate.js'
