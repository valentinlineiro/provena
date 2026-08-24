import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import { evaluateOpportunity, type OpportunityEvaluation } from './opportunity.js'
import type { IMarketRecognizer } from './market-knowledge.js'

export interface VerdictBenchmarkMetrics {
  readonly totalOpportunities: number
  readonly accuracy: number
  readonly precision: number
  readonly recall: number
  readonly falsePositiveRate: number
  readonly missedOpportunityRate: number
  readonly abstentionRate: number
  readonly abstentionPrecision: number
  readonly counts: {
    readonly tp: number
    readonly fp: number
    readonly tn: number
    readonly fn: number
    readonly abstain: number
  }
}

export function runVerdictQualityBenchmark(
  dataset: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): VerdictBenchmarkMetrics {
  if (dataset.length === 0) {
    return {
      totalOpportunities: 0,
      accuracy: 0,
      precision: 0,
      recall: 0,
      falsePositiveRate: 0,
      missedOpportunityRate: 0,
      abstentionRate: 0,
      abstentionPrecision: 0,
      counts: { tp: 0, fp: 0, tn: 0, fn: 0, abstain: 0 },
    }
  }

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0
  let abstain = 0
  let trueEvidenceGapsInAbstain = 0

  for (const item of dataset) {
    const evaluation: OpportunityEvaluation = evaluateOpportunity(item.jd, profile, recognizer)
    const verdict = evaluation.verdict.toLowerCase()

    if (verdict === 'abstain') {
      abstain++
      if (item.groundTruth === 'UNRESOLVED') {
        trueEvidenceGapsInAbstain++
      }
    } else if (verdict === 'apply' || verdict === 'consider' || verdict === 'interested') {
      if (item.groundTruth === 'WORTH_ATTENTION') {
        tp++
      } else if (item.groundTruth === 'NOT_WORTH') {
        fp++
      }
    } else if (verdict === 'skip' || verdict === 'dismissed') {
      if (item.groundTruth === 'WORTH_ATTENTION') {
        fn++
      } else {
        tn++
      }
    }
  }

  const totalDecided = tp + fp + tn + fn
  const accuracy = totalDecided > 0 ? Math.round(((tp + tn) / totalDecided) * 100) / 100 : 0
  const precision = (tp + fp) > 0 ? Math.round((tp / (tp + fp)) * 100) / 100 : 0
  const recall = (tp + fn) > 0 ? Math.round((tp / (tp + fn)) * 100) / 100 : 0
  const falsePositiveRate = (fp + tn) > 0 ? Math.round((fp / (fp + tn)) * 100) / 100 : 0
  const missedOpportunityRate = (tp + fn) > 0 ? Math.round((fn / (tp + fn)) * 100) / 100 : 0
  const abstentionRate = Math.round((abstain / dataset.length) * 100) / 100
  const abstentionPrecision = abstain > 0 ? Math.round((trueEvidenceGapsInAbstain / abstain) * 100) / 100 : 0

  return {
    totalOpportunities: dataset.length,
    accuracy,
    precision,
    recall,
    falsePositiveRate,
    missedOpportunityRate,
    abstentionRate,
    abstentionPrecision,
    counts: { tp, fp, tn, fn, abstain },
  }
}
