import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  SYSTEMS_INFRA_KNOWLEDGE,
  FINTECH_PLATFORM_KNOWLEDGE,
  OCCUPATIONAL_CONTEXT_KNOWLEDGE,
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
} from './index.js'

test('domain knowledge packs integrate modularly without altering core decision protocol', () => {
  const activeKnowledge = composeKnowledge(
    DEFAULT_SOFTWARE_KNOWLEDGE,
    SYSTEMS_INFRA_KNOWLEDGE,
    FINTECH_PLATFORM_KNOWLEDGE
  )
  const recognizer = new DeclarativeMarketRecognizer(activeKnowledge)

  const stripeJd = 'Looking for Infrastructure Engineer with experience in PCI compliance, Distributed Ledgers, Envoy proxy, and Golang at scale.'
  const model = recognizer.extractMarketRequirements(stripeJd)

  assert.ok(model.requirements.some(r => r.concept === 'PCI DSS & Payment Security'))
  assert.ok(model.requirements.some(r => r.concept === 'Service Mesh & Edge Proxy'))
  assert.ok(model.recognitionCoverage > 0.3)
})

test('OCCUPATIONAL_CONTEXT_KNOWLEDGE extracts context signals for pre-sales, people management, and embedded hardware', () => {
  const combined = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, OCCUPATIONAL_CONTEXT_KNOWLEDGE)
  const recognizer = new DeclarativeMarketRecognizer(combined)

  const jd = 'Enterprise Pre-Sales Solutions Architect role focused on sales enablement, technical demos, and RFP proposals.'
  const model = recognizer.extractMarketRequirements(jd)

  assert.ok(model.requirements.length > 0)
  assert.ok(model.requirements.some(r => r.concept.toLowerCase().includes('pre-sales') || r.kind === 'practice'))
})

