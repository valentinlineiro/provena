import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import { composeKnowledge, DeclarativeMarketRecognizer, type MarketKnowledge } from './market-knowledge.js'
import { evaluateOpportunity, type Verdict } from './opportunity.js'
import { runAttentionValidationAtScale, type AttentionValidationMetrics } from './attention-validation.js'

export interface PerItemResult {
  readonly itemId: string
  readonly groundTruth: GroundTruthOpportunity['groundTruth']
  readonly coverage: number
  readonly verdict: Verdict
}

export interface VerdictTransition {
  readonly itemId: string
  readonly groundTruth: GroundTruthOpportunity['groundTruth']
  readonly from: Verdict
  readonly to: Verdict
  readonly alignedWithGroundTruth: boolean
}

export interface CausalContributionMetrics {
  /** Mean absolute coverage movement -- magnitude only, direction-blind. */
  readonly coverageDelta: number
  /** Mean coverage gain over items where candidate.coverage > base.coverage (0 if none). */
  readonly coverageIncrease: number
  /** Mean coverage loss (positive number) over items where candidate.coverage < base.coverage (0 if none). */
  readonly coverageDecrease: number
  readonly verdictTransitionCount: number
  readonly verdictTransitionDirection: Readonly<Record<string, number>>
  readonly coincidentGroundTruthAlignment: number
}

export interface CausalContributionBenchmarkResult {
  readonly baselineResults: readonly PerItemResult[]
  readonly candidateResults: readonly PerItemResult[]
  readonly causal: CausalContributionMetrics
  readonly guardrails: {
    readonly baseline: AttentionValidationMetrics
    readonly candidate: AttentionValidationMetrics
  }
  readonly transitions: readonly VerdictTransition[]
}

function runPerItem(
  corpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  knowledge: MarketKnowledge
): readonly PerItemResult[] {
  const recognizer = new DeclarativeMarketRecognizer(knowledge)
  return corpus.map(item => {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    const ev = evaluateOpportunity(fullJd, profile, recognizer)
    return {
      itemId: item.id,
      groundTruth: item.groundTruth,
      coverage: ev.coverage,
      verdict: ev.verdict,
    }
  })
}

// A transition moves "toward" the item's ground truth if it makes the
// verdict order (skip < consider < apply) go up for a WORTH_ATTENTION item,
// or down for a NOT_WORTH item. UNRESOLVED items have no directional target.
const VERDICT_RANK: Record<Verdict, number> = { skip: 0, consider: 1, apply: 2 }

function isAligned(groundTruth: GroundTruthOpportunity['groundTruth'], from: Verdict, to: Verdict): boolean {
  if (groundTruth === 'WORTH_ATTENTION') return VERDICT_RANK[to] > VERDICT_RANK[from]
  if (groundTruth === 'NOT_WORTH') return VERDICT_RANK[to] < VERDICT_RANK[from]
  return false
}

/**
 * Compares a baseline knowledge composite against that composite with one
 * pack added (new-candidate shape) or removed (re-audit shape) on the same
 * OOS corpus, per-item, and computes causal-contribution metrics from
 * coverage/verdict movement -- the two signals CARD-007 showed actually
 * respond to which pack is used. MOR/reduction/precision are also computed
 * on both composites but only as non-regression guardrails, per ADR-003 /
 * CARD-008's design: they are structurally blind to the pack without
 * changing evaluateOpportunity, which is out of scope here.
 */
export function runCausalContributionBenchmark(
  corpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  baselinePacks: readonly MarketKnowledge[],
  candidatePacks: readonly MarketKnowledge[]
): CausalContributionBenchmarkResult {
  const baselineKnowledge = composeKnowledge(...baselinePacks)
  const candidateKnowledge = composeKnowledge(...candidatePacks)

  const baselineResults = runPerItem(corpus, profile, baselineKnowledge)
  const candidateResults = runPerItem(corpus, profile, candidateKnowledge)

  const byId = new Map(baselineResults.map(r => [r.itemId, r]))

  let coverageDeltaSum = 0
  let coverageDeltaCount = 0
  let coverageIncreaseSum = 0
  let coverageIncreaseCount = 0
  let coverageDecreaseSum = 0
  let coverageDecreaseCount = 0
  const transitions: VerdictTransition[] = []
  const direction: Record<string, number> = {}

  for (const candidate of candidateResults) {
    const base = byId.get(candidate.itemId)
    if (!base) continue

    const signedDelta = candidate.coverage - base.coverage
    if (base.coverage > 0 || candidate.coverage > 0) {
      coverageDeltaSum += Math.abs(signedDelta)
      coverageDeltaCount++
    }
    if (signedDelta > 0) {
      coverageIncreaseSum += signedDelta
      coverageIncreaseCount++
    } else if (signedDelta < 0) {
      coverageDecreaseSum += -signedDelta
      coverageDecreaseCount++
    }

    if (base.verdict !== candidate.verdict) {
      const aligned = isAligned(candidate.groundTruth, base.verdict, candidate.verdict)
      transitions.push({
        itemId: candidate.itemId,
        groundTruth: candidate.groundTruth,
        from: base.verdict,
        to: candidate.verdict,
        alignedWithGroundTruth: aligned,
      })
      const key = `${base.verdict}->${candidate.verdict}`
      direction[key] = (direction[key] ?? 0) + 1
    }
  }

  const coverageDelta = coverageDeltaCount > 0 ? coverageDeltaSum / coverageDeltaCount : 0
  const coverageIncrease = coverageIncreaseCount > 0 ? coverageIncreaseSum / coverageIncreaseCount : 0
  const coverageDecrease = coverageDecreaseCount > 0 ? coverageDecreaseSum / coverageDecreaseCount : 0
  const alignedCount = transitions.filter(t => t.alignedWithGroundTruth).length
  const coincidentGroundTruthAlignment = transitions.length > 0 ? alignedCount / transitions.length : 0

  return {
    baselineResults,
    candidateResults,
    causal: {
      coverageDelta,
      coverageIncrease,
      coverageDecrease,
      verdictTransitionCount: transitions.length,
      verdictTransitionDirection: direction,
      coincidentGroundTruthAlignment,
    },
    guardrails: {
      baseline: runAttentionValidationAtScale(corpus, profile, new DeclarativeMarketRecognizer(baselineKnowledge)),
      candidate: runAttentionValidationAtScale(corpus, profile, new DeclarativeMarketRecognizer(candidateKnowledge)),
    },
    transitions,
  }
}
