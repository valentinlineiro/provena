import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runAttentionValidationAtScale, type AttentionValidationMetrics } from './attention-validation.js'
import { evaluateOpportunity } from './opportunity.js'

export interface BorderCaseFailure {
  readonly id: string
  readonly title: string
  readonly expected: string
  readonly actual: string
  readonly notes?: string
}

export interface GeneralizationBenchmarkResult {
  readonly v1CorpusMetrics: AttentionValidationMetrics
  readonly v2CorpusMetrics: AttentionValidationMetrics
  readonly delta: {
    readonly attentionReductionDelta: number
    readonly precisionDelta: number
    readonly missedOpportunityRateDelta: number
  }
  readonly borderCaseFailures: readonly BorderCaseFailure[]
}

export function runGeneralizationBenchmarkV2(
  corpusV1: readonly GroundTruthOpportunity[],
  corpusV2: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): GeneralizationBenchmarkResult {
  const v1Metrics = runAttentionValidationAtScale(corpusV1, profile, recognizer)
  const v2Metrics = runAttentionValidationAtScale(corpusV2, profile, recognizer)

  const failures: BorderCaseFailure[] = []
  for (const item of corpusV2) {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    const ev = evaluateOpportunity(fullJd, profile, recognizer)
    const verdict = ev.verdict.toLowerCase()

    const isSurfaced = verdict === 'apply' || verdict === 'consider' || verdict === 'interested'
    const isSkipped = verdict === 'skip' || verdict === 'dismissed'

    // FN: Worth attention but skipped
    if (item.groundTruth === 'WORTH_ATTENTION' && isSkipped) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'WORTH_ATTENTION',
        actual: ev.verdict,
        notes: item.notes,
      })
    }
    // FP: Not worth attention but surfaced
    if (item.groundTruth === 'NOT_WORTH' && isSurfaced) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'NOT_WORTH',
        actual: ev.verdict,
        notes: item.notes,
      })
    }
  }

  return {
    v1CorpusMetrics: v1Metrics,
    v2CorpusMetrics: v2Metrics,
    delta: {
      attentionReductionDelta: Math.round((v2Metrics.attentionReduction - v1Metrics.attentionReduction) * 100) / 100,
      precisionDelta: Math.round((v2Metrics.attentionPrecision - v1Metrics.attentionPrecision) * 100) / 100,
      missedOpportunityRateDelta: Math.round((v2Metrics.missedOpportunityRate - v1Metrics.missedOpportunityRate) * 100) / 100,
    },
    borderCaseFailures: failures,
  }
}
