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

// ---- policy ---------------------------------------------------------------

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
