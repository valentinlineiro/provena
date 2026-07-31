import type { Profile } from './profile.js'
import type { Education, Publication, Certification, Experience } from './types.js'

export interface Projector<TModel> {
  project(profile: Profile): TModel
}

function resolve<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const map = new Map(items.map((i) => [i.id, i]))
  return ids.map((id) => map.get(id)).filter((x): x is T => x !== undefined)
}

function topTechnologies(experiences: readonly Experience[]): string[] {
  const freq = new Map<string, number>()
  for (const e of experiences) {
    for (const t of e.technologies) {
      freq.set(t, (freq.get(t) ?? 0) + 1)
    }
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([name]) => name)
}

export interface ResumeExperience {
  readonly organization: string
  readonly title: string
  readonly start: string
  readonly end?: string
  readonly summary?: string
  readonly achievements: readonly string[]
  readonly technologies: readonly string[]
}

export interface ResumeProject {
  readonly name: string
  readonly role?: string
  readonly description: string
  readonly url?: string
  readonly technologies: readonly string[]
}

export interface ResumeSkill {
  readonly name: string
  readonly description?: string
  readonly evidenceCount: number
}

export interface ResumeModel {
  readonly name: string
  readonly email?: string
  readonly location?: string
  readonly urls: Record<string, string>
  readonly summary: string
  readonly experiences: readonly ResumeExperience[]
  readonly projects: readonly ResumeProject[]
  readonly education: readonly Education[]
  readonly publications: readonly Publication[]
  readonly certifications: readonly Certification[]
  readonly capabilities: readonly ResumeSkill[]
  readonly snapshot?: CareerSnapshot
}

export interface CareerSnapshot {
  readonly targetRole: string
  readonly coreExpertise: readonly string[]
  readonly primaryTechnologies: readonly string[]
  readonly highlights: readonly string[]
}

export interface ResumeBuildOptions {
  includeExperienceIds?: readonly string[]
  excludeExperienceIds?: readonly string[]
  emphasize?: readonly string[]
  omit?: readonly string[]
}

function resolveExperiences(profile: Profile, opts: ResumeBuildOptions = {}): Experience[] {
  const map = new Map(profile.experiences.map(e => [e.id, e]))
  const all = profile.identity.experienceIds.map(id => map.get(id)).filter((e): e is Experience => e !== undefined)
  const included = opts.includeExperienceIds !== undefined
    ? all.filter(e => opts.includeExperienceIds!.includes(e.id))
    : all
  return included.filter(e => !(opts.excludeExperienceIds ?? []).includes(e.id))
}

function reorderTechnologies(techs: readonly string[], emphasize: readonly string[], omit: readonly string[]): string[] {
  const present = techs.filter(t => !omit.includes(t))
  const [moved, rest] = [present.filter(t => emphasize.includes(t)), present.filter(t => !emphasize.includes(t))]
  return [...moved, ...rest]
}

export function buildResumeModel(profile: Profile, opts: ResumeBuildOptions = {}): ResumeModel {
  const experiences = resolveExperiences(profile, opts)
  const emphasize = opts.emphasize ?? []
  const omit = opts.omit ?? []
  return {
    name: profile.identity.person.name,
    email: profile.identity.person.email,
    location: profile.identity.person.location,
    urls: profile.identity.person.urls,
    summary: profile.identity.person.summary ?? '',
    experiences: experiences.map(e => ({
      organization: e.organization,
      title: e.title,
      start: e.start,
      end: e.end,
      summary: e.summary,
      achievements: e.achievements,
      technologies: reorderTechnologies(e.technologies, emphasize, omit),
    })),
    projects: resolve(profile.identity.projectIds, profile.projects).map(p => ({
      name: p.name,
      role: p.role,
      description: p.description,
      url: p.url,
      technologies: p.technologies,
    })),
    education: resolve(profile.identity.educationIds, profile.education),
    publications: resolve(profile.identity.publicationIds, profile.publications),
    certifications: resolve(profile.identity.certificationIds, profile.certifications),
    capabilities: [...new Set(experiences.flatMap(e => e.technologies))]
      .filter(t => !omit.includes(t))
      .map(name => ({ name: reorderTechnologies([name], emphasize, [])[0]!, description: undefined, evidenceCount: 0 })),
  }
}

export const resumeProjector: Projector<ResumeModel> = {
  project: (profile: Profile): ResumeModel => buildResumeModel(profile),
}

export interface RecruiterBriefModel {
  readonly name: string
  readonly title?: string
  readonly summary: string
  readonly location?: string
  readonly urls: Record<string, string>
  readonly topTechnologies: string[]
  readonly experiences: readonly {
    readonly organization: string
    readonly title: string
    readonly technologies: readonly string[]
  }[]
  readonly roles?: readonly string[]
  readonly remote?: string
  readonly compensation?: { readonly minimum?: number; readonly currency?: string }
  readonly avoid?: readonly string[]
  readonly interests?: readonly string[]
}

export const recruiterProjector: Projector<RecruiterBriefModel> = {
  project(profile: Profile): RecruiterBriefModel {
    return {
      name: profile.identity.person.name,
      title: profile.identity.person.title,
      summary: profile.identity.person.summary ?? '',
      location: profile.identity.person.location,
      urls: profile.identity.person.urls,
      topTechnologies: topTechnologies(resolve(profile.identity.experienceIds, profile.experiences)),
      experiences: resolve(profile.identity.experienceIds, profile.experiences).map((e) => ({
        organization: e.organization,
        title: e.title,
        technologies: e.technologies,
      })),
      roles: profile.preferences?.roles,
      remote: profile.preferences?.work?.remote,
      compensation: profile.preferences?.compensation,
      avoid: profile.preferences?.avoid,
      interests: profile.preferences?.interests,
    }
  },
}
