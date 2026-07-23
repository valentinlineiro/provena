import type { Profile, Projector } from '@provena/core'

type JsonResumeBasics = {
  name: string
  email?: string
  phone?: string
  location?: string
  title?: string
  summary?: string
  url?: string
}

type JsonResumeExperience = {
  company: string
  position: string
  startDate: string
  endDate?: string
  summary?: string
  achievements?: string[]
}

type JsonResumeProject = {
  name: string
  description: string
  url?: string
  technologies?: string[]
}

type JsonResumeSkill = {
  name: string
  keywords?: string[]
}

export type JsonResumeModel = {
  basics: JsonResumeBasics
  experiences: JsonResumeExperience[]
  projects: JsonResumeProject[]
  skills: JsonResumeSkill[]
}

function resolve<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const map = new Map(items.map((i) => [i.id, i]))
  return ids.map((id) => map.get(id)).filter((x): x is T => x !== undefined)
}

export const jsonResumeProjector: Projector<JsonResumeModel> = {
  project(profile: Profile): JsonResumeModel {
    const p = profile.identity.person
    return {
      basics: {
        name: p.name,
        email: p.email,
        phone: p.phone,
        location: p.location,
        title: p.title,
        summary: p.summary,
        url: p.urls.website ?? p.urls.github,
      },
      experiences: resolve(profile.identity.experienceIds, profile.experiences).map((e) => ({
        company: e.organization,
        position: e.title,
        startDate: e.start,
        endDate: e.end,
        summary: e.summary,
        achievements: e.achievements.length > 0 ? [...e.achievements] : undefined,
      })),
      projects: resolve(profile.identity.projectIds, profile.projects).map((proj) => ({
        name: proj.name,
        description: proj.description,
        url: proj.url,
        technologies: proj.technologies.length > 0 ? [...proj.technologies] : undefined,
      })),
      skills: resolve(profile.identity.capabilityIds, profile.capabilities).map((c) => ({
        name: c.name,
        keywords: c.evidenceIds.length > 0 ? [`${c.evidenceIds.length} evidence items`] : undefined,
      })),
    }
  },
}
