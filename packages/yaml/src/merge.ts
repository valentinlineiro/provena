import type { Profile, Experience, Project, Education, Publication, Certification, Recommendation, Capability } from '@provena/core'
import { createHash } from 'node:crypto'

interface Matcher<T> {
  match(imported: T, existing: readonly T[]): T | undefined
}

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize('NFKC').replace(/\s+/g, ' ')
}

function hashText(text: string): string {
  return createHash('sha256').update(normalize(text)).digest('hex')
}

function fingerprint(e: { organization: string; title: string; start: string }): string {
  return createHash('sha256')
    .update(`${normalize(e.organization)}|${normalize(e.title)}|${normalize(e.start)}`)
    .digest('hex')
}

class ExperienceMatcher implements Matcher<Experience> {
  match(imported: Experience, existing: readonly Experience[]): Experience | undefined {
    if (imported.provenance?.source === 'linkedin' && imported.provenance.importedAt) {
      const fp = fingerprint(imported)
      for (const e of existing) {
        if (e.provenance?.source === 'linkedin' && e.provenance.importedAt) {
          if (fingerprint(e) === fp) return e
        }
      }
    }
    return existing.find((e) =>
      normalize(e.organization) === normalize(imported.organization) &&
      normalize(e.title) === normalize(imported.title) &&
      normalize(e.start) === normalize(imported.start),
    )
  }
}

class CapabilityMatcher implements Matcher<Capability> {
  match(imported: Capability, existing: readonly Capability[]): Capability | undefined {
    return existing.find((c) => normalize(c.name) === normalize(imported.name))
  }
}

class ProjectMatcher implements Matcher<Project> {
  match(imported: Project, existing: readonly Project[]): Project | undefined {
    return existing.find((p) => normalize(p.name) === normalize(imported.name))
  }
}

class EducationMatcher implements Matcher<Education> {
  match(imported: Education, existing: readonly Education[]): Education | undefined {
    return existing.find((e) =>
      normalize(e.institution) === normalize(imported.institution) &&
      normalize(e.degree) === normalize(imported.degree) &&
      (imported.start ? normalize(e.start ?? '') === normalize(imported.start) : true),
    )
  }
}

class PublicationMatcher implements Matcher<Publication> {
  match(imported: Publication, existing: readonly Publication[]): Publication | undefined {
    return existing.find((p) => normalize(p.title) === normalize(imported.title))
  }
}

class CertificationMatcher implements Matcher<Certification> {
  match(imported: Certification, existing: readonly Certification[]): Certification | undefined {
    return existing.find((c) =>
      normalize(c.name) === normalize(imported.name) &&
      normalize(c.issuer) === normalize(imported.issuer),
    )
  }
}

class RecommendationMatcher implements Matcher<Recommendation> {
  match(imported: Recommendation, existing: readonly Recommendation[]): Recommendation | undefined {
    const importedHash = hashText(imported.text)
    return existing.find((r) =>
      normalize(r.author) === normalize(imported.author) &&
      hashText(r.text) === importedHash,
    )
  }
}

function mergeEntities<T>(
  imported: readonly T[] | undefined,
  existing: readonly T[],
  matcher: Matcher<T>,
): { merged: T[]; added: T[] } {
  const result = [...existing]
  const added: T[] = []

  for (const item of imported ?? []) {
    if (!matcher.match(item, existing)) {
      result.push(item)
      added.push(item)
    }
  }

  return { merged: result, added }
}

export function merge(imported: Partial<Profile>, existing: Profile): Profile {
  const expResult = mergeEntities(imported.experiences, existing.experiences, new ExperienceMatcher())
  const capResult = mergeEntities(imported.capabilities, existing.capabilities, new CapabilityMatcher())
  const projResult = mergeEntities(imported.projects, existing.projects, new ProjectMatcher())
  const eduResult = mergeEntities(imported.education, existing.education, new EducationMatcher())
  const pubResult = mergeEntities(imported.publications, existing.publications, new PublicationMatcher())
  const certResult = mergeEntities(imported.certifications, existing.certifications, new CertificationMatcher())
  const recResult = mergeEntities(imported.recommendations, existing.recommendations, new RecommendationMatcher())

  return {
    identity: {
      person: existing.identity.person,
      experienceIds: [
        ...existing.identity.experienceIds,
        ...expResult.added.map((e) => e.id),
      ],
      projectIds: [
        ...existing.identity.projectIds,
        ...projResult.added.map((p) => p.id),
      ],
      educationIds: [
        ...existing.identity.educationIds,
        ...eduResult.added.map((e) => e.id),
      ],
      publicationIds: [
        ...existing.identity.publicationIds,
        ...pubResult.added.map((p) => p.id),
      ],
      certificationIds: [
        ...existing.identity.certificationIds,
        ...certResult.added.map((c) => c.id),
      ],
      recommendationIds: [
        ...existing.identity.recommendationIds,
        ...recResult.added.map((r) => r.id),
      ],
      capabilityIds: [
        ...existing.identity.capabilityIds,
        ...capResult.added.map((c) => c.id),
      ],
    },
    experiences: expResult.merged,
    projects: projResult.merged,
    education: eduResult.merged,
    publications: pubResult.merged,
    certifications: certResult.merged,
    recommendations: recResult.merged,
    capabilities: capResult.merged,
    evidence: existing.evidence,
  }
}
