import { test } from 'node:test'
import assert from 'node:assert/strict'
import { SYSTEMS_INFRA_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE } from './domain-knowledge.js'
import { DeclarativeMarketRecognizer, composeKnowledge } from './market-knowledge.js'
import { DEFAULT_SOFTWARE_KNOWLEDGE } from './default-knowledge.js'

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
