import type { Person, Experience, Education, Project, Certification, Publication, Recommendation, Capability } from '@provena/core'
import { randomUUID } from 'node:crypto'

export interface ParsedCsvs {
  person: Person
  experiences: Experience[]
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  publications: Publication[]
  recommendations: Recommendation[]
  capabilities: Capability[]
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []
  const headers = lines[0]!.split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = values[i] ?? '' })
    return row
  })
}

export function parseProfileCsvs(files: Record<string, string>): ParsedCsvs {
  const now = new Date().toISOString()
  const provenance = { source: 'linkedin' as const, importedAt: now }

  // Person
  const profileRows = files['Profile.csv'] ? parseCsv(files['Profile.csv']) : []
  const profileRow = profileRows[0] ?? {}
  const person: Person = {
    name: `${profileRow['First Name'] ?? ''} ${profileRow['Last Name'] ?? ''}`.trim(),
    email: profileRow['Email'] || undefined,
    title: profileRow['Headline'] || undefined,
    summary: profileRow['Summary'] || undefined,
    urls: {},
    provenance,
  }

  // Experiences
  const experiences: Experience[] = (files['Positions.csv'] ? parseCsv(files['Positions.csv']) : []).map((row) => ({
    id: randomUUID(),
    organization: row['Company Name'] ?? '',
    title: row['Title'] ?? '',
    start: (row['Started On'] ?? '').slice(0, 7),
    end: (row['Finished On'] ?? '').slice(0, 7) || undefined,
    summary: row['Description'] || undefined,
    achievements: [],
    technologies: [],
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Education
  const education: Education[] = (files['Education.csv'] ? parseCsv(files['Education.csv']) : []).map((row) => ({
    id: randomUUID(),
    institution: row['School Name'] ?? row['Institution Name'] ?? '',
    degree: row['Degree Name'] ?? '',
    field: row['Field Of Study'] || undefined,
    start: (row['Started On'] ?? '').slice(0, 7) || undefined,
    end: (row['Finished On'] ?? '').slice(0, 7) || undefined,
    provenance,
  }))

  // Projects
  const projects: Project[] = (files['Projects.csv'] ? parseCsv(files['Projects.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Project Name'] ?? '',
    description: row['Description'] ?? '',
    url: row['Url'] || row['URL'] || undefined,
    start: undefined,
    end: undefined,
    technologies: [],
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Certifications
  const certifications: Certification[] = (files['Certifications.csv'] ? parseCsv(files['Certifications.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Name'] ?? row['Certification Name'] ?? '',
    issuer: row['Issuer'] ?? row['Authority'] ?? '',
    date: (row['Started On'] ?? '').slice(0, 7) || undefined,
    expiry: undefined,
    url: row['Url'] || row['URL'] || undefined,
    evidenceIds: [],
    provenance,
  }))

  // Publications
  const publications: Publication[] = (files['Publications.csv'] ? parseCsv(files['Publications.csv']) : []).map((row) => ({
    id: randomUUID(),
    title: row['Title'] ?? row['Publication Title'] ?? '',
    authors: (row['Authors'] ?? row['Author'] ?? '').split(',').map((a) => a.trim()).filter(Boolean),
    date: (row['Date'] ?? '').slice(0, 7) || undefined,
    url: row['Url'] || row['URL'] || undefined,
    doi: row['DOI'] || undefined,
    venue: undefined,
    capabilityIds: [],
    evidenceIds: [],
    provenance,
  }))

  // Recommendations
  const recommendations: Recommendation[] = (files['Recommendations_Received.csv'] ? parseCsv(files['Recommendations_Received.csv']) : []).map((row) => ({
    id: randomUUID(),
    author: row['Recommender Name'] ?? row['Author'] ?? '',
    relationship: row['Relationship'] ?? row['Position at Company'] ?? '',
    text: row['Recommendation Text'] ?? row['Text'] ?? '',
    date: (row['Date'] ?? '').slice(0, 7) || undefined,
    provenance,
  }))

  // Capabilities from Skills.csv
  const capabilities: Capability[] = (files['Skills.csv'] ? parseCsv(files['Skills.csv']) : []).map((row) => ({
    id: randomUUID(),
    name: row['Skill Name'] ?? row['Name'] ?? '',
    evidenceIds: [],
    provenance,
  })).filter((c) => c.name.length > 0)

  return { person, experiences, education, projects, certifications, publications, recommendations, capabilities }
}
