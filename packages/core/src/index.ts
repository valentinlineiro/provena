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
  ScopeLevel,
  ContributionRole,
  Scope,
  Outcome,
  Contribution,
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

export type {
  DecisionContext,
  CVContext,
  CvBudget,
  CVProjection,
  CvIdentity,
  CvExperience,
  CvProject,
  CvEducation,
  CvCertification,
} from './cv-projector.js'
export { cvProjector, buildCvProjection, DEFAULT_CV_BUDGET, EvidenceClass, classifyEvidence, rankAchievements, significantSignals, redundantSummary, experienceContribution, CONTRIBUTION_BUDGET, projectContribution } from './cv-projector.js'

export type { CareerExperience, CareerTimeline, Strength, Gap } from './career.js'
export { deriveStrengths, deriveEvidenceCount, findEvidenceGaps, profileToTimeline } from './career.js'

export type { Renderer } from './renderer.js'

export type { WorkspaceLoader } from './workspace.js'

export { validate, formatValidationErrors } from './validate.js'
export type { ValidationError } from './validate.js'

export type { Verdict, CriterionStatus, SignalStatus, CriterionCheck, SignalMatch, OpportunityEvaluation, ResolvedRequirement, EvidenceSufficiencyAssessment, Transferability } from './opportunity.js'
export { evaluateOpportunity, resolveRequirements, evaluateSufficiency, evaluateTransferability, findMatchedRole, APPLY_COVERAGE_THRESHOLD, APPLY_INTERPRETATION_THRESHOLD } from './opportunity.js'

export type { MarketRequirement, MarketModel } from './market.js'
export { extractMarketRequirements } from './market.js'

