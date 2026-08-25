import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROMOTED_OPERATIONAL_KNOWLEDGE, DEFAULT_SOFTWARE_KNOWLEDGE, FINTECH_PLATFORM_KNOWLEDGE } from './index.js'

test('PROMOTED_OPERATIONAL_KNOWLEDGE contains exactly the two packs promoted to Operational Knowledge v1', () => {
  const names = PROMOTED_OPERATIONAL_KNOWLEDGE.map(k => k.name).sort()
  assert.deepEqual(names, [DEFAULT_SOFTWARE_KNOWLEDGE.name, FINTECH_PLATFORM_KNOWLEDGE.name].sort())
})

test('PROMOTED_OPERATIONAL_KNOWLEDGE does not include any VETOED or INCONCLUSIVE pack', () => {
  const names = PROMOTED_OPERATIONAL_KNOWLEDGE.map(k => k.name)
  assert.ok(!names.includes('systems-infrastructure-v1'), 'SYSTEMS_INFRA_KNOWLEDGE is VETOED (CARD-018), must never appear')
  assert.ok(!names.includes('administration-hr'), 'ADMIN_KNOWLEDGE is INCONCLUSIVE, must never appear')
})
