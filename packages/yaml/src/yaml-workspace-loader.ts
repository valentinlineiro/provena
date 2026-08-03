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
  parsePreferences,
  parseContributions,
} from './schema.js'
import { applyMigrations, type SchemaVersion, type Migration } from './migration-runner.js'

export const MIGRATIONS: Migration[] = []

function loadYaml<T>(abspath: string): Promise<T | null> {
  return readFile(abspath, 'utf-8').then(
    (content) => yaml.load(content) as T,
    () => null,
  )
}

interface Manifest {
  version?: SchemaVersion
  order?: Record<string, string[]>
}

function parseVersion(v: unknown): SchemaVersion {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const n = parseInt(v, 10)
    if (!isNaN(n)) return n
  }
  return 1
}

function orderedIds(manifest: Manifest, key: string, items: { id: string }[]): readonly string[] {
  return manifest.order?.[key] ?? items.map((i) => i.id)
}

export class YamlWorkspaceLoader implements WorkspaceLoader {
  readonly #migrations: Migration[]

  constructor(migrations: Migration[] = MIGRATIONS) {
    this.#migrations = migrations
  }

  async load(path: string): Promise<{ profile: Profile; migrated: boolean }> {
    const rawManifest = await loadYaml<Record<string, unknown>>(join(path, 'provena.yaml'))
    if (!rawManifest) throw new Error(`provena.yaml not found in ${path}`)

    const currentVersion = parseVersion(rawManifest.version)
    const migrated = applyMigrations(currentVersion, rawManifest, this.#migrations)
    const manifest = migrated.data as unknown as Manifest

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
    const preferences = parsePreferences(await loadYaml<unknown>(join(path, 'preferences.yaml')))
    const contributions = parseContributions((await loadYaml<unknown>(join(path, 'contributions.yaml'))) ?? [])

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
        contributionIds: orderedIds(manifest, 'contributions', contributions),
      },
      experiences,
      projects,
      education,
      publications,
      certifications,
      recommendations,
      capabilities,
      evidence,
      contributions,
      preferences: preferences ?? undefined,
    }

    const errors = validate(profile)
    if (errors.length > 0) {
      throw new Error(`Invalid workspace at ${path}:\n${formatValidationErrors(errors)}`)
    }

    return { profile, migrated: migrated.migrated }
  }
}
