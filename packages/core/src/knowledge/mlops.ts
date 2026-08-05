import type { MarketKnowledge } from '../market-knowledge.js'

/**
 * MLOps & Machine Learning Engineering Domain Knowledge
 *
 * Adquired via K12A Specimen #1 (Shakers residual induction)
 * Provenance: experiments/k12a/specimen-01-shakers/candidate-delta.json
 * Validation: Passed 4-gate verification (Recovery: +17.2%, Transfer Holdout: +35.3%, Specificity HashiCorp: 0 delta, Isolation CEU: 0 delta)
 */
export const MLOPS_KNOWLEDGE: MarketKnowledge = {
  name: 'mlops-domain',
  version: '1.0.0',
  patterns: [
    {
      id: 'mlops-platform-engineering',
      concept: 'MLOps Platform Engineering & Pipelines',
      kind: 'capability',
      matchers: [
        'mlops',
        'mlops end-to-end',
        'plataforma de mlops',
        'pipelines de entrenamiento',
        'pipelines de entrenamiento y despliegue',
        'machine learning engineer',
        'modelos en cargas productivas',
        'ml platform',
        'continuous integration and continuos deployment pipelines'
      ],
      tags: ['mlops', 'infrastructure', 'engineering']
    },
    {
      id: 'feature-store-model-serving',
      concept: 'Feature Store & Model Serving Architecture',
      kind: 'capability',
      matchers: [
        'feature store',
        'serving',
        'feature/serving',
        'versionado de modelos',
        'versionado de modelos y datos',
        'ciclo de vida por cliente',
        'model registry',
        'artifact management'
      ],
      tags: ['mlops', 'serving', 'architecture']
    },
    {
      id: 'model-drift-monitoring',
      concept: 'Model Monitoring & Drift Detection',
      kind: 'practice',
      matchers: [
        'drift',
        'monitorización de drift',
        'detección de drift',
        'reentrenamiento',
        'reentrenamiento continuo',
        'mlflow',
        'experiment tracking'
      ],
      tags: ['mlops', 'observability', 'monitoring']
    },
    {
      id: 'data-governance-lineage',
      concept: 'Data Lineage & Governance (Unity Catalog)',
      kind: 'practice',
      matchers: [
        'unity catalog',
        'gobierno del dato',
        'lineage',
        'databricks',
        'arquitectura medallion',
        'dbt',
        'model governance'
      ],
      tags: ['data', 'governance', 'databricks']
    },
    {
      id: 'ai-compliance-guardrails',
      concept: 'AI Regulatory Compliance & Observability',
      kind: 'practice',
      matchers: [
        'opentelemetry',
        'grafana',
        'posthog',
        'eu ai act',
        'dora',
        'gdpr',
        'guardrails de seguridad'
      ],
      tags: ['compliance', 'governance', 'observability']
    }
  ]
}
