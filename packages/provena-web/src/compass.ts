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
  experiences: CareerExperience[]
}

export type Positioning = 'developing' | 'positioned' | 'market-ready'
export type Readiness = 'building' | 'ready'

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

export interface CareerCompass {
  positioning: Positioning
  readiness: Readiness
  strengths: Strength[]
  gaps: Gap[]
  nextBestImprovement: Recommendation
  confidence: number
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

  const positioning: Positioning = totalHitos < HITOS_DEVELOPING
    ? 'developing'
    : totalHitos < HITOS_POSITIONED ? 'positioned' : 'market-ready'
  const readiness: Readiness = totalHitos < HITOS_POSITIONED ? 'building' : 'ready'
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
    text: 'document a milestone from that period, or one that shows impact beyond your immediate team',
  }

  return { positioning, readiness, strengths, gaps, nextBestImprovement, confidence }
}

export interface CompassNarrative {
  judgment: string
  evidence: string
  action: string
}

export function narrateCompass(compass: CareerCompass, timeline: CareerTimeline): CompassNarrative {
  const strengths = compass.strengths.map(s => s.name)
  const opener = compass.positioning === 'developing'
    ? 'Your story is still developing toward ' + timeline.title + ' opportunities, with early strengths'
    : compass.positioning === 'positioned'
    ? 'Based on your recorded experience, you\'re well positioned for ' + timeline.title + ' opportunities, with clear strengths'
    : 'Based on your recorded experience, you\'re ready to explore the market. Your career currently supports a move to ' + timeline.title + ' opportunities, with clear strengths'

  const judgment = '<strong>' + opener + ' in ' + strengths[0] + ' and ' + strengths[1] + '.</strong>'

  // ponytail: engine guarantees at least one gap (empty input throws above)
  const gap = compass.gaps[0]!
  const evidence = 'Your recent work reinforces that positioning, but your story has limited evidence from your time at ' +
    gap.organization + ' (' + gap.dates + ') — currently ' + gap.milestones + (gap.milestones === 1 ? ' milestone.' : ' milestones.')

  const action = '<strong>Next best improvement:</strong> ' + compass.nextBestImprovement.text + '.'

  return { judgment, evidence, action }
}
