import type { Profile } from './profile.js'
import type { Preferences } from './types.js'
import type { DecisionContext } from './cv-projector.js'

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
  const t = s.trim()
  if (t.includes(',') && !t.includes('.')) return parseFloat(t.replace(/,/g, ''))
  if (t.includes('.') && !t.includes(',')) {
    const [, dec] = t.split('.')
    if (dec && dec.length === 3) return parseFloat(t.replace(/\./g, ''))
    return parseFloat(t)
  }
  return parseFloat(t)
}

function extractSalaries(text: string): number[] {
  const out: number[] = []
  const re = /(?:€|eur|euro)\s*([\d]+(?:[.,][\d]+)*)\s*(k)?(?:\s*\/(?:mo|month|mes|m|day|d|hour|h|hora))?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const fullMatch = m[0]!
    if (/\/(?:mo|month|mes|m|day|d|hour|h|hora)/i.test(fullMatch)) continue
    const afterMatch = text.slice(m.index + fullMatch.length, m.index + fullMatch.length + 10).toLowerCase()
    if (/^\s*\/(?:mo|month|mes|m|day|d|hour|h|hora)/.test(afterMatch)) continue

    let n = parseAmount(m[1]!)
    if (m[2]) n *= 1000
    if (!Number.isNaN(n) && n >= 10000) out.push(n)
  }
  return out
}

function checkCompensation(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const min = prefs?.compensation?.minimum
  if (!min) return { criterion: 'compensation', status: 'unknown', detail: 'no minimum compensation in profile' }
  const salaries = extractSalaries(jd)
  if (salaries.length === 0) return { criterion: 'compensation', status: 'unknown', detail: 'JD does not state compensation' }
  const floor = Math.min(...salaries)
  const status = floor < min ? 'violated' : 'satisfied'
  return { criterion: 'compensation', status, detail: 'JD states €' + floor + '; minimum is €' + min }
}

const REMOTE_RE = /remote|work from home|\bwfh\b|remote-?first/i
const ONSITE_RE = /on[- ]site|in (?:the )?office|per week in|relocation/i
const HYBRID_RE = /hybrid/i

function checkWorkMode(jd: string, prefs: Preferences | undefined): CriterionCheck {
  const pref = prefs?.work?.remote
  if (!pref) return { criterion: 'workMode', status: 'unknown', detail: 'no remote preference in profile' }
  if (pref === 'required') {
    if (REMOTE_RE.test(jd)) return { criterion: 'workMode', status: 'satisfied', detail: 'JD allows remote' }
    if (ONSITE_RE.test(jd) || HYBRID_RE.test(jd)) {
      return { criterion: 'workMode', status: 'violated', detail: 'JD requires on-site or hybrid presence; you require fully remote' }
    }
    return { criterion: 'workMode', status: 'unknown', detail: 'JD does not state work mode' }
  }
  if (pref === 'hybrid') {
    if (REMOTE_RE.test(jd) || HYBRID_RE.test(jd)) return { criterion: 'workMode', status: 'satisfied', detail: 'JD allows remote/hybrid' }
    if (ONSITE_RE.test(jd)) return { criterion: 'workMode', status: 'violated', detail: 'JD is on-site only' }
    return { criterion: 'workMode', status: 'unknown', detail: 'JD does not state work mode' }
  }
  return { criterion: 'workMode', status: 'unknown', detail: 'remote is optional' }
}

function roleTokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z]+/).filter(t => t.length >= 3)
}

const ROLE_ALIASES: Record<string, string[]> = {
  'tech lead': ['engineering lead', 'engineering team lead', 'team lead', 'technical lead'],
  'staff engineer': ['staff software engineer', 'staff engineer'],
  'principal engineer': ['principal software engineer', 'principal engineer'],
}

export function findMatchedRole(jd: string, roles: readonly string[]): string | null {
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
  const matched = findMatchedRole(jd, roles)
  if (matched) return { criterion: 'roles', status: 'satisfied', detail: 'JD matches preferred role ' + matched }
  const lower = jd.toLowerCase()
  if (/(junior|mid-?level)/i.test(lower) || roleTokens(lower).includes('senior')) {
    return { criterion: 'roles', status: 'violated', detail: 'JD targets a level below preferred (' + roles.join(', ') + ')' }
  }
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
  return map
}

function matchSignals(jd: string, profile: Profile): { matches: SignalMatch[]; notEvaluated: number } {
  const normJd = normalizeText(jd)
  const evidenceByCap = evidenceByCapability(profile)
  const matches: SignalMatch[] = []
  for (const cap of profile.capabilities ?? []) {
    const matchedPhrases: string[] = []
    for (const signal of cap.signals ?? []) {
      if (normJd.includes(normalizeText(signal))) matchedPhrases.push(signal)
    }
    if (matchedPhrases.length === 0) continue
    const evidence = evidenceByCap.get(cap.id) ?? []
    matches.push({
      capabilityId: cap.id,
      capabilityName: cap.name,
      matchedPhrases,
      evidence,
      status: evidence.length > 0 ? 'demonstrated' : 'no-evidence',
    })
  }
  // ponytail: newline chunks as interpretation units; revisit if real offers disagree
  const chunks = jd.split(/\n+/).map(c => c.trim()).filter(Boolean)
  const notEvaluated = chunks.filter(chunk => {
    const n = normalizeText(chunk)
    return !matches.some(m => m.matchedPhrases.some(p => n.includes(normalizeText(p))))
  }).length
  return { matches, notEvaluated }
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
  const { matches, notEvaluated } = matchSignals(jd, profile)
  const demonstrated = matches.filter(m => m.status === 'demonstrated')
  const gaps = matches.filter(m => m.status === 'no-evidence')
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
    demonstrated,
    gaps,
    notEvaluated,
    coverage,
    interpretationCoverage,
    confidence,
    decisionContext,
  }
}
