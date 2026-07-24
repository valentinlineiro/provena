import type { Profile, Projector } from '@provena/core'

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

function resolve<T extends { id: string }>(ids: readonly string[], items: readonly T[]): T[] {
  const map = new Map(items.map((i) => [i.id, i]))
  return ids.map((id) => map.get(id)).filter((x): x is T => x !== undefined)
}

export const linkedInProjector: Projector<LinkedInModel> = {
  project(profile: Profile): LinkedInModel {
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
  },
}
