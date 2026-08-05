import type { MarketKnowledge } from '../market-knowledge.js'

/**
 * Data Engineering & Enterprise Agentic AI Domain Knowledge
 *
 * Acquired via K12A Specimen #2 (Agentic AI Engineer residual induction)
 * Provenance: experiments/k12a/specimen-02-agentic/candidate-delta.json
 * Validation: Passed 4-gate verification (Recovery: +6.4%, Transfer Holdout: +13.3%, Specificity HashiCorp: 0 delta, Isolation CEU: 0 delta)
 */
export const DATA_AGENTIC_KNOWLEDGE: MarketKnowledge = {
  name: 'data-agentic-domain',
  version: '1.0.0',
  patterns: [
    {
      id: 'pyspark-etl-modernization',
      concept: 'PySpark & Big Data Infrastructure Modernization',
      kind: 'capability',
      matchers: [
        'pyspark',
        'aws glue',
        'ab initio',
        'etl',
        'large-scale data processing',
        'pipeline conversions',
        'data infrastructure modernization'
      ],
      tags: ['data', 'pyspark', 'etl', 'cloud']
    },
    {
      id: 'claude-api-llm-orchestration',
      concept: 'Claude API & LLM Orchestration',
      kind: 'capability',
      matchers: [
        'claude api',
        'claude code',
        'llm orchestration',
        'claude api integration',
        'lead llm integration'
      ],
      tags: ['ai', 'llm', 'claude', 'orchestration']
    },
    {
      id: 'multi-agent-reasoning-patterns',
      concept: 'Multi-Agent AI Reasoning & Workflows',
      kind: 'practice',
      matchers: [
        'multi-agent',
        'agentic ai patterns',
        'autonomous multi-step ai reasoning',
        'agentic ai patterns and orchestration'
      ],
      tags: ['ai', 'agentic', 'reasoning']
    },
    {
      id: 'high-availability-ai-resilience',
      concept: 'High-Availability AI Resilience & Observability',
      kind: 'practice',
      matchers: [
        'resilience protocols',
        'high-availability ai systems',
        'error handling and resilience',
        'complex debugging expertise'
      ],
      tags: ['ai', 'resilience', 'observability']
    }
  ]
}
