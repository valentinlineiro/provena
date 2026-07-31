import type { Profile } from './profile.js'
import { buildResumeModel } from './projections.js'
import { deriveStrengths } from './career.js'
import type { ResumeModel } from './projections.js'

export interface DecisionContext {
  targetRole?: string
  audience?: 'recruiter' | 'hiring-manager'
  emphasize?: readonly string[]
  omit?: readonly string[]
}

export interface CVContext extends DecisionContext {
  includeExperienceIds?: readonly string[]
  excludeExperienceIds?: readonly string[]
  generateSummary?: boolean
}

export interface ProjectionMetadata {
  generatedSummary: boolean
  selectedExperienceIds: string[]
  excludedExperienceIds: string[]
  emphasizedCapabilities: string[]
}

export interface CVProjection {
  model: ResumeModel
  metadata: ProjectionMetadata
}

function autoSummary(profile: Profile, targetRole: string): string {
  const names = deriveStrengths(profile).slice(0, 3).map(s => s.name)
  return targetRole + ' with proven strengths in ' + names.join(', ') + '.'
}

export function cvProjector(profile: Profile, context: CVContext = {}): CVProjection {
  const allIds = profile.identity.experienceIds.filter(id => profile.experiences.some(e => e.id === id))
  const include = context.includeExperienceIds
  const selected = (include && include.length > 0 ? include.filter(id => allIds.includes(id)) : [...allIds])
    .filter(id => !(context.excludeExperienceIds ?? []).includes(id))
  const excluded = (context.excludeExperienceIds ?? []).filter(id => allIds.includes(id))

  const base = buildResumeModel(profile, {
    includeExperienceIds: selected,
    emphasize: context.emphasize,
    omit: context.omit,
  })

  const hasExplicit = !!profile.identity.person.summary
  const generate = context.generateSummary === true || (!hasExplicit && !!context.targetRole)
  const summary = generate && context.targetRole ? autoSummary(profile, context.targetRole) : base.summary
  const projects = context.audience === 'recruiter' ? [] : base.projects
  const model: ResumeModel = { ...base, summary, projects }

  const emphasizedCapabilities = (context.emphasize ?? []).filter(name =>
    model.capabilities.some(c => c.name === name))

  return {
    model,
    metadata: {
      generatedSummary: generate && !!context.targetRole,
      selectedExperienceIds: selected,
      excludedExperienceIds: excluded,
      emphasizedCapabilities,
    },
  }
}
