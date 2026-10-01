import type { Profile } from './profile.js'
import type { Experience } from './types.js'
import type { Projector } from './projections.js'
import { topTechnologies } from './projections.js'

export interface ApplicationKitModel {
  readonly fullName: string
  readonly email: string
  readonly phone: string
  readonly location: string
  readonly linkedinUrl: string
  readonly githubUrl: string
  readonly otherUrls: Readonly<Record<string, string>>
  readonly currentTitle: string
  readonly shortSummary: string
  readonly longSummary: string
  readonly technologies: readonly string[]
  readonly technologiesLine: string
  readonly experienceLines: readonly string[]
  readonly totalYearsExperience: number
  readonly languagesLine: string
  readonly workAuthorizationLine: string
  readonly salaryLine: string
  readonly noticePeriod: string
  readonly remotePreference: string
}

const SHORT_SUMMARY_LIMIT = 280

const LANGUAGE_NAMES: Readonly<Record<string, string>> = {
  es: 'Spanish',
  en: 'English',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
}

function truncateAtWord(text: string, limit: number): string {
  if (text.length <= limit) return text
  const cut = text.slice(0, limit - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

function monthsBetween(start: string, end?: string): number {
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]
  if (!sy || !sm || !ey || !em) return 0
  return Math.max(0, (ey - sy) * 12 + (em - sm))
}

function formatPeriod(start: string, end?: string): string {
  return `${start} — ${end ?? 'Present'}`
}

export function buildApplicationKit(profile: Profile): ApplicationKitModel {
  const person = profile.identity.person
  const byId = new Map(profile.experiences.map((e) => [e.id, e]))
  const experiences: Experience[] = profile.identity.experienceIds
    .map((id) => byId.get(id))
    .filter((e): e is Experience => e !== undefined)

  const techs = topTechnologies(experiences)
  const totalMonths = experiences.reduce((sum, e) => sum + monthsBetween(e.start, e.end), 0)

  const ps = profile.preferenceSet
  const legacy = profile.preferences

  const languages = ps?.targets.languages ?? []
  const compensation = ps?.targets.compensation ?? (legacy?.compensation?.minimum
    ? { minimum: legacy.compensation.minimum, currency: (legacy.compensation.currency === '$' || legacy.compensation.currency === 'USD' ? 'USD' : 'EUR') as 'EUR' | 'USD' }
    : undefined)
  const workModes = ps?.targets.workModes ?? []
  const requiredRemote = workModes.find((w) => w.mode === 'remote' && w.strength === 'required')
  const preferredRemote = workModes.find((w) => w.mode === 'remote')
  const visaRequired = ps?.constraints.visaSponsorshipRequired

  return {
    fullName: person.name,
    email: person.email ?? '',
    phone: person.phone ?? '',
    location: person.location ?? '',
    linkedinUrl: person.urls.linkedin ?? person.urls.linkedIn ?? '',
    githubUrl: person.urls.github ?? '',
    otherUrls: Object.fromEntries(
      Object.entries(person.urls).filter(([k]) => !['linkedin', 'linkedIn', 'github'].includes(k)),
    ),
    currentTitle: person.title ?? '',
    shortSummary: truncateAtWord(person.summary ?? '', SHORT_SUMMARY_LIMIT),
    longSummary: person.summary ?? '',
    technologies: techs,
    technologiesLine: techs.join(', '),
    experienceLines: experiences.map((e) => `${e.title} @ ${e.organization} (${formatPeriod(e.start, e.end)})`),
    totalYearsExperience: Math.round((totalMonths / 12) * 10) / 10,
    languagesLine: languages
      .map((l) => `${LANGUAGE_NAMES[l.code] ?? l.code} (${l.proficiency})`)
      .join(', '),
    workAuthorizationLine: visaRequired === true
      ? 'Requires visa sponsorship'
      : visaRequired === false ? 'No visa sponsorship required' : '',
    salaryLine: compensation
      ? `${compensation.currency} ${compensation.minimum.toLocaleString('en-US')}+ minimum`
      : '',
    noticePeriod: person.availability ?? '',
    remotePreference: requiredRemote
      ? 'Remote only'
      : preferredRemote ? 'Remote preferred' : legacy?.work?.remote === 'required' ? 'Remote only' : '',
  }
}

export const applicationKitProjector: Projector<ApplicationKitModel> = {
  project: (profile: Profile): ApplicationKitModel => buildApplicationKit(profile),
}
