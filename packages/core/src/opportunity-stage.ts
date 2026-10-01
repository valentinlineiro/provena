import type { Application } from './application.js'
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
