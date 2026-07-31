import type { Profile } from './profile.js'
import { buildResumeModel } from './projections.js'
import { deriveStrengths } from './career.js'
import type { ResumeModel, CareerSnapshot } from './projections.js'

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

function deriveHighlights(profile: Profile): string[] {
  const exps = profile.identity.experienceIds
    .map(id => profile.experiences.find(e => e.id === id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined)
  const highlights: string[] = []
  if (exps.length === 0) return highlights
  const earliest = exps.map(e => e.start).sort()[0]!
  const years = Math.floor((Date.now() - new Date(earliest).getTime()) / 31557600000)
  if (years > 0) highlights.push(years + '+ years of software engineering experience')
  const current = exps.find(e => !e.end)
  if (current) highlights.push('Currently ' + current.title + ' at ' + current.organization)
  const top = deriveStrengths(profile).slice(0, 3).map(s => s.name).join(', ')
  if (top) highlights.push('Strong expertise in ' + top)
  return highlights
}

function deriveSnapshot(profile: Profile, context: CVContext): CareerSnapshot {
  const titleSegments = (profile.identity.person.title ?? '').split('|').map(s => s.trim()).filter(Boolean)
  const targetRole = context.targetRole ?? titleSegments[0] ?? 'Software Engineer'
  const coreExpertise = (profile.preferences?.interests?.length
    ? profile.preferences.interests
    : titleSegments.slice(1)).slice(0, 5)
  const primaryTechnologies = deriveStrengths(profile)
    .map(s => s.name)
    .filter(t => !coreExpertise.includes(t))
    .slice(0, 8)
  return { targetRole, coreExpertise, primaryTechnologies, highlights: deriveHighlights(profile) }
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
  const model: ResumeModel = { ...base, summary, projects, snapshot: deriveSnapshot(profile, context) }

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
