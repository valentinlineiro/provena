export interface Metadata {
  readonly id: string
  readonly createdAt: string
  readonly updatedAt: string
  readonly version: number
}

export type EvidenceSource =
  | 'experience'
  | 'project'
  | 'publication'
  | 'recommendation'
  | 'talk'
  | 'certification'
  | 'award'

export interface Evidence {
  readonly id: string
  readonly type: EvidenceSource
  readonly description: string
  readonly url?: string
  readonly date?: string
}

export interface Capability {
  readonly id: string
  readonly name: string
  readonly description?: string
  readonly evidenceIds: readonly string[]
}

export interface Experience {
  readonly id: string
  readonly organization: string
  readonly title: string
  readonly start: string
  readonly end?: string
  readonly location?: string
  readonly summary?: string
  readonly achievements: readonly string[]
  readonly technologies: readonly string[]
  readonly capabilityIds: readonly string[]
  readonly evidenceIds: readonly string[]
}

export interface Project {
  readonly id: string
  readonly name: string
  readonly role?: string
  readonly description: string
  readonly url?: string
  readonly start?: string
  readonly end?: string
  readonly technologies: readonly string[]
  readonly capabilityIds: readonly string[]
  readonly evidenceIds: readonly string[]
}

export interface Education {
  readonly id: string
  readonly institution: string
  readonly degree: string
  readonly field?: string
  readonly start?: string
  readonly end?: string
}

export interface Publication {
  readonly id: string
  readonly title: string
  readonly authors: readonly string[]
  readonly venue?: string
  readonly date?: string
  readonly url?: string
  readonly doi?: string
  readonly capabilityIds: readonly string[]
  readonly evidenceIds: readonly string[]
}

export interface Certification {
  readonly id: string
  readonly name: string
  readonly issuer: string
  readonly date?: string
  readonly expiry?: string
  readonly url?: string
  readonly evidenceIds: readonly string[]
}

export interface Recommendation {
  readonly id: string
  readonly author: string
  readonly relationship: string
  readonly text: string
  readonly date?: string
}

export interface Person {
  readonly name: string
  readonly email?: string
  readonly phone?: string
  readonly location?: string
  readonly title?: string
  readonly summary?: string
  readonly urls: Record<string, string>
}

export interface Identity {
  readonly person: Person
  readonly metadata: Metadata
  readonly experienceIds: readonly string[]
  readonly projectIds: readonly string[]
  readonly educationIds: readonly string[]
  readonly publicationIds: readonly string[]
  readonly certificationIds: readonly string[]
  readonly recommendationIds: readonly string[]
  readonly capabilityIds: readonly string[]
}
