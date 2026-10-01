import type { OpportunityId } from './market-catalog.js'

export const APPLICATION_PLATFORMS = [
  'greenhouse', 'lever', 'ashby', 'workday', 'linkedin',
  'company-site', 'referral', 'recruiter', 'other',
] as const

export type ApplicationPlatform = (typeof APPLICATION_PLATFORMS)[number]

export const APPLICATION_STATUSES = [
  'ready', 'applied', 'interviewing', 'offer',
  'rejected', 'withdrawn', 'ghosted', 'closed',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type ApplicationOutcome = 'accepted' | 'rejected' | 'withdrawn' | 'ghosted'

export interface ApplicationDocuments {
  readonly cvHash?: string
  readonly coverNote?: string
}

export interface Application {
  readonly id: string
  readonly opportunityId?: OpportunityId
  readonly platform: ApplicationPlatform
  readonly url?: string
  readonly appliedAt: string
  readonly documents: ApplicationDocuments
  readonly status: ApplicationStatus
  readonly nextAction?: string
  readonly nextActionDue?: string
  readonly outcome?: ApplicationOutcome
  readonly notes?: string
}

const VALID_PLATFORMS: ReadonlySet<string> = new Set<string>(APPLICATION_PLATFORMS)

const VALID_STATUSES: ReadonlySet<string> = new Set<string>(APPLICATION_STATUSES)

export function parseApplication(raw: unknown): Application {
  if (!raw || typeof raw !== 'object') throw new Error('application: expected an object')
  const v = raw as Record<string, unknown>
  if (typeof v.id !== 'string' || !v.id) throw new Error('application.id is required')
  if (!VALID_PLATFORMS.has(String(v.platform))) {
    throw new Error(`application.platform must be one of: ${[...VALID_PLATFORMS].join(', ')}`)
  }
  if (typeof v.appliedAt !== 'string' || Number.isNaN(Date.parse(v.appliedAt))) {
    throw new Error('application.appliedAt must be an ISO date string')
  }
  const status = String(v.status ?? 'applied')
  if (!VALID_STATUSES.has(status)) {
    throw new Error(`application.status must be one of: ${[...VALID_STATUSES].join(', ')}`)
  }
  return {
    id: v.id,
    ...(typeof v.opportunityId === 'string' ? { opportunityId: v.opportunityId as OpportunityId } : {}),
    platform: v.platform as ApplicationPlatform,
    ...(typeof v.url === 'string' ? { url: v.url } : {}),
    appliedAt: v.appliedAt,
    documents: (v.documents && typeof v.documents === 'object' ? v.documents : {}) as ApplicationDocuments,
    status: status as ApplicationStatus,
    ...(typeof v.nextAction === 'string' ? { nextAction: v.nextAction } : {}),
    ...(typeof v.nextActionDue === 'string' ? { nextActionDue: v.nextActionDue } : {}),
    ...(typeof v.outcome === 'string' ? { outcome: v.outcome as ApplicationOutcome } : {}),
    ...(typeof v.notes === 'string' ? { notes: v.notes } : {}),
  }
}

let applicationSequence = 0

export function createApplication(input: {
  platform: string
  opportunityId?: string
  url?: string
  notes?: string
  appliedAt?: string
}): Application {
  return parseApplication({
    id: `app-${Date.now()}-${applicationSequence++}`,
    platform: input.platform,
    ...(input.opportunityId ? { opportunityId: input.opportunityId } : {}),
    ...(input.url ? { url: input.url } : {}),
    appliedAt: input.appliedAt ?? new Date().toISOString(),
    documents: {},
    status: 'applied',
    ...(input.notes ? { notes: input.notes } : {}),
  })
}

export interface ApplicationRepository {
  list(): Promise<readonly Application[]>
  save(application: Application): Promise<void>
}

export class MemoryApplicationRepository implements ApplicationRepository {
  readonly #applications = new Map<string, Application>()

  async list(): Promise<readonly Application[]> {
    return [...this.#applications.values()]
  }

  async save(application: Application): Promise<void> {
    this.#applications.set(application.id, parseApplication(application))
  }
}

const VALID_TRANSITIONS: Readonly<Record<ApplicationStatus, readonly ApplicationStatus[]>> = {
  ready: ['applied', 'withdrawn', 'closed'],
  applied: ['interviewing', 'rejected', 'withdrawn', 'ghosted', 'closed'],
  interviewing: ['offer', 'rejected', 'withdrawn', 'ghosted', 'closed'],
  offer: ['rejected', 'withdrawn', 'closed'],
  rejected: [],
  withdrawn: [],
  ghosted: [],
  closed: [],
}

export function transitionApplication(application: Application, to: ApplicationStatus): Application {
  const allowed = VALID_TRANSITIONS[application.status] ?? []
  if (!allowed.includes(to)) {
    throw new Error(`cannot transition application from "${application.status}" to "${to}"`)
  }
  return { ...application, status: to }
}

const ACTIVE_STATUSES: ReadonlySet<ApplicationStatus> = new Set(['ready', 'applied', 'interviewing', 'offer'])

const STALE_AFTER_DAYS = 21

export interface NextActionItem {
  readonly applicationId: string
  readonly platform: ApplicationPlatform
  readonly action: string
  readonly due?: string
}

export interface ApplicationSummary {
  readonly active: readonly Application[]
  readonly nextActions: readonly NextActionItem[]
  readonly stale: readonly Application[]
  readonly waitingOnMe: readonly Application[]
  readonly waitingOnCompany: readonly Application[]
}

export function summarizeApplications(applications: readonly Application[], nowIso?: string): ApplicationSummary {
  const now = (nowIso ?? new Date().toISOString()).split('T')[0]!
  const active = applications.filter((a) => ACTIVE_STATUSES.has(a.status))
  const withAction = active.filter((a) => a.nextAction)
  const withoutAction = active.filter((a) => !a.nextAction)
  const nextActions: NextActionItem[] = withAction
    .map((a) => ({
      applicationId: a.id,
      platform: a.platform,
      action: a.nextAction!,
      ...(a.nextActionDue ? { due: a.nextActionDue } : {}),
    }))
    .sort((x, y) => (x.due ?? '9999').localeCompare(y.due ?? '9999'))
  const stale = active.filter((a) => {
    if (a.status !== 'applied') return false
    const appliedDay = a.appliedAt.split('T')[0]!
    const ageDays = (Date.parse(now) - Date.parse(appliedDay)) / 86_400_000
    return ageDays > STALE_AFTER_DAYS
  })
  return { active, nextActions, stale, waitingOnMe: withAction, waitingOnCompany: withoutAction }
}
