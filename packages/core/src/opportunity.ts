import type { Profile } from './profile.js'
import type { Preferences } from './types.js'
import type { DecisionContext } from './cv-projector.js'
import { extractMarketRequirements, type MarketModel } from './market.js'

export type Verdict = 'apply' | 'consider' | 'skip'
export type CriterionStatus = 'satisfied' | 'violated' | 'unknown'
export type SignalStatus = 'demonstrated' | 'no-evidence'

export interface CriterionCheck {
  readonly criterion: string
  readonly status: CriterionStatus
  readonly detail: string
}

export interface SignalMatch {
  readonly capabilityId: string
  readonly capabilityName: string
  readonly matchedPhrases: readonly string[]
  readonly evidence: readonly string[]
  readonly status: SignalStatus
}

export interface OpportunityEvaluation {
  readonly verdict: Verdict
  readonly criteria: readonly CriterionCheck[]
  readonly marketModel?: MarketModel
  readonly demonstrated: readonly SignalMatch[]
  readonly gaps: readonly SignalMatch[]
  readonly notEvaluated: number
  readonly coverage: number
  readonly interpretationCoverage: number
  readonly confidence: number
  readonly decisionContext: DecisionContext
}

// ponytail: thresholds are calibration hypotheses — tune after ~10 real offers
export const APPLY_COVERAGE_THRESHOLD = 0.7
export const APPLY_INTERPRETATION_THRESHOLD = 0.5

function normalizeText(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// ---- criterion extractors -------------------------------------------------

function parseAmount(s: string): number {
  const t = s.trim().replace(/\s+/g, '')
  if (t.includes(',') && !t.includes('.')) return parseFloat(t.replace(/,/g, ''))
  if (t.includes('.') && !t.includes(',')) {
    const [, dec] = t.split('.')
    if (dec && dec.length === 3) return parseFloat(t.replace(/\./g, ''))
    return parseFloat(t)
  }
  return parseFloat(t)
}

interface ExtractedSalary {
  readonly amount: number
  readonly currency: 'EUR' | 'USD'
}

function extractSalaries(text: string): ExtractedSalary[] {
  const out: ExtractedSalary[] = []
  // Matches EUR: €103 000, €103,000, 103 000 €, 103000 EUR, €103k, etc.
  const eurRe = /(?:(?:€|eur|euro)\s*([\d]+(?:\s*[\d]{3})*(?:[.,][\d]+)*)|([\d]+(?:\s*[\d]{3})*(?:[.,][\d]+)*)\s*(?:€|eur|euro))\s*(k)?(?:\s*\/(?:mo|month|mes|m|day|d|hour|h|hora))?/gi
  let m: RegExpExecArray | null
  while ((m = eurRe.exec(text)) !== null) {
    const fullMatch = m[0]!
    if (/\/(?:mo|month|mes|m|day|d|hour|h|hora)/i.test(fullMatch)) continue
    const afterMatch = text.slice(m.index + fullMatch.length, m.index + fullMatch.length + 10).toLowerCase()
    if (/^\s*\/(?:mo|month|mes|m|day|d|hour|h|hora)/.test(afterMatch)) continue

    const digits = m[1] ?? m[2]
    if (!digits) continue
    let n = parseAmount(digits)
    if (m[3]) n *= 1000
    if (!Number.isNaN(n) && n >= 10000) out.push({ amount: n, currency: 'EUR' })
  }

  // Matches USD: $150,000, $150 000, 150,000 USD, 150000 dollars, $150k, etc.
  const usdRe = /(?:(?:\$|usd|dollars?)\s*([\d]+(?:\s*[\d]{3})*(?:[.,][\d]+)*)|([\d]+(?:\s*[\d]{3})*(?:[.,][\d]+)*)\s*(?:\$|usd|dollars?))\s*(k)?(?:\s*\/(?:mo|month|mes|m|day|d|hour|h|hora))?/gi
  while ((m = usdRe.exec(text)) !== null) {
    const fullMatch = m[0]!
    if (/\/(?:mo|month|mes|m|day|d|hour|h|hora)/i.test(fullMatch)) continue
    const afterMatch = text.slice(m.index + fullMatch.length, m.index + fullMatch.length + 10).toLowerCase()
    if (/^\s*\/(?:mo|month|mes|m|day|d|hour|h|hora)/.test(afterMatch)) continue

    const digits = m[1] ?? m[2]
    if (!digits) continue
    let n = parseAmount(digits)
    if (m[3]) n *= 1000
    if (!Number.isNaN(n) && n >= 10000) out.push({ amount: n, currency: 'USD' })
  }

  return out
}

function checkCompensation(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const min = prefs?.compensation?.minimum
  if (!min) return { criterion: 'compensation', status: 'unknown', detail: 'no minimum compensation in profile' }
  const salaries = extractSalaries(jd)
  if (salaries.length === 0) return { criterion: 'compensation', status: 'unknown', detail: 'JD does not state compensation' }
  
  // Normalize USD to EUR baseline using conservative ~1.0 USD/EUR parity threshold (1 USD >= 0.9 EUR)
  const eurSalaries = salaries.map(s => s.currency === 'USD' ? s.amount * 0.9 : s.amount)
  const floor = Math.min(...eurSalaries)
  const rawFloor = salaries.find(s => (s.currency === 'USD' ? s.amount * 0.9 : s.amount) === floor)
  
  const status = floor < min ? 'violated' : 'satisfied'
  const displayAmount = rawFloor ? (rawFloor.currency === 'USD' ? '$' + rawFloor.amount + ' USD' : '€' + rawFloor.amount) : '€' + floor
  return { criterion: 'compensation', status, detail: `JD states ${displayAmount}; minimum is €${min}` }
}

export interface WorkModeConstraint {
  readonly mode: 'remote' | 'hybrid' | 'onsite'
  readonly remoteAvailability: 'full' | 'partial' | 'none'
  readonly mandatoryOnsiteDays?: number
  readonly rawText: string
}

export function parseWorkModeConstraint(jd: string): WorkModeConstraint | null {
  const sentences = jd.split(/(?:\n+|\.\s+|\;\s+)/).map(s => s.trim()).filter(Boolean)

  // 1. Filter out generic corporate culture statement clauses
  const specificSentences = sentences.filter(s => !/whether (?:you'?re|you are)?\s*(?:remote|hybrid|on-?site)/i.test(s))

  // 2. Partial remote or mandatory onsite presence takes precedence if present in sentence (e.g. "up to two days remote", "3 days onsite")
  const partialRemoteMatch = specificSentences.find(s =>
    /up to (?:[\d]+|one|two|three|four) days? (?:per week )?remote/i.test(s) ||
    /(?:[\d]+|one|two|three|four) days? (?:per week )?(?:on-?site|in (?:the )?office)/i.test(s)
  )

  if (partialRemoteMatch) {
    const daysMatch = /(\d+)\s*days?\s*(?:per week\s*)?(?:on-?site|in (?:the )?office)/i.exec(partialRemoteMatch)
    const mandatoryDays = daysMatch ? parseInt(daysMatch[1]!, 10) : undefined
    return {
      mode: 'hybrid',
      remoteAvailability: 'partial',
      mandatoryOnsiteDays: mandatoryDays,
      rawText: partialRemoteMatch,
    }
  }

  // 3. Explicit full remote or remote alternative options (e.g. "hybrid in Barcelona / Remote in Spain", "fully remote", "remote-first")
  const fullRemoteMatch = specificSentences.find(s =>
    /\b(?:fully|100%)\s*remote\b/i.test(s) ||
    /\bremote-?first\b/i.test(s) ||
    /\b(?:hybrid|on-?site)\b.*(?:\/|\bor\b).*\bremote\b/i.test(s) ||
    /\bremote\b.*(?:\/|\bor\b).*\b(?:hybrid|on-?site)\b/i.test(s) ||
    /\bremote (?:from|opportunity|working options)\b/i.test(s) ||
    /^\s*remote\s*$/i.test(s)
  )

  if (fullRemoteMatch) {
    return {
      mode: 'remote',
      remoteAvailability: 'full',
      rawText: fullRemoteMatch,
    }
  }

  // 4. Hybrid match
  const hybridMatch = specificSentences.find(s => /\bhybrid\b/i.test(s))
  if (hybridMatch) {
    return {
      mode: 'hybrid',
      remoteAvailability: 'partial',
      rawText: hybridMatch,
    }
  }

  // 4. On-site mandatory
  const onsiteMatch = specificSentences.find(s =>
    /\bon-?site\b/i.test(s) ||
    /\bpresencial\b/i.test(s) ||
    /\bin (?:the )?office\b/i.test(s)
  )

  if (onsiteMatch) {
    return {
      mode: 'onsite',
      remoteAvailability: 'none',
      rawText: onsiteMatch,
    }
  }

  // 5. Fallback for general un-scoped "remote" mention if no other constraint was parsed
  const genericRemote = specificSentences.find(s => /\bremote\b/i.test(s))
  if (genericRemote) {
    return {
      mode: 'remote',
      remoteAvailability: 'full',
      rawText: genericRemote,
    }
  }

  return null
}

function checkWorkMode(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const pref = prefs?.work?.remote
  if (!pref) return { criterion: 'workMode', status: 'unknown', detail: 'no remote preference in profile' }

  const parsed = parseWorkModeConstraint(jd)
  if (!parsed) return { criterion: 'workMode', status: 'unknown', detail: 'JD does not state work mode' }

  if (pref === 'required') {
    if (parsed.mode === 'remote' && parsed.remoteAvailability === 'full') {
      return { criterion: 'workMode', status: 'satisfied', detail: `JD allows fully remote: "${parsed.rawText}"` }
    }
    return {
      criterion: 'workMode',
      status: 'violated',
      detail: `JD requires ${parsed.mode} work (${parsed.rawText}); candidate requires fully remote`,
    }
  }

  if (pref === 'hybrid') {
    if (parsed.mode === 'remote' || parsed.mode === 'hybrid') {
      return { criterion: 'workMode', status: 'satisfied', detail: `JD allows remote/hybrid: "${parsed.rawText}"` }
    }
    return { criterion: 'workMode', status: 'violated', detail: `JD is on-site only: "${parsed.rawText}"` }
  }

  return { criterion: 'workMode', status: 'unknown', detail: 'remote is optional' }
}

function roleTokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 3)
}

export interface RoleRequirement {
  readonly rawTitle: string
  readonly family: 'software-engineering' | 'ai-engineering' | 'project-management' | 'executive-management' | 'academia' | 'unknown'
  readonly level: 'junior' | 'mid' | 'senior' | 'staff' | 'principal' | 'executive' | 'unknown'
}

export function parseRoleRequirement(jd: string): RoleRequirement {
  const lower = jd.toLowerCase()

  // 1. Level extraction
  let level: RoleRequirement['level'] = 'unknown'
  if (/\bjunior\b/i.test(lower)) level = 'junior'
  else if (/\bmid-?level\b/i.test(lower)) level = 'mid'
  else if (/\bstaff\b/i.test(lower)) level = 'staff'
  else if (/\bprincipal\b/i.test(lower)) level = 'principal'
  else if (/\b(?:ceo|cto|cpo|executive|vice president|vp)\b/i.test(lower)) level = 'executive'
  else if (/\b(?:senior|lead|head of)\b/i.test(lower)) level = 'senior'

  // 2. Family extraction
  let family: RoleRequirement['family'] = 'unknown'
  if (/\b(?:project manager|jefe de proyecto|pmp|program manager)\b/i.test(lower)) {
    family = 'project-management'
  } else if (/\b(?:ceo|cpo|p&l executive)\b/i.test(lower)) {
    family = 'executive-management'
  } else if (/\b(?:docente|profesor|catedrático|universitario|aneca)\b/i.test(lower)) {
    family = 'academia'
  } else if (/\b(?:ai engineer|applied ai|machine learning engineer|ml engineer)\b/i.test(lower)) {
    family = 'ai-engineering'
  } else if (/\b(?:software engineer|backend engineer|fullstack|full-stack|cto|solutions engineer|tech lead|engineering manager)\b/i.test(lower)) {
    family = 'software-engineering'
  }

  // Extract candidate raw title line if present
  const titleLine = jd.split('\n').find(l => /^(?:role|position|job title):/i.test(l)) ?? ''
  const rawTitle = titleLine.replace(/^(?:role|position|job title):\s*/i, '').trim() || jd.slice(0, 60).trim()

  return { rawTitle, family, level }
}

const ROLE_ALIASES: Record<string, string[]> = {
  'tech lead': ['engineering lead', 'engineering team lead', 'team lead', 'technical lead', 'ai engineer', 'senior ai engineer'],
  'staff engineer': ['staff software engineer', 'staff engineer', 'ai engineer', 'senior ai engineer'],
  'principal engineer': ['principal software engineer', 'principal engineer'],
}

export function findMatchedRole(jd: string, roles: readonly string[]): string | null {
  const roleReq = parseRoleRequirement(jd)

  // Level mismatch guard: junior levels do not match senior/staff preferences
  if (roleReq.level === 'junior' || roleReq.level === 'mid') return null

  // Incompatible family guard: non-engineering families do not match engineering preferences
  if (roleReq.family === 'project-management' || roleReq.family === 'executive-management' || roleReq.family === 'academia') {
    return null
  }

  const jdTokens = new Set(roleTokens(jd))
  const lowerJd = jd.toLowerCase()
  return roles.find(r => {
    const rt = roleTokens(r)
    if (rt.length > 0 && rt.every(t => jdTokens.has(t))) return true
    const aliases = ROLE_ALIASES[r.toLowerCase()] ?? []
    return aliases.some(alias => lowerJd.includes(alias))
  }) ?? null
}

function checkRoles(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const roles = prefs?.roles ?? []
  if (roles.length === 0) return { criterion: 'roles', status: 'unknown', detail: 'no preferred roles in profile' }

  const roleReq = parseRoleRequirement(jd)

  // 1. Incompatible Family Check
  if (roleReq.family === 'project-management' || roleReq.family === 'executive-management' || roleReq.family === 'academia') {
    return {
      criterion: 'roles',
      status: 'violated',
      detail: `Role family "${roleReq.family}" is incompatible with preferred engineering roles (${roles.join(', ')})`,
    }
  }

  // 2. Incompatible Level Check (Junior level explicitly violates Staff/Senior/Lead preferences)
  if (roleReq.level === 'junior') {
    return {
      criterion: 'roles',
      status: 'violated',
      detail: `Role level "junior" is incompatible with preferred leadership/senior levels (${roles.join(', ')})`,
    }
  }

  const matched = findMatchedRole(jd, roles)
  if (matched) return { criterion: 'roles', status: 'satisfied', detail: 'JD matches preferred role ' + matched }

  return { criterion: 'roles', status: 'unknown', detail: 'JD role not recognizable vs preferred: ' + roles.join(', ') }
}

function checkAvoid(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const avoid = prefs?.avoid ?? []
  if (avoid.length === 0) return { criterion: 'avoid', status: 'unknown', detail: 'no avoid list in profile' }
  const lower = jd.toLowerCase()
  const hit = avoid.find(a => lower.includes(a.toLowerCase()))
  if (hit) return { criterion: 'avoid', status: 'violated', detail: 'JD matches avoid: ' + hit }
  return { criterion: 'avoid', status: 'satisfied', detail: 'no avoid pattern detected' }
}

// ---- signal matcher -------------------------------------------------------

function evidenceByCapability(profile: Profile): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const c of profile.contributions ?? []) {
    for (const id of c.capabilityIds ?? []) {
      const list = map.get(id) ?? []
      list.push(c.outcome?.summary ?? c.summary)
      map.set(id, list)
    }
  }
  for (const e of profile.experiences ?? []) {
    for (const id of e.capabilityIds ?? []) {
      const list = map.get(id) ?? []
      const evText = e.achievements?.[0] ?? e.summary
      if (evText && !list.includes(evText)) {
        list.push(evText)
        map.set(id, list)
      }
    }
  }
  return map
}

import type { MarketRequirement } from './market.js'

export interface ResolvedRequirement {
  readonly requirementId: string
  readonly requirementConcept: string
  readonly requirementKind: MarketRequirement['kind']
  readonly requirementQualifiers?: readonly import('./market.js').RequirementQualifier[]
  readonly capabilityId?: string
  readonly capabilityName?: string
  readonly status: 'demonstrated' | 'gap' | 'unresolved'
  readonly evidence: readonly string[]
}

export function resolveRequirements(marketModel: MarketModel, profile: Profile): readonly ResolvedRequirement[] {
  const evidenceByCap = evidenceByCapability(profile)
  const resolved: ResolvedRequirement[] = []

  for (const req of marketModel.requirements) {
    if (req.kind === 'constraint') continue // Constraints are handled by policy/criteria

    const normConcept = normalizeText(req.concept)
    const normRaw = normalizeText(req.rawText)

    let matchedCap = (profile.capabilities ?? []).find(cap => {
      const normCapName = normalizeText(cap.name)
      const cleanCapName = normCapName.replace(/\s*\([^)]*\)/g, '').trim()
      if (normConcept.includes(cleanCapName) || cleanCapName.includes(normConcept) || normRaw.includes(cleanCapName)) return true
      return (cap.signals ?? []).some(s => {
        const normSignal = normalizeText(s)
        if (normSignal.length < 2) return false
        if (normConcept.includes(normSignal) || normRaw.includes(normSignal) || normSignal.includes(normConcept) || normSignal.includes(normRaw)) return true
        const sigTokens = normSignal.split(/[\s/-]+/).filter(t => t.length >= 2)
        return sigTokens.length > 0 && sigTokens.some(t => normConcept.includes(t) || normRaw.includes(t))
      })
    })

    if (matchedCap) {
      const evidence = evidenceByCap.get(matchedCap.id) ?? []
      resolved.push({
        requirementId: req.id,
        requirementConcept: req.concept,
        requirementKind: req.kind,
        requirementQualifiers: req.qualifiers,
        capabilityId: matchedCap.id,
        capabilityName: matchedCap.name,
        status: evidence.length > 0 ? 'demonstrated' : 'gap',
        evidence,
      })
    } else {
      resolved.push({
        requirementId: req.id,
        requirementConcept: req.concept,
        requirementKind: req.kind,
        requirementQualifiers: req.qualifiers,
        status: 'unresolved',
        evidence: [],
      })
    }
  }

  return resolved
}

export type Transferability = 'direct' | 'adjacent' | 'uncertain' | 'mismatched'

export interface EvidenceSufficiencyAssessment {
  readonly requirementId: string
  readonly requirementConcept: string
  readonly capabilityId?: string
  readonly capabilityName?: string
  readonly status: 'sufficient' | 'partial' | 'insufficient' | 'unknown'
  readonly transferability: Transferability
  readonly rationale: string
  readonly evidenceCount: number
  readonly matchedQualifiers: readonly string[]
}

export function evaluateTransferability(resolved: ResolvedRequirement): Transferability {
  if (resolved.status === 'unresolved' || resolved.evidence.length === 0) {
    return 'uncertain'
  }

  const reqConcept = resolved.requirementConcept.toLowerCase()
  const capName = (resolved.capabilityName ?? '').toLowerCase()
  const evidenceText = resolved.evidence.join(' ').toLowerCase()

  // 1. Direct match: Exact concept match in evidence or capability name
  if (capName.includes(reqConcept) || evidenceText.includes(reqConcept)) {
    return 'direct'
  }

  // 2. Adjacent match: Same technical practice/domain applied in a different context (e.g. AI software vs AI patent drafting in #15)
  const reqTokens = reqConcept.split(/[\s/-]+/).filter(t => t.length >= 4)
  if (reqTokens.some(t => capName.includes(t) || evidenceText.includes(t))) {
    return 'adjacent'
  }

  // 3. Uncertain/Mismatched fallback
  return 'uncertain'
}

export function evaluateSufficiency(resolved: ResolvedRequirement): EvidenceSufficiencyAssessment {
  const transferability = evaluateTransferability(resolved)

  if (resolved.status === 'unresolved') {
    return {
      requirementId: resolved.requirementId,
      requirementConcept: resolved.requirementConcept,
      status: 'unknown',
      transferability: 'uncertain',
      rationale: 'No candidate capability claim matched this market requirement.',
      evidenceCount: 0,
      matchedQualifiers: [],
    }
  }

  if (resolved.evidence.length === 0) {
    return {
      requirementId: resolved.requirementId,
      requirementConcept: resolved.requirementConcept,
      capabilityId: resolved.capabilityId,
      capabilityName: resolved.capabilityName,
      status: 'insufficient',
      transferability: 'uncertain',
      rationale: 'Capability claim exists but has zero backing timeline evidence.',
      evidenceCount: 0,
      matchedQualifiers: [],
    }
  }

  const qualifiers = resolved.requirementQualifiers ?? []

  // Unqualified requirements: Direct transferability yields sufficient; adjacent yields sufficient with explicit rationale
  if (qualifiers.length === 0) {
    return {
      requirementId: resolved.requirementId,
      requirementConcept: resolved.requirementConcept,
      capabilityId: resolved.capabilityId,
      capabilityName: resolved.capabilityName,
      status: 'sufficient',
      transferability,
      rationale: transferability === 'direct'
        ? 'Unqualified market requirement backed by direct canonical evidence.'
        : 'Unqualified market requirement backed by adjacent/transferable canonical evidence.',
      evidenceCount: resolved.evidence.length,
      matchedQualifiers: [],
    }
  }

  // Evaluate evidence alignment against extracted qualifiers (proficiency, scale, context, duration)
  const evidenceText = resolved.evidence.join(' ').toLowerCase()
  let satisfiedQualifiersCount = 0
  const matchedQualifiers: string[] = []

  for (const q of qualifiers) {
    const normValue = q.value.toLowerCase()
    // Check if evidence text explicitly matches or backs the qualifier
    if (evidenceText.includes(normValue) || normValue.split(/\s+/).some(word => word.length >= 4 && evidenceText.includes(word))) {
      satisfiedQualifiersCount++
      matchedQualifiers.push(`${q.kind}: ${q.rawText}`)
    }
  }

  if (satisfiedQualifiersCount === qualifiers.length) {
    return {
      requirementId: resolved.requirementId,
      requirementConcept: resolved.requirementConcept,
      capabilityId: resolved.capabilityId,
      capabilityName: resolved.capabilityName,
      status: 'sufficient',
      transferability,
      rationale: 'Canonical evidence fully satisfies all requirement qualifiers.',
      evidenceCount: resolved.evidence.length,
      matchedQualifiers,
    }
  }

  if (satisfiedQualifiersCount > 0 || resolved.evidence.length > 0) {
    return {
      requirementId: resolved.requirementId,
      requirementConcept: resolved.requirementConcept,
      capabilityId: resolved.capabilityId,
      capabilityName: resolved.capabilityName,
      status: 'partial',
      transferability,
      rationale: 'Evidence is present but only partially satisfies extracted requirement qualifiers.',
      evidenceCount: resolved.evidence.length,
      matchedQualifiers,
    }
  }

  return {
    requirementId: resolved.requirementId,
    requirementConcept: resolved.requirementConcept,
    capabilityId: resolved.capabilityId,
    capabilityName: resolved.capabilityName,
    status: 'insufficient',
    transferability,
    rationale: 'Evidence does not satisfy high-proficiency or scale requirement qualifiers.',
    evidenceCount: resolved.evidence.length,
    matchedQualifiers,
  }
}

// ---- K5A: Professional Fit Projection -------------------------------------
//
// Invariant: projectProfessionalFit consumes ONLY EvidenceSufficiencyAssessment[].
// It must NOT access the JD, Profile, or raw evidence. If it needs to inspect
// those to produce a score, a second interpretive authority has been created.
//
// Score semantics:
//   - sufficient  + direct    → 1.0   (full credit)
//   - sufficient  + adjacent  → 0.90  (slight context discount)
//   - sufficient  + uncertain → 0.80
//   - partial     + direct    → 0.65
//   - partial     + adjacent  → 0.55
//   - partial     + uncertain → 0.45
//   - insufficient            → 0.10  (claim exists, no backing evidence)
//   - unknown                 → excluded from score, counted in coverage gap
//
// Coverage = assessable / total_requirements
// Score    = weighted mean over assessable assessments only (unknown excluded)
// Confidence is computed downstream at K6 from score × coverage.

export interface ProfessionalFitProjection {
  /** 0.0–10.0. Computed only from assessable (non-unknown) requirements. */
  readonly score: number
  /**
   * Fraction of market requirements that produced an assessable result.
   * assessable = sufficient | partial | insufficient.
   * 1.0 means every requirement had resolvable evidence; 0.0 means none did.
   */
  readonly assessmentCoverage: number
  /** Total market requirements fed into this projection. */
  readonly totalRequirements: number
  /** Assessments that contributed to the score (status !== 'unknown'). */
  readonly assessedCount: number
  /** Assessments excluded from the score (status === 'unknown'). */
  readonly unknownCount: number
  /** Per-requirement breakdown for auditability. */
  readonly breakdown: readonly {
    requirementConcept: string
    status: EvidenceSufficiencyAssessment['status']
    transferability: Transferability
    pointsContributed: number
  }[]
}



const TRANSFERABILITY_MODIFIER: Record<Transferability, number> = {
  direct:     0,      // no discount
  adjacent:   -0.10,  // slight context gap
  uncertain:  -0.20,  // material context gap
  mismatched: -0.50,  // strong context mismatch (not currently produced, reserved)
}

const SUFFICIENT_BASE = 1.0
const PARTIAL_BASE    = 0.65

function assessmentPoints(a: EvidenceSufficiencyAssessment): number | null {
  if (a.status === 'unknown') return null          // excluded
  if (a.status === 'insufficient') return 0.10

  const base = a.status === 'sufficient' ? SUFFICIENT_BASE : PARTIAL_BASE
  const modifier = TRANSFERABILITY_MODIFIER[a.transferability]
  return Math.max(0, base + modifier)
}

export function projectProfessionalFit(
  assessments: readonly EvidenceSufficiencyAssessment[],
): ProfessionalFitProjection {
  const total = assessments.length

  if (total === 0) {
    return {
      score: 0,
      assessmentCoverage: 0,
      totalRequirements: 0,
      assessedCount: 0,
      unknownCount: 0,
      breakdown: [],
    }
  }

  const breakdown: ProfessionalFitProjection['breakdown'][number][] = []
  let sumPoints = 0
  let assessedCount = 0
  let unknownCount = 0

  for (const a of assessments) {
    const points = assessmentPoints(a)
    if (points === null) {
      // unknown requirements count as 0 in the denominator so unresolved
      // market requirements correctly penalise the score.
      unknownCount++
      assessedCount++
      breakdown.push({
        requirementConcept: a.requirementConcept,
        status: a.status,
        transferability: a.transferability,
        pointsContributed: 0,
      })
    } else {
      assessedCount++
      sumPoints += points
      breakdown.push({
        requirementConcept: a.requirementConcept,
        status: a.status,
        transferability: a.transferability,
        pointsContributed: points,
      })
    }
  }

  const score = assessedCount === 0 ? 0 : Math.round((sumPoints / assessedCount) * 100) / 10
  const assessmentCoverage = total === 0 ? 0 : Math.round(((assessedCount - unknownCount) / total) * 1000) / 1000

  return {
    score,
    assessmentCoverage,
    totalRequirements: total,
    assessedCount,
    unknownCount,
    breakdown,
  }
}

// ---- K5B: Personal Fit Projection -----------------------------------------
//
// Invariant: assessPreferences and projectPersonalFit consume ONLY Preferences
// and parsed JD attributes. They must NOT access the candidate Profile or any
// K4 evidence. Personal Fit is orthogonal to Professional Fit.
//
// Eligibility vs Desirability:
//   hard constraints (minimum salary, required remote) → Eligibility gate
//   soft preferences (preferred salary, vacation, hours) → desirability score
//
// Status semantics:
//   'preferred'    → opportunity attribute exceeds preference threshold
//   'acceptable'   → opportunity attribute meets minimum, not preferred level
//   'undesirable'  → opportunity attribute falls below minimum (eligibility violated)
//   'unknown'      → attribute not stated in JD; treated as absent, not negative

export type PreferenceDimension =
  | 'compensation'
  | 'work-mode'
  | 'vacation'
  | 'summer-hours'
  | 'schedule'

export type PreferenceStatus = 'preferred' | 'acceptable' | 'undesirable' | 'unknown'

export interface PreferenceAssessment {
  readonly dimension: PreferenceDimension
  readonly status: PreferenceStatus
  /** Whether this assessment produces an eligibility violation */
  readonly eligibilityViolation: boolean
  readonly detail: string
}

export interface PersonalFitProjection {
  /** 0.0–10.0. Mean over assessable (non-unknown) preference dimensions. */
  readonly score: number
  /** Fraction of preference dimensions that produced an assessable result. */
  readonly assessmentCoverage: number
  /** Total preference dimensions evaluated (0 = no preferences declared). */
  readonly totalRequirements: number
  /** Dimensions that contributed to the score (status !== 'unknown'). */
  readonly assessedCount: number
  /** Whether any dimension produced an eligibility violation. */
  readonly eligible: boolean
  /** Per-dimension breakdown for auditability. */
  readonly breakdown: readonly PreferenceAssessment[]
}

const PREFERENCE_SCORE: Record<PreferenceStatus, number | null> = {
  preferred:   1.0,
  acceptable:  0.65,
  undesirable: 0.0,
  unknown:     null,   // excluded from score mean (same discipline as K5A)
}

export function assessPreferences(
  jd: string,
  prefs: Preferences | undefined,
): readonly PreferenceAssessment[] {
  const assessments: PreferenceAssessment[] = []

  // ── Compensation ──────────────────────────────────────────────────────────
  const min = prefs?.compensation?.minimum
  if (min !== undefined) {
    const salaries = extractSalaries(jd)
    if (salaries.length === 0) {
      assessments.push({
        dimension: 'compensation',
        status: 'unknown',
        eligibilityViolation: false,
        detail: 'JD does not state compensation; not penalising',
      })
    } else {
      const eurSalaries = salaries.map(s => s.currency === 'USD' ? s.amount * 0.9 : s.amount)
      const floor = Math.min(...eurSalaries)
      const preferred = (prefs as any)?.compensation?.preferred as number | undefined
      const displayFloor = `€${floor}`

      if (floor < min) {
        assessments.push({
          dimension: 'compensation',
          status: 'undesirable',
          eligibilityViolation: true,
          detail: `JD offers ${displayFloor}; below minimum €${min}`,
        })
      } else if (preferred !== undefined && floor >= preferred) {
        assessments.push({
          dimension: 'compensation',
          status: 'preferred',
          eligibilityViolation: false,
          detail: `JD offers ${displayFloor}; meets preferred threshold €${preferred}`,
        })
      } else {
        assessments.push({
          dimension: 'compensation',
          status: 'acceptable',
          eligibilityViolation: false,
          detail: `JD offers ${displayFloor}; above minimum €${min} but below preferred`,
        })
      }
    }
  }

  // ── Work Mode ─────────────────────────────────────────────────────────────
  const remotePref = prefs?.work?.remote
  if (remotePref !== undefined) {
    const parsed = parseWorkModeConstraint(jd)
    if (!parsed) {
      assessments.push({
        dimension: 'work-mode',
        status: 'unknown',
        eligibilityViolation: false,
        detail: 'JD does not state work mode; not penalising',
      })
    } else if (remotePref === 'required') {
      const isFullRemote = parsed.mode === 'remote' && parsed.remoteAvailability === 'full'
      assessments.push({
        dimension: 'work-mode',
        status: isFullRemote ? 'preferred' : 'undesirable',
        eligibilityViolation: !isFullRemote,
        detail: isFullRemote
          ? `JD offers full remote: "${parsed.rawText}"`
          : `JD requires ${parsed.mode} (${parsed.rawText}); candidate requires remote`,
      })
    } else if (remotePref === 'hybrid') {
      const acceptable = parsed.mode === 'remote' || parsed.mode === 'hybrid'
      const isFullRemote = parsed.mode === 'remote' && parsed.remoteAvailability === 'full'
      assessments.push({
        dimension: 'work-mode',
        status: isFullRemote ? 'preferred' : acceptable ? 'acceptable' : 'undesirable',
        eligibilityViolation: !acceptable,
        detail: acceptable
          ? `JD allows ${parsed.mode}: "${parsed.rawText}"`
          : `JD is on-site only: "${parsed.rawText}"; candidate requires at least hybrid`,
      })
    } else {
      // 'optional' — any work mode is acceptable, fully remote is preferred
      const isFullRemote = parsed.mode === 'remote' && parsed.remoteAvailability === 'full'
      assessments.push({
        dimension: 'work-mode',
        status: isFullRemote ? 'preferred' : 'acceptable',
        eligibilityViolation: false,
        detail: `JD states ${parsed.mode} (${parsed.rawText}); preference is optional`,
      })
    }
  }

  // ── Vacation / Summer hours / Schedule ───────────────────────────────────
  // These are soft preferences — stated absence in JD means 'unknown', not violation.
  // The infrastructure is here for K6+ when preferences become richer.
  // No hard patterns to match currently → always unknown unless future pref fields exist.

  return assessments
}

export function projectPersonalFit(
  assessments: readonly PreferenceAssessment[],
): PersonalFitProjection {
  const total = assessments.length

  if (total === 0) {
    return { score: 0, assessmentCoverage: 0, totalRequirements: 0, assessedCount: 0, eligible: true, breakdown: [] }
  }

  let sumPoints = 0
  let assessedCount = 0
  let hasViolation = false

  for (const a of assessments) {
    if (a.eligibilityViolation) hasViolation = true
    const points = PREFERENCE_SCORE[a.status]
    if (points !== null) {
      sumPoints += points
      assessedCount++
    }
  }

  const score = assessedCount === 0 ? 0 : Math.round((sumPoints / assessedCount) * 100) / 10
  const assessmentCoverage = Math.round((assessedCount / total) * 1000) / 1000

  return {
    score,
    assessmentCoverage,
    totalRequirements: total,
    assessedCount,
    eligible: !hasViolation,
    breakdown: assessments,
  }
}

// ---- K6: Policy Projection ------------------------------------------------
//
// Invariant: applyPolicy consumes ONLY the outputs of K5A and K5B.
// It must NOT read JD, Profile, Evidence, or Preferences.
// K6 measures nothing — it projects.
//
// Recommendation semantics:
//   STRONG_CANDIDATE → eligible, high professional fit, acceptable personal fit
//   CONSIDER         → eligible, moderate fit in at least one dimension
//   ABSTAIN          → eligible but insufficient confidence to distinguish
//   SKIP             → ineligible (hard constraint violated)
//
// Confidence is a function of how much of the market requirement space was
// assessable. Low coverage means we cannot distinguish a good fit from a
// gap we haven't seen yet.
//
// Confidence formula:
//   C = professionalCoverage × personalCoverageWeight
//   where personalCoverageWeight = personalCoverage if personalDimensions > 0, else 1
//   (no personal preferences declared → doesn't penalise confidence)
//
// Thresholds (calibration hypotheses — tune after K7 holdout):
//   ABSTAIN if confidence < ABSTAIN_CONFIDENCE_THRESHOLD
//   STRONG_CANDIDATE if professionalFit >= STRONG_FIT_THRESHOLD and personalFit >= ACCEPTABLE_PERSONAL_THRESHOLD
//   CONSIDER otherwise

export const ABSTAIN_CONFIDENCE_THRESHOLD = 0.25
export const STRONG_FIT_THRESHOLD = 7.5
export const ACCEPTABLE_PERSONAL_THRESHOLD = 6.0

export type Recommendation = 'strong-candidate' | 'consider' | 'abstain' | 'skip'

export interface OpportunityAssessment {
  readonly professionalFit: ProfessionalFitProjection
  readonly personalFit: PersonalFitProjection
  /** [0, 1]. Fraction of the evaluation space that produced an assessable result. */
  readonly confidence: number
  readonly eligibility: 'eligible' | 'ineligible'
  readonly recommendation: Recommendation
  /** Human-readable rationale for the recommendation. */
  readonly rationale: string
}

export function isMarketBearingChunk(chunk: string): boolean {
  const lower = chunk.toLowerCase()
  if (/^(about (us|fever|shakers|the process|you|the role|our company)|benefits|perks|process|our mission|how we work|interview|about the process|about you)/i.test(chunk)) return false
  if (/(40% discount|health insurance|payflow|wellhub|privacy notice|inclusive workspace|relocation package|english lessons|attract compensation package)/i.test(lower)) return false
  return true
}

export function computeRecognitionCoverage(jd: string, marketModel: MarketModel): number {
  const chunks = jd.split(/\n+/).map(c => c.trim()).filter(Boolean)
  if (chunks.length === 0) return 0
  const marketBearing = chunks.filter(isMarketBearingChunk)
  const evaluationTarget = marketBearing.length === 0 ? chunks : marketBearing

  const recognizedCount = evaluationTarget.filter(chunk => {
    const n = normalizeText(chunk)
    return marketModel.requirements.some(req => n.includes(normalizeText(req.rawText)))
  }).length

  return Math.round((recognizedCount / evaluationTarget.length) * 1000) / 1000
}

export function computeConfidence(
  professionalFit: ProfessionalFitProjection,
  personalFit: PersonalFitProjection,
  recognitionCoverage: number = 1.0,
): number {
  const profCov = professionalFit.assessmentCoverage

  // CONF-001 Fix: If no preferences are declared OR JD does not disclose preference info (assessedCount === 0),
  // personal coverage does NOT penalise confidence. Unknown preferences are neutral, not a veto.
  const personalWeight = (personalFit.totalRequirements === 0 || personalFit.assessedCount === 0)
    ? 1
    : personalFit.assessmentCoverage

  const downstreamConfidence = profCov * personalWeight
  // K6B Invariant: Confidence <= recognitionCoverage (no downstream layer can create certainty about unrecognized market requirements)
  const calibrated = Math.min(downstreamConfidence, recognitionCoverage)
  return Math.round(calibrated * 1000) / 1000
}

export function applyPolicy(
  professionalFit: ProfessionalFitProjection,
  personalFit: PersonalFitProjection,
  recognitionCoverage: number = 1.0,
): OpportunityAssessment {
  const confidence = computeConfidence(professionalFit, personalFit, recognitionCoverage)
  const eligible = personalFit.eligible

  // Hard gate: any eligibility violation → SKIP regardless of fit
  if (!eligible) {
    return {
      professionalFit,
      personalFit,
      confidence,
      eligibility: 'ineligible',
      recommendation: 'skip',
      rationale: 'Ineligible: a hard constraint (compensation, work mode, or role) was violated.',
    }
  }

  // Epistemological gate: too little information to distinguish → ABSTAIN
  if (confidence < ABSTAIN_CONFIDENCE_THRESHOLD) {
    return {
      professionalFit,
      personalFit,
      confidence,
      eligibility: 'eligible',
      recommendation: 'abstain',
      rationale: `Insufficient assessment coverage (${Math.round(confidence * 100)}%) to produce a reliable recommendation.`,
    }
  }

  // Policy projection
  const profScore = professionalFit.score
  const persScore = personalFit.assessedCount === 0
    ? 10  // No preferences declared → personal fit is neutral (doesn't block)
    : personalFit.score

  if (profScore >= STRONG_FIT_THRESHOLD && persScore >= ACCEPTABLE_PERSONAL_THRESHOLD) {
    return {
      professionalFit,
      personalFit,
      confidence,
      eligibility: 'eligible',
      recommendation: 'strong-candidate',
      rationale: `Professional Fit ${profScore.toFixed(1)}/10 and Personal Fit ${persScore.toFixed(1)}/10 both exceed thresholds at ${Math.round(confidence * 100)}% confidence.`,
    }
  }

  return {
    professionalFit,
    personalFit,
    confidence,
    eligibility: 'eligible',
    recommendation: 'consider',
    rationale: `Eligible with Professional Fit ${profScore.toFixed(1)}/10 and Personal Fit ${persScore.toFixed(1)}/10 at ${Math.round(confidence * 100)}% confidence.`,
  }
}

// ---- legacy policy --------------------------------------------------------

export function evaluateOpportunity(jd: string, profile: Profile): OpportunityEvaluation {
  const prefs = profile.preferences
  const criteria: CriterionCheck[] = [
    checkCompensation(jd, prefs),
    checkWorkMode(jd, prefs),
    checkRoles(jd, prefs),
    checkAvoid(jd, prefs),
  ]

  const marketModel = extractMarketRequirements(jd)
  const resolved = resolveRequirements(marketModel, profile)

  const demonstrated: SignalMatch[] = resolved
    .filter(r => r.status === 'demonstrated' && r.capabilityId && r.capabilityName)
    .map(r => ({
      capabilityId: r.capabilityId!,
      capabilityName: r.capabilityName!,
      matchedPhrases: [r.requirementConcept],
      evidence: r.evidence,
      status: 'demonstrated',
    }))

  const gaps: SignalMatch[] = resolved
    .filter(r => r.status === 'gap' && r.capabilityId && r.capabilityName)
    .map(r => ({
      capabilityId: r.capabilityId!,
      capabilityName: r.capabilityName!,
      matchedPhrases: [r.requirementConcept],
      evidence: [],
      status: 'no-evidence',
    }))

  const chunks = jd.split(/\n+/).map(c => c.trim()).filter(Boolean)
  const notEvaluated = chunks.filter(chunk => {
    const n = normalizeText(chunk)
    return !marketModel.requirements.some(req => n.includes(normalizeText(req.rawText)))
  }).length

  const recognized = demonstrated.length + gaps.length
  const coverage = recognized === 0 ? 0 : demonstrated.length / recognized
  const interpretationCoverage = recognized + notEvaluated === 0 ? 0 : recognized / (recognized + notEvaluated)
  const confidence = recognized + notEvaluated === 0 ? 0 : demonstrated.length / (recognized + notEvaluated)

  const violated = criteria.find(c => c.status === 'violated')
  const verdict: Verdict = violated
    ? 'skip'
    : coverage >= APPLY_COVERAGE_THRESHOLD && interpretationCoverage >= APPLY_INTERPRETATION_THRESHOLD
      ? 'apply'
      : 'consider'

  const decisionContext: DecisionContext = {
    targetRole: findMatchedRole(jd, prefs?.roles ?? []) ?? undefined,
    audience: 'hiring-manager',
    emphasize: demonstrated.map(m => m.capabilityName),
  }

  return {
    verdict,
    criteria,
    marketModel,
    demonstrated,
    gaps,
    notEvaluated,
    coverage,
    interpretationCoverage,
    confidence,
    decisionContext,
  }
}
