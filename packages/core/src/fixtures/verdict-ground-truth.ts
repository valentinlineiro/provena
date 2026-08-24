export interface GroundTruthOpportunity {
  readonly id: string
  readonly title: string
  readonly jd: string
  readonly groundTruth: 'WORTH_ATTENTION' | 'NOT_WORTH' | 'UNRESOLVED'
  readonly notes?: string
}

export const VERDICT_GROUND_TRUTH_DATASET: readonly GroundTruthOpportunity[] = [
  {
    id: 'gt-01',
    title: 'Senior Infrastructure Engineer',
    jd: 'Stripe is hiring a Senior Infrastructure Engineer. Requirements: 5+ years with Kubernetes, Envoy proxy, PCI compliance required. Deep proficiency in Go.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for senior infra profile with Go, Kubernetes, and security experience.',
  },
  {
    id: 'gt-02',
    title: 'Staff Payment Systems Engineer',
    jd: 'Stripe Payment Platform. Requires double-entry ledger architecture, Terraform at scale, Prometheus monitoring. Hands-on Go experience preferred.',
    groundTruth: 'WORTH_ATTENTION',
    notes: 'High fit for payment platform systems profile.',
  },
  {
    id: 'gt-03',
    title: 'Administrative Receptionist',
    jd: 'Gestión administrativa, recepción de pacientes, facturación básica y atención telefónica en clínica médica.',
    groundTruth: 'NOT_WORTH',
    notes: 'Irrelevant non-tech role for software engineering profile.',
  },
  {
    id: 'gt-04',
    title: 'Junior Front-End Intern',
    jd: 'Looking for a junior intern with basic HTML/CSS knowledge to work part-time.',
    groundTruth: 'NOT_WORTH',
    notes: 'Junior intern role below candidate seniority tier.',
  },
  {
    id: 'gt-05',
    title: 'Quant Trading Strategist',
    jd: 'High-frequency algorithmic trading desk requiring PhD in Stochastic Calculus and C++ execution engine experience.',
    groundTruth: 'UNRESOLVED',
    notes: 'Niche domain requiring specific quantitative math evidence.',
  },
]
