import type { Profile } from './profile.js'
import type {
  ResumeExperience,
  ResumeProject,
} from './projections.js'
import type { Education, Certification } from './types.js'
import { buildResumeModel } from './projections.js'
import { deriveStrengths } from './career.js'

export interface DecisionContext {
  targetRole?: string
  audience?: 'recruiter' | 'hiring-manager'
  emphasize?: readonly string[]
  omit?: readonly string[]
}

export interface CVContext extends DecisionContext {
  includeExperienceIds?: readonly string[]
  excludeExperienceIds?: readonly string[]
  generateSummary?: boolean
}

// R8 — the projection carries an explicit budget. The budget forces
// selection; the Profile holds the whole history, the CV does not have it all.
export interface CvBudget {
  readonly maxCoreExpertise: number
  readonly maxTechnologies: number
  readonly maxCertifications: number
  readonly maxBulletsPerExperience: number
}

export const DEFAULT_CV_BUDGET: CvBudget = {
  maxCoreExpertise: 5,
  maxTechnologies: 8,
  maxCertifications: 6,
  maxBulletsPerExperience: 4,
}

// R10 — the renderer receives a flat, already-editorialised projection.
// It never reasons, selects, filters or compresses; it only serialises.
export interface CVProjection {
  readonly identity: CvIdentity
  readonly headline: string
  readonly summary: string
  readonly expertise: string[]
  readonly technologies: string[]
  readonly experiences: CvExperience[]
  readonly projects: CvProject[]
  readonly education: CvEducation[]
  readonly certifications: CvCertification[]
}

export interface CvIdentity {
  readonly name: string
  readonly headline: string
  readonly email?: string
  readonly location?: string
  readonly urls: Record<string, string>
}

export interface CvExperience {
  readonly organization: string
  readonly title: string
  readonly start: string
  readonly end?: string
  readonly summary?: string
  readonly achievements: readonly string[]
  readonly technologies: readonly string[]
}

export interface CvProject {
  readonly name: string
  readonly role?: string
  readonly description: string
  readonly url?: string
  readonly technologies: readonly string[]
}

export interface CvEducation {
  readonly institution: string
  readonly degree: string
  readonly field?: string
  readonly start?: string
  readonly end?: string
}

export interface CvCertification {
  readonly name: string
  readonly issuer: string
  readonly date?: string
  readonly url?: string
}

// R3 — evidence-over-claim taxonomy, strongest to weakest.
// Deterministic, falsifiable; classifies only what is observable in the
// Profile's achievement text. It never infers semantic quality.
export enum EvidenceClass {
  Quantified = 5,       // measured outcome, contains a number (%) or magnitude
  Adopted = 4,          // externally validated / adopted / referenced
  Artifact = 3,         // concrete delivered artifact or change
  Owned = 2,            // responsibility / ownership
  Generic = 1,          // generic claim
}

const QUANTIFIED = /(?:\d[\d.,]*\s*(?:%|million|k|ms|x|times|fold))|(?:by\s+\d+)/
const ADOPTED = /adopted|adoption|externally validated|referenced by|the foundation for|used by (?:other|another|a separate)|selected by|accepted by|shipped to production for/
const ARTIFACT = /built|designed|created|developed|delivered|implemented|shipped|launched|deployed|auto-mated|wrote|constructed|architected|introduced|rolled out/
const OWNED = /led|own|ownership|drove|drove|managed|mentored|responsible for|ran|spearheaded/

// ponytail: marker regexes, order matters — quantified wins over any wording.
export function classifyEvidence(achievement: string): EvidenceClass {
  const t = achievement.toLowerCase()
  if (QUANTIFIED.test(t)) return EvidenceClass.Quantified
  if (ADOPTED.test(t)) return EvidenceClass.Adopted
  if (ARTIFACT.test(t)) return EvidenceClass.Artifact
  if (OWNED.test(t)) return EvidenceClass.Owned
  return EvidenceClass.Generic
}

// R3 — rank achievements by evidence strength with a stable sort: within the
// same evidence class the original (canonical Profile) order is preserved, so
// the budget cap removes from the weakest margin, not a blind slice(0, n).
export function rankAchievements(achievements: readonly string[]): string[] {
  const indexed = achievements.map((a, i) => ({ a, i }))
  indexed.sort((x, y) => {
    const diff = classifyEvidence(y.a).valueOf() - classifyEvidence(x.a).valueOf()
    return diff !== 0 ? diff : x.i - y.i
  })
  return indexed.map(e => e.a)
}

// R4 — semantic redundancy suppression primitives.
// Deterministic, token-based; never rewrites content, never infers meaning.
// A token set represents the observable signals of a claim.

const STOPWORDS = new Set([
  // en
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'was', 'were', 'are', 'had',
  'have', 'has', 'been', 'being', 'into', 'over', 'under', 'through', 'within',
  'using', 'used', 'toward', 'their', 'them', 'they', 'its', 'our', 'your', 'his',
  'her', 'its', 'not', 'but', 'which', 'who', 'whom', 'more', 'most', 'much', 'many',
  'all', 'any', 'each', 'every', 'some', 'than', 'also', 'across', 'along', 'about',
  'after', 'before', 'between', 'because', 'been', 'while', 'when', 'where', 'how',
  // es
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'y', 'o', 'a',
  'en', 'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'del', 'al', 'como',
  'desde', 'hasta', 'entre', 'sobre', 'también', 'más', 'menos', 'muy', 'fue',
  'era', 'son', 'ser', 'está', 'estar', 'han', 'ha', 'ya', 'lo', 'le', 'les',
  'me', 'mi', 'nos', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'mis',
  'durante', 'cada', 'todo', 'toda', 'todos', 'todas', 'algo', 'nada', 'allí',
  'aquí', 'entonces', 'porque', 'sino', 'aunque', 'pero', 'puede', 'poder',
  'deben', 'debe', 'cuando', 'donde', 'cual', 'cuales',
])

function normalizeToken(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function significantSignals(text: string): string[] {
  const seen = new Set<string>()
  for (const raw of text.split(/[^A-Za-zÁ-ÿ0-9]+/)) {
    const t = normalizeToken(raw)
    if (t.length < 3 || STOPWORDS.has(t) || /^\d+$/.test(t)) continue
    seen.add(t)
  }
  return [...seen]
}

function setIntersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): number {
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n
}

// Split a summary into its claims (sentences). Splitting gives the suppression
// sentence-granularity: a claim already communicated by the surviving bullets
// is suppressed, while a unique claim in the same summary survives.

// R4 — suppress the redundant sentences of a summary. A sentence is redundant
// when most of its signals are already covered by the context (the experience's
// own surviving bullets) and the sentence itself carries no material evidence
// (measured / adopted / artifact) beyond that coverage. Deterministic; never
// rewrites content, never dedupes whole fields. Order of survivors is intact.
export function redundantSummary(summary: string, contextSignals: readonly string[]): string {
  const ctx = new Set(contextSignals)
  return splitSlices(summary)
    .filter(s => {
      const signals = significantSignals(s)
      if (signals.length === 0) return false
      const cls = classifyEvidence(s)
      if (cls === EvidenceClass.Quantified || cls === EvidenceClass.Adopted) return true
      const covered = setIntersection(new Set(signals), ctx)
      return covered / signals.length < 0.5
    })
    .join(' ')
}

function splitSlices(summary: string): string[] {
  return summary
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function autoSummary(profile: Profile, targetRole: string): string {
  const names = deriveStrengths(profile).slice(0, 3).map(s => s.name)
  return targetRole + ' with proven strengths in ' + names.join(', ') + '.'
}

function expertiseFor(profile: Profile, _targetRole: string): string[] {
  const titleSegments = (profile.identity.person.title ?? '').split('|').map(s => s.trim()).filter(Boolean)
  return (profile.preferences?.interests?.length
    ? profile.preferences.interests
    : titleSegments.slice(1)).slice(0, DEFAULT_CV_BUDGET.maxCoreExpertise)
}

function technologiesFor(profile: Profile): string[] {
  const expertise = expertiseFor(profile, '')
  return deriveStrengths(profile)
    .map(s => s.name)
    .filter(t => !expertise.includes(t))
    .slice(0, DEFAULT_CV_BUDGET.maxTechnologies)
}

function mapCertifications(certs: readonly Certification[]): CvCertification[] {
  return certs.slice(0, DEFAULT_CV_BUDGET.maxCertifications).map(c => ({
    name: c.name,
    issuer: c.issuer,
    date: c.date,
    url: c.url,
  }))
}

export function buildCvProjection(profile: Profile, context: CVContext = {}): CVProjection {
  const allIds = profile.identity.experienceIds.filter(id => profile.experiences.some(e => e.id === id))
  const include = context.includeExperienceIds
  const selected = (include && include.length > 0 ? include.filter(id => allIds.includes(id)) : [...allIds])
    .filter(id => !(context.excludeExperienceIds ?? []).includes(id))

  const base = buildResumeModel(profile, {
    includeExperienceIds: selected,
    emphasize: context.emphasize,
    omit: context.omit,
  })

  const titleSegments = (profile.identity.person.title ?? '').split('|').map(s => s.trim()).filter(Boolean)
  const headline = context.targetRole ?? titleSegments[0] ?? 'Software Engineer'

  const hasExplicit = !!profile.identity.person.summary
  const generate = context.generateSummary === true || (!hasExplicit && !!context.targetRole)
  const summary = generate && context.targetRole ? autoSummary(profile, context.targetRole) : base.summary

  const projects = (context.audience === 'recruiter' ? [] : base.projects) as readonly ResumeProject[]

  // R3 — select before compress: rank by evidence strength (stable), then cap.
  // The budget removes from the weakest margin, never a blind positional slice.
  const cap = (list: readonly string[], max: number): string[] => list.slice(0, max)
  const capEvidence = (list: readonly string[], max: number): string[] =>
    cap(rankAchievements(list), max)

  return {
    identity: {
      name: base.name,
      headline,
      email: base.email,
      location: base.location,
      urls: base.urls,
    },
    headline,
    summary,
    expertise: cap(expertiseFor(profile, headline), DEFAULT_CV_BUDGET.maxCoreExpertise),
    technologies: cap(technologiesFor(profile), DEFAULT_CV_BUDGET.maxTechnologies),
    experiences: base.experiences.map((e: ResumeExperience) => {
      const achievements = capEvidence(e.achievements, DEFAULT_CV_BUDGET.maxBulletsPerExperience)
      // R4 — suppress an experience summary that only re-enunciates, in prose,
      // signals already carried by the experience's own surviving bullets.
      const bulletSignals = achievements.flatMap(significantSignals)
      const decoSummary = e.summary ? redundantSummary(e.summary, bulletSignals) : ''
      return {
        organization: e.organization,
        title: e.title,
        start: e.start,
        end: e.end,
        summary: decoSummary || undefined,
        achievements,
        technologies: e.technologies,
      }
    }),
    projects: projects.map((p: ResumeProject): CvProject => ({
      name: p.name,
      role: p.role,
      description: p.description,
      url: p.url,
      technologies: p.technologies,
    })),
    education: base.education.map((e: Education): CvEducation => ({
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      start: e.start,
      end: e.end,
    })),
    certifications: mapCertifications(base.certifications),
  }
}

export function cvProjector(profile: Profile, context: CVContext = {}): CVProjection {
  return buildCvProjection(profile, context)
}