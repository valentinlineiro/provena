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

type Check = readonly [field: string, ok: (v: unknown) => boolean]

const isString = (v: unknown): v is string => typeof v === 'string'
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every(isString)

function checks(v: Record<string, unknown>, spec: Check[]): string[] {
  return spec.filter(([field, ok]) => !ok(v[field])).map(([field]) => field)
}

function parseArray<T>(raw: unknown, file: string, spec: (v: Record<string, unknown>) => string[]): T[] {
  if (!Array.isArray(raw)) throw new Error(`${file} must be a YAML array`)
  return raw.map((item, i) => {
    if (!item || typeof item !== 'object') throw new Error(`${file}[${i}]: expected an object`)
    const bad = spec(item as Record<string, unknown>)
    if (bad.length > 0) throw new Error(`${file}[${i}]: invalid or missing field(s): ${bad.join(', ')}`)
    return item as T
  })
}

export function parsePerson(raw: unknown, file = 'person.yaml'): Person {
  if (!raw || typeof raw !== 'object') throw new Error(`${file}: expected an object`)
  const v = raw as Record<string, unknown>
  const bad = checks(v, [
    ['name', isString],
    ['urls', (x) => typeof x === 'object' && x !== null],
  ])
  if (bad.length > 0) throw new Error(`${file}: invalid or missing field(s): ${bad.join(', ')}`)
  return raw as Person
}

export function parseExperiences(raw: unknown, file = 'experience.yaml'): Experience[] {
  return parseArray<Experience>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['organization', isString],
      ['title', isString],
      ['start', isString],
      ['achievements', isStringArray],
      ['technologies', isStringArray],
      ['capabilityIds', isStringArray],
      ['evidenceIds', isStringArray],
    ]),
  )
}

export function parseProjects(raw: unknown, file = 'projects.yaml'): Project[] {
  return parseArray<Project>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['name', isString],
      ['description', isString],
      ['technologies', isStringArray],
      ['capabilityIds', isStringArray],
      ['evidenceIds', isStringArray],
    ]),
  )
}

export function parseEducation(raw: unknown, file = 'education.yaml'): Education[] {
  return parseArray<Education>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['institution', isString],
      ['degree', isString],
    ]),
  )
}

export function parsePublications(raw: unknown, file = 'publications.yaml'): Publication[] {
  return parseArray<Publication>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['title', isString],
      ['authors', isStringArray],
      ['capabilityIds', isStringArray],
      ['evidenceIds', isStringArray],
    ]),
  )
}

export function parseCertifications(raw: unknown, file = 'certifications.yaml'): Certification[] {
  return parseArray<Certification>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['name', isString],
      ['issuer', isString],
      ['evidenceIds', isStringArray],
    ]),
  )
}

export function parseRecommendations(raw: unknown, file = 'recommendations.yaml'): Recommendation[] {
  return parseArray<Recommendation>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['author', isString],
      ['relationship', isString],
      ['text', isString],
    ]),
  )
}

export function parseCapabilities(raw: unknown, file = 'capabilities.yaml'): Capability[] {
  return parseArray<Capability>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['name', isString],
      ['evidenceIds', isStringArray],
    ]),
  )
}

export function parseEvidence(raw: unknown, file = 'evidence.yaml'): Evidence[] {
  return parseArray<Evidence>(raw, file, (v) =>
    checks(v, [
      ['id', isString],
      ['type', isString],
      ['description', isString],
    ]),
  )
}
