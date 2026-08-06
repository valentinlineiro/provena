export interface Provenance {
  readonly source: 'linkedin' | 'manual'
  readonly importedAt?: string
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
  readonly provenance?: Provenance
}

export interface Capability {
  readonly id: string
  readonly name: string
  readonly signals?: readonly string[]
  readonly description?: string
  readonly evidenceIds: readonly string[]
  readonly provenance?: Provenance
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
  readonly provenance?: Provenance
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
  readonly provenance?: Provenance
}

export interface Education {
  readonly id: string
  readonly institution: string
  readonly degree: string
  readonly field?: string
  readonly start?: string
  readonly end?: string
  readonly provenance?: Provenance
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
  readonly provenance?: Provenance
}

export interface Certification {
  readonly id: string
  readonly name: string
  readonly issuer: string
  readonly date?: string
  readonly expiry?: string
  readonly url?: string
  readonly evidenceIds: readonly string[]
  readonly provenance?: Provenance
}

export interface Recommendation {
  readonly id: string
  readonly author: string
  readonly relationship: string
  readonly text: string
  readonly date?: string
  readonly provenance?: Provenance
}

export interface Person {
  readonly name: string
  readonly email?: string
  readonly phone?: string
  readonly location?: string
  readonly title?: string
  readonly summary?: string
  readonly urls: Record<string, string>
  readonly provenance?: Provenance
}

export interface Capture {
  readonly id: string
  readonly content: string
  readonly createdAt: string
  readonly status: 'pending'
}

/**
 * @deprecated Use PreferenceSet from preference-set.ts instead.
 * Retained for YAML workspace compatibility during O2 migration.
 * Remove when the YAML loader and K5B consume PreferenceSet directly.
 */
export interface Preferences {
  readonly roles?: readonly string[]
  readonly work?: {
    readonly remote?: 'required' | 'hybrid' | 'optional'
  }
  readonly compensation?: {
    readonly minimum?: number
    readonly currency?: string
  }
  readonly avoid?: readonly string[]
  readonly interests?: readonly string[]
}

export type ScopeLevel =
  | 'individual'
  | 'team'
  | 'multi-team'
  | 'product'
  | 'organization'

export type ContributionRole =
  | 'initiator'
  | 'lead'
  | 'contributor'

export interface Scope {
  readonly level: ScopeLevel
  readonly affectedTeams?: number
  readonly role?: ContributionRole
}

export interface Outcome {
  readonly summary: string
}

export interface Contribution {
  readonly id: string
  readonly experienceRef: string
  readonly summary: string
  readonly period?: {
    readonly start: string
    readonly end?: string
  }
  readonly outcome?: Outcome
  readonly scope?: Scope
  readonly capabilityIds: readonly string[]
  readonly technologies?: readonly string[]
  readonly evidenceIds: readonly string[]
}

export interface Identity {
  readonly person: Person
  readonly experienceIds: readonly string[]
  readonly projectIds: readonly string[]
  readonly educationIds: readonly string[]
  readonly publicationIds: readonly string[]
  readonly certificationIds: readonly string[]
  readonly recommendationIds: readonly string[]
  readonly capabilityIds: readonly string[]
  readonly contributionIds?: readonly string[]
}

