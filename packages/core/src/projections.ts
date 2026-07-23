import type { Profile } from './profile.js'
import type { Education, Publication, Certification } from './types.js'

export interface Projector<TModel> {
  project(profile: Profile): TModel
}

function resolve<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const map = new Map(items.map((i) => [i.id, i]))
  return ids.map((id) => map.get(id)).filter((x): x is T => x !== undefined)
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
}

export interface LinkedInExperience {
  readonly organization: string
  readonly title: string
  readonly start: string
  readonly end?: string
  readonly description: string
  readonly technologies: readonly string[]
}

export interface LinkedInProject {
  readonly name: string
  readonly description: string
  readonly url?: string
}

export interface LinkedInCapability {
  readonly name: string
  readonly evidenceCount: number
}

export interface LinkedInModel {
  readonly headline: string
  readonly about: string
  readonly experiences: readonly LinkedInExperience[]
  readonly featuredProjects: readonly LinkedInProject[]
  readonly topCapabilities: readonly LinkedInCapability[]
}

export const resumeProjector: Projector<ResumeModel> = {
  project(profile: Profile): ResumeModel {
    return {
      name: profile.identity.person.name,
      email: profile.identity.person.email,
      location: profile.identity.person.location,
      urls: profile.identity.person.urls,
      summary: profile.identity.person.summary ?? '',
      experiences: resolve(profile.identity.experienceIds, profile.experiences).map((e) => ({
        organization: e.organization,
        title: e.title,
        start: e.start,
        end: e.end,
        summary: e.summary,
        achievements: e.achievements,
        technologies: e.technologies,
      })),
      projects: resolve(profile.identity.projectIds, profile.projects).map((p) => ({
        name: p.name,
        role: p.role,
        description: p.description,
        url: p.url,
        technologies: p.technologies,
      })),
      education: resolve(profile.identity.educationIds, profile.education),
      publications: resolve(profile.identity.publicationIds, profile.publications),
      certifications: resolve(profile.identity.certificationIds, profile.certifications),
      capabilities: resolve(profile.identity.capabilityIds, profile.capabilities).map((c) => ({
        name: c.name,
        description: c.description,
        evidenceCount: c.evidenceIds.length,
      })),
    }
  },
}

export function toLinkedInProjection(profile: Profile): LinkedInModel {
  const experiences = resolve(profile.identity.experienceIds, profile.experiences)
    .sort((a, b) => b.start.localeCompare(a.start))
    .slice(0, 4)
    .map((e) => ({
      organization: e.organization,
      title: e.title,
      start: e.start,
      end: e.end,
      description: e.summary ?? '',
      technologies: e.technologies,
    }))

  const projects = resolve(profile.identity.projectIds, profile.projects).slice(0, 3)

  const topCapabilities = resolve(profile.identity.capabilityIds, profile.capabilities)
    .sort((a, b) => b.evidenceIds.length - a.evidenceIds.length)
    .slice(0, 10)
    .map((c) => ({ name: c.name, evidenceCount: c.evidenceIds.length }) satisfies LinkedInCapability)

  return {
    headline: profile.identity.person.title ?? '',
    about: profile.identity.person.summary ?? '',
    experiences,
    featuredProjects: projects.map((p) => ({
      name: p.name,
      description: p.description,
      url: p.url,
    })),
    topCapabilities,
  }
}
