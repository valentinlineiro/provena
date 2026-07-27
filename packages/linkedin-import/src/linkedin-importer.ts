import { fromBuffer } from 'yauzl'
import { readFile } from 'node:fs/promises'
import type { Profile, Importer } from '@provena/core'
import { parseProfileCsvs } from './linkedin-parser.js'

export class LinkedInImporter implements Importer<void> {
  async read(location: string): Promise<Partial<Profile>> {
    const buffer = await readFile(location)
    const files = await extractZip(buffer)

    if (!files['Profile.csv']) {
      throw new Error('LinkedIn export must contain Profile.csv')
    }

    const parsed = parseProfileCsvs(files)

    return {
      identity: {
        person: parsed.person,
        experienceIds: parsed.experiences.map((e) => e.id),
        projectIds: parsed.projects.map((p) => p.id),
        educationIds: parsed.education.map((e) => e.id),
        publicationIds: parsed.publications.map((p) => p.id),
        certificationIds: parsed.certifications.map((c) => c.id),
        recommendationIds: parsed.recommendations.map((r) => r.id),
        capabilityIds: parsed.capabilities.map((c) => c.id),
      },
      experiences: parsed.experiences,
      projects: parsed.projects,
      education: parsed.education,
      publications: parsed.publications,
      certifications: parsed.certifications,
      recommendations: parsed.recommendations,
      capabilities: parsed.capabilities,
    }
  }
}

function extractZip(buffer: Buffer): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const files: Record<string, string> = {}
    fromBuffer(buffer, { lazyEntries: true, decodeStrings: true }, (err, zipfile) => {
      if (err) return reject(new Error(`Invalid ZIP: ${err.message}`))
      if (!zipfile) return reject(new Error('Invalid ZIP'))

      zipfile.readEntry()
      zipfile.on('entry', (entry) => {
        if (/\/$/.test(entry.fileName)) {
          zipfile.readEntry()
          return
        }
        const chunks: Buffer[] = []
        zipfile.openReadStream(entry, (err, stream) => {
          if (err) return reject(err)
          stream!.on('data', (chunk: Buffer) => chunks.push(chunk))
          stream!.on('end', () => {
            files[entry.fileName] = Buffer.concat(chunks).toString('utf-8')
            zipfile.readEntry()
          })
        })
      })
      zipfile.on('end', () => resolve(files))
      zipfile.on('error', reject)
    })
  })
}
