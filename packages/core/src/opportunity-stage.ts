import { createApplication, type Application } from './application.js'
import type { OpportunityUserDecision } from './opportunity-source.js'

export type OpportunityStage = 'new' | 'evaluated' | 'considered' | 'decided' | 'applied' | 'closed' | 'dismissed'

export interface OpportunityState {
  readonly assessed: boolean
  readonly decision: OpportunityUserDecision
  readonly application?: Application
}

export function deriveOpportunityStage({ assessed, decision, application }: OpportunityState): OpportunityStage {
  if (application) {
    if (application.status === 'ready') return 'decided'
    if (['applied', 'interviewing', 'offer'].includes(application.status)) return 'applied'
    return 'closed'
  }
  if (decision === 'dismissed') return 'dismissed'
  if (decision === 'interested') return 'considered'
  return assessed ? 'evaluated' : 'new'
}

export function decideToApply(
  state: OpportunityState,
  input: { opportunityId: string; platform: string; url?: string },
): Application {
  const stage = deriveOpportunityStage(state)
  if (stage === 'decided' || stage === 'applied') return state.application!
  if (stage === 'evaluated' || stage === 'considered') return createApplication({ ...input, status: 'ready' })
  throw new Error(
    `cannot decide to apply from stage "${stage}"` +
      (stage === 'closed' ? ': an application already exists for this opportunity' : ''),
  )
}
