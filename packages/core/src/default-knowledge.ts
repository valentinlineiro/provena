export { MLOPS_KNOWLEDGE } from './knowledge/mlops.js'
import type { MarketKnowledge } from './market-knowledge.js'

export const DEFAULT_SOFTWARE_KNOWLEDGE: MarketKnowledge = {
  name: 'default-software',
  version: '1.0.0',
  patterns: [
    { id: 'p-1', concept: 'Python', kind: 'capability', matchers: [/\bpython\b/i], tags: ['software', 'backend'] },
    { id: 'p-2', concept: 'Kubernetes', kind: 'capability', matchers: [/\bkubernetes\b|\bk8s\b/i], tags: ['software', 'devops'] },
    { id: 'p-3', concept: 'REST APIs', kind: 'capability', matchers: [/\b(rest\s*apis?|apis?)\b/i], tags: ['software', 'backend'] },
    { id: 'p-4', concept: 'SQL', kind: 'capability', matchers: [/\bsql\b|\bmysql\b|\bpostgres\b/i], tags: ['software', 'database'] },
    { id: 'p-5', concept: 'DevOps / CI-CD', kind: 'capability', matchers: [/\bdevops\b|\bci\/cd\b/i], tags: ['software', 'devops'] },
    { id: 'p-6', concept: 'Software Development', kind: 'capability', matchers: [/\b(software\s*development|software\s*engineering)\b/i], tags: ['software'] },
    { id: 'p-7', concept: 'Software Architecture', kind: 'capability', matchers: [/\b(clean\s*architecture|hexagonal\s*architecture|ddd|domain\s*driven\s*design|software\s*architecture|architectural\s*design)\b/i], tags: ['software', 'architecture'] },
    { id: 'p-8', concept: 'Distributed Systems', kind: 'capability', matchers: [/\b(distributed\s*systems|distributed\s*architecture|microservices|event-driven)\b/i], tags: ['software', 'architecture'] },
    { id: 'p-9', concept: 'Cloud-Native Architecture', kind: 'capability', matchers: [/\b(cloud-native|aws|azure|gcp|public\s*cloud)\b/i], tags: ['software', 'cloud'] },
    { id: 'p-10', concept: 'Technical Leadership', kind: 'capability', matchers: [/\b(technical\s*leadership|technical\s*direction|squad\s*leadership)\b/i], tags: ['software', 'leadership'] },

    { id: 'p-11', concept: 'LLM Evaluation & Benchmarking', kind: 'practice', matchers: [/\b(llm\s*evaluation|evals?\s*strategy|evals?)\b/i], tags: ['software', 'ai'] },
    { id: 'p-12', concept: 'RAG & Retrieval', kind: 'capability', matchers: [/\b(rag|retrieval|vector\s*(?:db|search))\b/i], tags: ['software', 'ai'] },
    { id: 'p-13', concept: 'Agentic Workflows', kind: 'practice', matchers: [/\b(agentic\s*workflows?|multi-agent)\b/i], tags: ['software', 'ai'] },
    { id: 'p-14', concept: 'Prompt Lifecycle', kind: 'practice', matchers: [/\b(prompt\s*(?:versioning|engineering|optimization))\b/i], tags: ['software', 'ai'] },
    { id: 'p-15', concept: 'AI Safety & Guardrails', kind: 'domain', matchers: [/\b(red\s*teaming|bias\s*mitigation|responsible\s*ai|ai\s*safety)\b/i], tags: ['software', 'ai'] },
    { id: 'p-16', concept: 'AI-Assisted Engineering', kind: 'practice', matchers: [/\b(ai-assisted\s*(?:engineering|software|tools)|use\s*ai\s*aggressively|ai\s*patent\s*drafting)\b/i], tags: ['software', 'ai'] },

    { id: 'p-17', concept: 'ASPM', kind: 'domain', matchers: [/\b(aspm|application\s*security\s*posture)\b/i], tags: ['software', 'security'] },
    { id: 'p-18', concept: 'Static & Dynamic Code Analysis (SAST/DAST/SCA)', kind: 'domain', matchers: [/\b(sast|dast|sca)\b/i], tags: ['software', 'security'] },
    { id: 'p-19', concept: 'Software Bill of Materials (SBOM)', kind: 'practice', matchers: [/\b(sbom|spdx|cyclonedx)\b/i], tags: ['software', 'security'] },
    { id: 'p-20', concept: 'Application Security', kind: 'domain', matchers: [/\b(appsec|cloud-native\s*security)\b/i], tags: ['software', 'security'] },

    { id: 'p-21', concept: 'SDLC Optimization & Time-to-Market', kind: 'practice', matchers: [/\b(sdlc|ttm|time-to-market)\b/i], tags: ['software', 'process'] },
    { id: 'p-22', concept: 'Agile Delivery Frameworks', kind: 'practice', matchers: [/\b(agile|scrum|kanban)\b/i], tags: ['software', 'process'] },
    { id: 'p-23', concept: 'Technical Ownership & Budget', kind: 'practice', matchers: [/\b(budget|tco|total\s*cost\s*of\s*ownership)\b/i], tags: ['software', 'management'] },

    { id: 'p-24', concept: 'Regulated Healthcare Systems', kind: 'domain', matchers: [/\b(healthcare|clinical|ehr|regulated)\b/i], tags: ['healthcare'] },
    { id: 'p-25', concept: 'Fintech / Proptech Operations', kind: 'domain', matchers: [/\b(rent-to-own|proptech|fintech|fundraising|due\s*diligence)\b/i], tags: ['fintech'] },

    { id: 'p-26', concept: 'Remote Work', kind: 'constraint', matchers: [/\bremote\b|\bwork\s*from\s*home\b|\bwfh\b/i], tags: ['work-mode'] },
    { id: 'p-27', concept: 'Hybrid Work', kind: 'constraint', matchers: [/\bhybrid\b/i], tags: ['work-mode'] },
  ],
}

export const ADMIN_KNOWLEDGE: MarketKnowledge = {
  name: 'administration-hr',
  version: '1.0.0',
  patterns: [
    { id: 'p-adm-1', concept: 'Gestión Administrativa y Facturación', kind: 'capability', matchers: [/\b(gestión\s*administrativa|facturación|contabilidad\s*básica|impuestos)\b/i], tags: ['administration'] },
    { id: 'p-adm-2', concept: 'Atención al Cliente y Recepción', kind: 'capability', matchers: [/\b(atención\s*al\s*cliente|recepción|gestión\s*de\s*pacientes|atención\s*telefónica)\b/i], tags: ['administration', 'service'] },
    { id: 'p-adm-3', concept: 'Gestión de Nóminas y Contratos', kind: 'capability', matchers: [/\b(gestión\s*de\s*nóminas|nóminas|contratos\s*de\s*personal|seguridad\s*social)\b/i], tags: ['hr', 'administration'] },
    { id: 'p-adm-4', concept: 'Herramientas Ofimáticas (Excel / ERP)', kind: 'capability', matchers: [/\b(excel|ofimática|erp|software\s*de\s*gestión)\b/i], tags: ['office', 'tools'] },
  ],
}
