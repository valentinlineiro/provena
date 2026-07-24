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
