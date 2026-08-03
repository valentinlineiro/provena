import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createTestWorkspace } from '@provena/core/test-utils/createTestWorkspace.js'
import { YamlWorkspaceLoader } from '@provena/yaml'

test('CLI workspace loader loads synthetic test workspace', async () => {
  const ws = await createTestWorkspace({ personName: 'Test CLI Person', title: 'CLI Engineer' })
  try {
    const { profile } = await new YamlWorkspaceLoader().load(ws.rootDir)
    assert.equal(profile.identity.person.name, 'Test CLI Person')
    assert.equal(profile.identity.person.title, 'CLI Engineer')
  } finally {
    ws.cleanup()
  }
})
