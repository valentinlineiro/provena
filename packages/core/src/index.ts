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

export type { Verdict, CriterionStatus, SignalStatus, CriterionCheck, SignalMatch, OpportunityEvaluation, ResolvedRequirement, EvidenceSufficiencyAssessment, Transferability, ProfessionalFitProjection, PreferenceDimension, PreferenceStatus, PreferenceAssessment, PersonalFitProjection, Recommendation as OpportunityRecommendation, OpportunityAssessment } from './opportunity.js'
export { evaluateOpportunity, resolveRequirements, evaluateSufficiency, evaluateTransferability, projectProfessionalFit, assessPreferences, projectPersonalFit, computeRecognitionCoverage, isMarketBearingChunk, computeConfidence, applyPolicy, findMatchedRole, APPLY_COVERAGE_THRESHOLD, APPLY_INTERPRETATION_THRESHOLD, ABSTAIN_CONFIDENCE_THRESHOLD, STRONG_FIT_THRESHOLD, ACCEPTABLE_PERSONAL_THRESHOLD } from './opportunity.js'

export type { MarketRequirement, MarketModel } from './market.js'
export { extractMarketRequirements } from './market.js'

export type { MarketBenchmarkResult } from './market-benchmark.js'
export { runMarketRequirementBenchmark } from './market-benchmark.js'

export type { MarketPatternDefinition, MarketKnowledge, IMarketRecognizer } from './market-knowledge.js'
export { DeclarativeMarketRecognizer, composeKnowledge } from './market-knowledge.js'
export { DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE } from './default-knowledge.js'
export { SYSTEMS_INFRA_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE } from './domain-knowledge.js'

export type { RawOpportunity, OpportunitySourceInput, OpportunitySource, SafeFetchOptions, StoredOpportunity, OpportunityUserDecision, GreenhouseJobItem, OpportunityRepository } from './opportunity-source.js'
export { validateSafeUrl, fetchSafeContent, extractJobFromHtml, UrlOpportunitySource, GreenhousePublicSource, hashOpportunityKey, MemoryOpportunityRepository, reconcileBoardSync } from './opportunity-source.js'

// ── O2.1: PreferenceSet & Retrieval Port ────────────────────────────────────
export type {
  RoleFamily,
  RoleLevel,
  WorkMode,
  PreferenceStrength,
  WorkModeTarget,
  GeographyTarget,
  LanguageTarget,
  CompensationTarget,
  CompanyRef,
  LocationConstraint,
  PreferenceConstraints,
  PreferenceSet,
} from './preference-set.js'

export type {
  RetrievalTreatment,
  CandidateOpportunity,
  RetrievalCriteria,
  OpportunitySearchPort,
  RetrievalPolicy,
} from './retrieval.js'
export { DirectRetrievalPolicy } from './retrieval.js'

// ── O2.2: Market Catalog ─────────────────────────────────────────
export type {
  OpportunityId,
  OpportunityPostingId,
  SourceType,
  PostingStatus,
  Opportunity,
  OpportunityPosting,
  MarketModelRecord,
  DecisionStatus,
  UserOpportunityDecision,
  UserOpportunityAssessment,
} from './market-catalog.js'
export { makeOpportunityId, makeOpportunityPostingId, normalizeOpportunityTitle, makePostingDedupeKey } from './market-catalog.js'

// ── O2.3: Market Catalog Persistence Ports ───────────────────────────
export type {
  OpportunityQuery,
  MarketOpportunityRepository,
  MarketPostingRepository,
  MarketModelStore,
} from './market-catalog-ports.js'
export {
  MarketModelVersionConflict,
  MemoryMarketOpportunityRepository,
  MemoryMarketPostingRepository,
  MemoryMarketModelStore,
} from './market-catalog-ports.js'

// ── O2.5A: Market Ingestion Engine ───────────────────────────────────
export type {
  MarketRecognizer,
  IngestionContext,
  IngestResult,
  IngestionRunRecord,
} from './market-ingest.js'
export {
  computeContentHash,
  reconcilePostingStatus,
  reconcileBoardSync as reconcileCatalogBoardSync,
  MarketIngestionEngine,
} from './market-ingest.js'

// ── O2.7: Personalized Assessment & Ranking ─────────────────────────
export type { AssessmentContext } from './opportunity-assessment-engine.js'
export { OpportunityAssessmentEngine } from './opportunity-assessment-engine.js'

export type { RankedOpportunity, AttentionInbox, AttentionTab, AttentionCursorPayload, PaginatedAttentionView } from './opportunity-ranking-policy.js'
export { DefaultOpportunityRankingPolicy } from './opportunity-ranking-policy.js'

export type { OpportunityBookmark } from './opportunity-bookmark.js'
export { encodeBookmark, decodeBookmark } from './opportunity-bookmark.js'

// ── O2.8: Market Feed Service ────────────────────────────────────────
export type { FeedSourceRegistration, DeltaSyncResult } from './market-feed-service.js'
export { MarketFeedService } from './market-feed-service.js'

// ── Verdict Quality Benchmark Fixtures ─────────────────────────────
export type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
export { VERDICT_GROUND_TRUTH_DATASET } from './fixtures/verdict-ground-truth.js'

export type { VerdictBenchmarkMetrics } from './verdict-benchmark.js'
export { runVerdictQualityBenchmark } from './verdict-benchmark.js'


