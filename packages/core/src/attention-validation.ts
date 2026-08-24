import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runVerdictQualityBenchmark, type VerdictBenchmarkMetrics } from './verdict-benchmark.js'

export interface AttentionValidationMetrics {
  readonly totalEvaluated: number
  readonly silencedCount: number
  readonly surfacedCount: number
  readonly attentionReduction: number
  readonly attentionPrecision: number
  readonly missedOpportunityRate: number
  readonly abstentionPrecision: number
  readonly matrix: VerdictBenchmarkMetrics['counts']
}

export function runAttentionValidationAtScale(
  corpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): AttentionValidationMetrics {
  const vMetrics = runVerdictQualityBenchmark(corpus, profile, recognizer)
  const total = corpus.length

  if (total === 0) {
    return {
      totalEvaluated: 0,
      silencedCount: 0,
      surfacedCount: 0,
      attentionReduction: 0,
      attentionPrecision: 0,
      missedOpportunityRate: 0,
      abstentionPrecision: 0,
      matrix: vMetrics.counts,
    }
  }

  const surfacedCount = vMetrics.counts.tp + vMetrics.counts.fp
  const silencedCount = total - surfacedCount
  const attentionReduction = Math.round((silencedCount / total) * 100) / 100
  const attentionPrecision = surfacedCount > 0 ? Math.round((vMetrics.counts.tp / surfacedCount) * 100) / 100 : 0

  return {
    totalEvaluated: total,
    silencedCount,
    surfacedCount,
    attentionReduction,
    attentionPrecision,
    missedOpportunityRate: vMetrics.missedOpportunityRate,
    abstentionPrecision: vMetrics.abstentionPrecision,
    matrix: vMetrics.counts,
  }
}
