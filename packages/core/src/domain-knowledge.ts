import type { MarketKnowledge } from './market-knowledge.js'

export const SYSTEMS_INFRA_KNOWLEDGE: MarketKnowledge = {
  name: 'systems-infrastructure-v1',
  version: '1.0.0',
  patterns: [
    {
      id: 'kp-sys-01',
      concept: 'Service Mesh & Edge Proxy',
      kind: 'capability',
      matchers: [/\benvoy\b/i, /\bistio\b/i, /\bservice mesh\b/i, /\bedge proxy\b/i],
      tags: ['infrastructure', 'networking'],
    },
    {
      id: 'kp-sys-02',
      concept: 'Container Orchestration & Runtime',
      kind: 'capability',
      matchers: [/\bcontainerd\b/i, /\bcrio\b/i, /\bk8s\b/i, /\bkubernetes clusters?\b/i],
      tags: ['containers', 'cloud-native'],
    },
    {
      id: 'kp-sys-03',
      concept: 'Infrastructure Telemetry & Observability',
      kind: 'practice',
      matchers: [/\bprometheus\b/i, /\bgrafana\b/i, /\bopentelemetry\b/i, /\botel\b/i, /\bdatadog\b/i],
      tags: ['observability', 'monitoring'],
    },
  ],
}

export const FINTECH_PLATFORM_KNOWLEDGE: MarketKnowledge = {
  name: 'fintech-platform-v1',
  version: '1.0.0',
  patterns: [
    {
      id: 'kp-fin-01',
      concept: 'PCI DSS & Payment Security',
      kind: 'constraint',
      matchers: [/\bpci-dss\b/i, /\bpci compliance\b/i, /\bpayment security\b/i, /\btokenization\b/i],
      tags: ['fintech', 'security', 'compliance'],
    },
    {
      id: 'kp-fin-02',
      concept: 'Financial Ledgers & Double-Entry Accounting',
      kind: 'domain',
      matchers: [/\bdouble-entry\b/i, /\bledger systems?\b/i, /\bfinancial ledger\b/i, /\breconciliation engine\b/i],
      tags: ['fintech', 'accounting'],
    },
  ],
}

export const OCCUPATIONAL_CONTEXT_KNOWLEDGE: MarketKnowledge = {
  name: 'occupational-context-v1',
  version: '1.0.0',
  patterns: [
    {
      id: 'kp-occ-01',
      concept: 'Pre-Sales Enablement & Solutions Architecture',
      kind: 'practice',
      matchers: [
        /\bpre-sales\b/i,
        /\bsales enablement\b/i,
        /\brfp proposals?\b/i,
        /\bsales architect\b/i,
        /\btechnical demos?\b/i,
        /\bproof of concept demos?\b/i,
      ],
      tags: ['occupational', 'pre-sales', 'solutions-architecture'],
    },
    {
      id: 'kp-occ-02',
      concept: 'Pure People Management',
      kind: 'practice',
      matchers: [
        /\b0% coding\b/i,
        /\bpure people management\b/i,
        /\badministrative manager\b/i,
        /\bdirect reports only\b/i,
        /\bperformance reviews\b/i,
        /\bdirect reports management\b/i,
      ],
      tags: ['occupational', 'people-management'],
    },
    {
      id: 'kp-occ-03',
      concept: 'Embedded Systems & Hardware Firmware',
      kind: 'domain',
      matchers: [
        /\bfirmware\b/i,
        /\bmicrocontroller\b/i,
        /\brtos\b/i,
        /\bpcb design\b/i,
        /\bhardware engineer\b/i,
        /\bembedded hardware\b/i,
      ],
      tags: ['occupational', 'embedded', 'hardware'],
    },
    {
      id: 'kp-occ-04',
      concept: 'Game Engine & Graphics Rendering',
      kind: 'domain',
      matchers: [
        /\bgame engine\b/i,
        /\bgraphics renderer\b/i,
        /\bvulkan\b/i,
        /\bopengl\b/i,
        /\bshader developer\b/i,
        /\bdirectx\b/i,
        /\bgraphics rendering\b/i,
      ],
      tags: ['occupational', 'game-graphics', 'rendering'],
    },
  ],
}

