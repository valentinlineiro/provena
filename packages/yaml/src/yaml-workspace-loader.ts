import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { WorkspaceLoader, Profile } from '@provena/core'
import { validate, formatValidationErrors } from '@provena/core'
import {
  parsePerson,
  parseExperiences,
  parseProjects,
  parseEducation,
  parsePublications,
  parseCertifications,
  parseRecommendations,
  parseCapabilities,
  parseEvidence,
} from './schema.js'

function loadYaml<T>(abspath: string): Promise<T | null> {
  return readFile(abspath, 'utf-8').then(
    (content) => yaml.load(content) as T,
    () => null,
  )
}

interface Manifest {
  version?: string
  order?: Record<string, string[]>
}

function orderedIds(manifest: Manifest, key: string, items: { id: string }[]): readonly string[] {
  return manifest.order?.[key] ?? items.map((i) => i.id)
}

export class YamlWorkspaceLoader implements WorkspaceLoader {
  async load(path: string): Promise<Profile> {
    const manifest = await loadYaml<Manifest>(join(path, 'provena.yaml'))
    if (!manifest) throw new Error(`provena.yaml not found in ${path}`)

    const rawPerson = await loadYaml<unknown>(join(path, 'person.yaml'))
    if (!rawPerson) throw new Error('person.yaml is required')
    const person = parsePerson(rawPerson)

    const experiences = parseExperiences((await loadYaml<unknown>(join(path, 'experience.yaml'))) ?? [])
    const projects = parseProjects((await loadYaml<unknown>(join(path, 'projects.yaml'))) ?? [])
    const education = parseEducation((await loadYaml<unknown>(join(path, 'education.yaml'))) ?? [])
    const publications = parsePublications((await loadYaml<unknown>(join(path, 'publications.yaml'))) ?? [])
    const certifications = parseCertifications((await loadYaml<unknown>(join(path, 'certifications.yaml'))) ?? [])
    const recommendations = parseRecommendations((await loadYaml<unknown>(join(path, 'recommendations.yaml'))) ?? [])
    const capabilities = parseCapabilities((await loadYaml<unknown>(join(path, 'capabilities.yaml'))) ?? [])
    const evidence = parseEvidence((await loadYaml<unknown>(join(path, 'evidence.yaml'))) ?? [])

    const profile: Profile = {
      identity: {
        person,
        experienceIds: orderedIds(manifest, 'experiences', experiences),
        projectIds: orderedIds(manifest, 'projects', projects),
        educationIds: orderedIds(manifest, 'education', education),
        publicationIds: orderedIds(manifest, 'publications', publications),
        certificationIds: orderedIds(manifest, 'certifications', certifications),
        recommendationIds: orderedIds(manifest, 'recommendations', recommendations),
        capabilityIds: orderedIds(manifest, 'capabilities', capabilities),
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
      throw new Error(`Invalid workspace at ${path}:\n${formatValidationErrors(errors)}`)
    }

    return profile
  }
}
