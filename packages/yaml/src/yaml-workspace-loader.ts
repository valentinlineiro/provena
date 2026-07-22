import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { WorkspaceLoader, Profile } from '@provena/core'
import type {
  Person,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Capability,
  Evidence,
} from '@provena/core'
import { validate } from '@provena/core'

function loadYaml<T>(abspath: string): Promise<T | null> {
  return readFile(abspath, 'utf-8').then(
    (content) => yaml.load(content) as T,
    () => null,
  )
}

function ids(items: { id: string }[]): readonly string[] {
  return items.map((i) => i.id)
}

export class YamlWorkspaceLoader implements WorkspaceLoader {
  async load(path: string): Promise<Profile> {
    const manifest = await loadYaml<{ version?: string }>(join(path, 'provena.yaml'))
    if (!manifest) throw new Error(`provena.yaml not found in ${path}`)

    const person = await loadYaml<Person>(join(path, 'person.yaml'))
    if (!person) throw new Error('person.yaml is required')

    const experiences = (await loadYaml<Experience[]>(join(path, 'experience.yaml'))) ?? []
    const projects = (await loadYaml<Project[]>(join(path, 'projects.yaml'))) ?? []
    const education = (await loadYaml<Education[]>(join(path, 'education.yaml'))) ?? []
    const publications = (await loadYaml<Publication[]>(join(path, 'publications.yaml'))) ?? []
    const certifications = (await loadYaml<Certification[]>(join(path, 'certifications.yaml'))) ?? []
    const recommendations = (await loadYaml<Recommendation[]>(join(path, 'recommendations.yaml'))) ?? []
    const capabilities = (await loadYaml<Capability[]>(join(path, 'capabilities.yaml'))) ?? []
    const evidence = (await loadYaml<Evidence[]>(join(path, 'evidence.yaml'))) ?? []

    const profile: Profile = {
      identity: {
        person,
        metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
        experienceIds: ids(experiences),
        projectIds: ids(projects),
        educationIds: ids(education),
        publicationIds: ids(publications),
        certificationIds: ids(certifications),
        recommendationIds: ids(recommendations),
        capabilityIds: ids(capabilities),
      },
      experiences,
      projects,
      education,
      publications,
      certifications,
      recommendations,
      capabilities,
      evidence,
    }

    const errors = validate(profile)
    if (errors.length > 0) {
      const details = errors.map((e) => `  ${e.path}: ${e.message}`).join('\n')
      throw new Error(`Invalid workspace at ${path}:\n${details}`)
    }

    return profile
  }
}
