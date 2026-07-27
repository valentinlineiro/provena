import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { Profile } from '@provena/core'
import { LATEST_VERSION, type SchemaVersion } from './migration-runner.js'

export class YamlWorkspaceWriter {
  async write(path: string, profile: Profile, version?: SchemaVersion): Promise<void> {
    await mkdir(path, { recursive: true })

    const order: Record<string, string[]> = {
      experiences: [...profile.identity.experienceIds],
      projects: [...profile.identity.projectIds],
      education: [...profile.identity.educationIds],
      publications: [...profile.identity.publicationIds],
      certifications: [...profile.identity.certificationIds],
      recommendations: [...profile.identity.recommendationIds],
      capabilities: [...profile.identity.capabilityIds],
    }

    await writeFile(
      join(path, 'provena.yaml'),
      yaml.dump({ version: version ?? LATEST_VERSION, order }),
    )

    await writeFile(join(path, 'person.yaml'), yaml.dump(profile.identity.person))

    const entries: [string, readonly unknown[]][] = [
      ['experience.yaml', profile.experiences],
      ['projects.yaml', profile.projects],
      ['education.yaml', profile.education],
      ['publications.yaml', profile.publications],
      ['certifications.yaml', profile.certifications],
      ['recommendations.yaml', profile.recommendations],
      ['capabilities.yaml', profile.capabilities],
      ['evidence.yaml', profile.evidence],
    ]

    for (const [filename, items] of entries) {
      await writeFile(join(path, filename), yaml.dump(items))
    }
  }
}
