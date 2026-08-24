import type { GroundTruthOpportunity } from './fixtures/verdict-ground-truth.js'
import type { Profile } from './profile.js'
import type { IMarketRecognizer } from './market-knowledge.js'
import { runAttentionValidationAtScale, type AttentionValidationMetrics } from './attention-validation.js'
import { evaluateOpportunity } from './opportunity.js'

export interface OOSFailure {
  readonly id: string
  readonly title: string
  readonly expected: string
  readonly actual: string
  readonly category: 'UNSEEN_ROLE_CONTEXT' | 'DOMAIN_MISALIGNMENT' | 'LEVEL_AMBIGUITY'
  readonly notes?: string
}

export interface OOSValidationBenchmarkResult {
  readonly inSampleCorpusMetrics: AttentionValidationMetrics
  readonly outOfSampleCorpusMetrics: AttentionValidationMetrics
  readonly transportability: {
    readonly reductionRetention: number
    readonly precisionRetention: number
    readonly morDelta: number
  }
  readonly oosFailures: readonly OOSFailure[]
}

export function runOutOfSampleValidationBenchmark(
  inSampleCorpus: readonly GroundTruthOpportunity[],
  outOfSampleCorpus: readonly GroundTruthOpportunity[],
  profile: Profile,
  recognizer?: IMarketRecognizer
): OOSValidationBenchmarkResult {
  const inMetrics = runAttentionValidationAtScale(inSampleCorpus, profile, recognizer)
  const oosMetrics = runAttentionValidationAtScale(outOfSampleCorpus, profile, recognizer)

  const failures: OOSFailure[] = []
  for (const item of outOfSampleCorpus) {
    const fullJd = item.title ? `${item.title}\n${item.jd}` : item.jd
    const ev = evaluateOpportunity(fullJd, profile, recognizer)
    const verdict = ev.verdict.toLowerCase()

    const isSurfaced = verdict === 'apply' || verdict === 'consider' || verdict === 'interested'
    const isSkipped = verdict === 'skip' || verdict === 'dismissed'

    if (item.groundTruth === 'WORTH_ATTENTION' && isSkipped) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'WORTH_ATTENTION',
        actual: ev.verdict,
        category: 'DOMAIN_MISALIGNMENT',
        notes: item.notes,
      })
    }
    if (item.groundTruth === 'NOT_WORTH' && isSurfaced) {
      failures.push({
        id: item.id,
        title: item.title,
        expected: 'NOT_WORTH',
        actual: ev.verdict,
        category: 'UNSEEN_ROLE_CONTEXT',
        notes: item.notes,
      })
    }
  }

  const reductionRetention = inMetrics.attentionReduction > 0
    ? Math.round((oosMetrics.attentionReduction / inMetrics.attentionReduction) * 100) / 100
    : 0
  const precisionRetention = inMetrics.attentionPrecision > 0
    ? Math.round((oosMetrics.attentionPrecision / inMetrics.attentionPrecision) * 100) / 100
    : 0
  const morDelta = Math.round((oosMetrics.missedOpportunityRate - inMetrics.missedOpportunityRate) * 100) / 100

  return {
    inSampleCorpusMetrics: inMetrics,
    outOfSampleCorpusMetrics: oosMetrics,
    transportability: {
      reductionRetention,
      precisionRetention,
      morDelta,
    },
    oosFailures: failures,
  }
}
