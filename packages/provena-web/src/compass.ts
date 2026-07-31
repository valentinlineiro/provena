/// <reference types="@cloudflare/workers-types" />
import { deriveStrengths, deriveEvidenceCount, findEvidenceGaps } from '@provena/core'
import type { Profile, CVContext } from '@provena/core'
import type { CareerTimeline, Strength, Gap } from '@provena/core'

export type { Strength, Gap } from '@provena/core'
export type { CareerExperience, CareerTimeline } from '@provena/core'

export type Positioning = 'insufficient-evidence' | 'developing' | 'positioned' | 'market-ready'
export type Readiness = 'unknown' | 'building' | 'ready'

export interface Recommendation {
  target: string
  text: string
}

// CareerHint reserved: strategy layer (which action maximizes your goal), populated after
// calibrating against diverse profiles — unlike nextBestImprovement (improvement layer).
export interface CareerHint {
  title: string
  rationale: string
  expectedImpact: 'low' | 'medium' | 'high'
}

export interface CareerCompass {
  positioning: Positioning
  readiness: Readiness
  strengths: Strength[]
  gaps: Gap[]
  nextBestImprovement: Recommendation
  confidence: number
  careerHint?: CareerHint
}

// ponytail: evidence-volume tiers, tune thresholds once real dogfooding data disagrees
const HITOS_DEVELOPING = 5
const HITOS_POSITIONED = 15

export function computeCareerCompass(profile: Profile): CareerCompass {
  if (profile.identity.experienceIds.length === 0) {
    throw new Error('CareerCompass requires at least one experience')
  }

  const strengths = deriveStrengths(profile).slice(0, 3)
  const totalHitos = deriveEvidenceCount(profile)

  const positioning: Positioning = totalHitos === 0
    ? 'insufficient-evidence'
    : totalHitos < HITOS_DEVELOPING
    ? 'developing'
    : totalHitos < HITOS_POSITIONED ? 'positioned' : 'market-ready'
  const readiness: Readiness = totalHitos === 0
    ? 'unknown'
    : totalHitos < HITOS_POSITIONED ? 'building' : 'ready'
  const confidence = Math.min(1, totalHitos / HITOS_POSITIONED)

  const gap = findEvidenceGaps(profile)[0]!
  const gaps: Gap[] = [gap]
  const nextBestImprovement: Recommendation = {
    target: gap.organization,
    text: 'document one high-impact milestone from that period, or one demonstrating cross-team impact',
  }

  return { positioning, readiness, strengths, gaps, nextBestImprovement, confidence }
}

// ponytail: single-gap message; a second gap would need "gaps" ranked by leverage, not effort
export function cvReadiness(context: CVContext, compass: CareerCompass): string {
  const gap = compass.gaps[0]
  const role = context.targetRole ?? ''
  if (!gap) return ''
  const goal = role ? ' for ' + role + ' opportunities' : ''
  const opening = compass.positioning === 'market-ready' || compass.positioning === 'positioned'
    ? 'This CV is good.'
    : 'This CV is still developing.'
  return opening + ' One more milestone from ' + gap.organization + ' would strengthen it' + goal + '.'
}

export interface CompassNarrative {
  status: string
  headline: string
  strengths: string[]
  gapLabel: string
  nextStep: string
  why: string[]
}function daysSince(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return 'today'
  return days + (days === 1 ? ' day ago' : ' days ago')
}

export function narrateCompass(compass: CareerCompass, timeline: CareerTimeline): CompassNarrative {
  const strengthNames = compass.strengths.map(s => s.name)
  const totalHitos = timeline.experiences.reduce((sum, e) => sum + (e.hitos || 0), 0)

  if (compass.positioning === 'insufficient-evidence') {
    return {
      status: 'Insufficient evidence',
      headline: 'Not enough recorded milestones to assess your career positioning yet.',
      strengths: [],
      gapLabel: '',
      nextStep: 'Document your first career milestones to unlock the Career Compass.',
      why: [
        totalHitos + ' documented milestones',
        'Story updated ' + daysSince(timeline.updatedAt),
      ],
    }
  }

  const status = compass.positioning === 'market-ready'
    ? 'Ready to explore the market'
    : compass.positioning === 'positioned' ? 'Well positioned' : 'Still developing'
  const headline = compass.positioning === 'developing'
    ? 'Your story is still developing toward ' + timeline.title + ' opportunities.'
    : compass.positioning === 'positioned'
    ? 'Based on your recorded experience, you\'re well positioned for ' + timeline.title + ' opportunities.'
    : 'Your recorded experience supports a move to ' + timeline.title + ' opportunities.'

  // ponytail: engine guarantees at least one gap (empty input throws above)
  const gap = compass.gaps[0]!
  const gapLabel = gap.organization + ' (' + gap.milestones + (gap.milestones === 1 ? ' milestone' : ' milestones') + ')'
  const nextStep = compass.nextBestImprovement.text.charAt(0).toUpperCase() + compass.nextBestImprovement.text.slice(1) + '.'

  const why = [
    totalHitos + ' documented milestones',
    'Story updated ' + daysSince(timeline.updatedAt),
    'Current ' + timeline.title + ' positioning',
    'Consistent strengths in ' + strengthNames.join(', '),
  ]

  return { status, headline, strengths: strengthNames, gapLabel, nextStep, why }
}
