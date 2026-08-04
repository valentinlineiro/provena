import type { Profile } from './profile.js'

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

export interface Strength {
  name: string
  count: number
}

export interface Gap {
  organization: string
  dates: string
  milestones: number
}

function orderedExperiences(profile: Profile) {
  const map = new Map(profile.experiences.map(e => [e.id, e]))
  return profile.identity.experienceIds.map(id => map.get(id)).filter((e): e is NonNullable<typeof e> => e !== undefined)
}

// ponytail: capabilityIds are empty in real data — technologies carry the signal.
// Resolution uses ids when present, else falls back to technologies.
function capabilityNames(profile: Profile, exp: { capabilityIds: readonly string[]; technologies: readonly string[] }): string[] {
  if (exp.capabilityIds.length > 0) {
    const map = new Map(profile.capabilities.map(c => [c.id, c]))
    return exp.capabilityIds.map(id => map.get(id)?.name).filter((n): n is string => n !== undefined)
  }
  return [...exp.technologies]
}

export function deriveStrengths(profile: Profile): Strength[] {
  const freq = new Map<string, number>()
  for (const e of orderedExperiences(profile)) {
    for (const c of capabilityNames(profile, e)) freq.set(c, (freq.get(c) ?? 0) + 1)
  }
  return [...freq.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

function experienceMilestones(profile: Profile, expId: string, achievements: number): number {
  const linked = (profile.contributions ?? []).filter(c => c.experienceRef === expId).length
  return achievements + linked
}

export function deriveEvidenceCount(profile: Profile): number {
  return orderedExperiences(profile).reduce((sum, e) => sum + experienceMilestones(profile, e.id, e.achievements.length), 0)
}

export function findEvidenceGaps(profile: Profile): Gap[] {
  const all = orderedExperiences(profile)
  const candidates = all.some(e => e.end) ? all.filter(e => e.end) : all
  return candidates
    .map(e => ({
      organization: e.organization,
      dates: e.start + (e.end ? ' — ' + e.end : ' — present'),
      milestones: experienceMilestones(profile, e.id, e.achievements.length),
    }))
    .sort((a, b) => a.milestones - b.milestones)
}

export function profileToTimeline(profile: Profile, updatedAt: string): CareerTimeline {
  return {
    title: (profile.identity.person.title ?? '').split('|')[0]!.trim(),
    updatedAt,
    experiences: orderedExperiences(profile).map(e => ({
      organization: e.organization,
      title: e.title,
      start: e.start,
      end: e.end ?? null,
      hitos: experienceMilestones(profile, e.id, e.achievements.length),
      capabilities: capabilityNames(profile, e),
    })),
  }
}
