export interface CareerExperience {
  organization: string
  title: string
  start: string
  end: string | null
  hitos?: number
  capabilities: string[]
}

export interface CareerTimeline {
  title: string
  updatedAt: string
  experiences: CareerExperience[]
}

export type Positioning = 'insufficient-evidence' | 'developing' | 'positioned' | 'market-ready'
export type Readiness = 'unknown' | 'building' | 'ready'

export interface Strength {
  name: string
  count: number
}

export interface Gap {
  organization: string
  dates: string
  milestones: number
}

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

export function computeCareerCompass(timeline: CareerTimeline): CareerCompass {
  if (timeline.experiences.length === 0) {
    throw new Error('CareerCompass requires at least one experience')
  }

  const capFreq: Record<string, number> = {}
  for (const e of timeline.experiences) for (const c of e.capabilities) capFreq[c] = (capFreq[c] || 0) + 1
  const strengths = Object.entries(capFreq)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  const totalHitos = timeline.experiences.reduce((sum, e) => sum + (e.hitos || 0), 0)

  // 0 hitos = the engine has evaluated almost nothing, so any verdict would be noise
  const positioning: Positioning = totalHitos === 0
    ? 'insufficient-evidence'
    : totalHitos < HITOS_DEVELOPING
    ? 'developing'
    : totalHitos < HITOS_POSITIONED ? 'positioned' : 'market-ready'
  const readiness: Readiness = totalHitos === 0
    ? 'unknown'
    : totalHitos < HITOS_POSITIONED ? 'building' : 'ready'
  const confidence = Math.min(1, totalHitos / HITOS_POSITIONED)

  const past = timeline.experiences.filter(e => e.end)
  const weakest = (past.length ? past : timeline.experiences)
    .slice()
    .sort((a, b) => (a.hitos || 0) - (b.hitos || 0))[0]!
  const gaps: Gap[] = [{
    organization: weakest.organization,
    dates: weakest.start + (weakest.end ? ' — ' + weakest.end : ' — present'),
    milestones: weakest.hitos || 0,
  }]

  const nextBestImprovement: Recommendation = {
    target: weakest.organization,
    text: 'document one high-impact milestone from that period, or one demonstrating cross-team impact',
  }

  return { positioning, readiness, strengths, gaps, nextBestImprovement, confidence }
}

export interface CompassNarrative {
  status: string
  headline: string
  strengths: string[]
  gapLabel: string
  nextStep: string
  why: string[]
}

function daysSince(dateStr: string): string {
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
