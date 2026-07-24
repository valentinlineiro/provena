import type {
  Identity,
  Experience,
  Project,
  Education,
  Publication,
  Certification,
  Recommendation,
  Capability,
  Evidence,
} from './types.js'

export interface ValidationError {
  path: string
  message: string
  source?: string
}

type Identifiable = { id: string }

function sourceFromPath(path: string): string | undefined {
  if (path.startsWith('identity.')) return 'provena.yaml'
  if (path.startsWith('experience')) return 'experience.yaml'
  if (path.startsWith('project')) return 'projects.yaml'
  if (path.startsWith('education')) return 'education.yaml'
  if (path.startsWith('publication')) return 'publications.yaml'
  if (path.startsWith('certification')) return 'certifications.yaml'
  if (path.startsWith('capabilities')) return 'capabilities.yaml'
  return undefined
}

function collectIds(items: readonly Identifiable[]): Set<string> {
  return new Set(items.map((i) => i.id))
}

function findMissing(
  label: string,
  ids: readonly string[],
  knownIds: Set<string>,
  errors: ValidationError[],
): void {
  const source = sourceFromPath(label)
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push({ path: label, message: `Reference to unknown id "${id}"`, source })
    }
  }
}

function findDuplicates(label: string, items: readonly Identifiable[], errors: ValidationError[]): void {
  const source = sourceFromPath(label)
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) {
      errors.push({ path: label, message: `Duplicate id "${item.id}"`, source })
    }
    seen.add(item.id)
  }
}

export function validate(data: {
  identity: Identity
  experiences?: readonly Experience[]
  projects?: readonly Project[]
  education?: readonly Education[]
  publications?: readonly Publication[]
  certifications?: readonly Certification[]
  recommendations?: readonly Recommendation[]
  capabilities?: readonly Capability[]
  evidence?: readonly Evidence[]
}): ValidationError[] {
  const errors: ValidationError[] = []

  const allCapabilities = data.capabilities ?? []
  const allEvidence = data.evidence ?? []
  const allExperiences = data.experiences ?? []
  const allProjects = data.projects ?? []
  const allEducation = data.education ?? []
  const allPublications = data.publications ?? []
  const allCertifications = data.certifications ?? []
  const allRecommendations = data.recommendations ?? []

  findDuplicates('capabilities', allCapabilities, errors)
  findDuplicates('evidence', allEvidence, errors)
  findDuplicates('experiences', allExperiences, errors)
  findDuplicates('projects', allProjects, errors)
  findDuplicates('education', allEducation, errors)
  findDuplicates('publications', allPublications, errors)
  findDuplicates('certifications', allCertifications, errors)
  findDuplicates('recommendations', allRecommendations, errors)

  const capabilityIds = collectIds(allCapabilities)
  const evidenceIds = collectIds(allEvidence)
  const experienceIds = collectIds(allExperiences)
  const projectIds = collectIds(allProjects)
  const educationIds = collectIds(allEducation)
  const publicationIds = collectIds(allPublications)
  const certificationIds = collectIds(allCertifications)
  const recommendationIds = collectIds(allRecommendations)

  findMissing('identity.experienceIds', data.identity.experienceIds, experienceIds, errors)
  findMissing('identity.projectIds', data.identity.projectIds, projectIds, errors)
  findMissing('identity.educationIds', data.identity.educationIds, educationIds, errors)
  findMissing('identity.publicationIds', data.identity.publicationIds, publicationIds, errors)
  findMissing('identity.certificationIds', data.identity.certificationIds, certificationIds, errors)
  findMissing('identity.recommendationIds', data.identity.recommendationIds, recommendationIds, errors)
  findMissing('identity.capabilityIds', data.identity.capabilityIds, capabilityIds, errors)

  if (!data.identity.person.name || data.identity.person.name.trim() === '') {
    errors.push({
      path: 'identity.person',
      message: 'Field "name" is required',
      source: 'person.yaml',
    })
  }

  for (const exp of allExperiences) {
    findMissing(`experience.${exp.id}.capabilityIds`, exp.capabilityIds, capabilityIds, errors)
    findMissing(`experience.${exp.id}.evidenceIds`, exp.evidenceIds, evidenceIds, errors)
  }

  for (const proj of allProjects) {
    findMissing(`project.${proj.id}.capabilityIds`, proj.capabilityIds, capabilityIds, errors)
    findMissing(`project.${proj.id}.evidenceIds`, proj.evidenceIds, evidenceIds, errors)
  }

  for (const pub of allPublications) {
    findMissing(`publication.${pub.id}.capabilityIds`, pub.capabilityIds, capabilityIds, errors)
    findMissing(`publication.${pub.id}.evidenceIds`, pub.evidenceIds, evidenceIds, errors)
  }

  for (const cert of allCertifications) {
    findMissing(`certification.${cert.id}.evidenceIds`, cert.evidenceIds, evidenceIds, errors)
  }

  return errors
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map((e) => {
    const file = e.source ? ` [${e.source}]` : ''
    return `  ${e.path}${file}: ${e.message}`
  }).join('\n')
}
