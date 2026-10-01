import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { YamlWorkspaceLoader } from '../../yaml/src/yaml-workspace-loader.js'
import embedded from './profile.js'

test('embedded profile is in sync with profiles/valentin (run npm run profile:sync)', async () => {
  const workspace = fileURLToPath(new URL('../../../profiles/valentin', import.meta.url))
  const { profile } = await new YamlWorkspaceLoader().load(workspace)
  assert.equal(JSON.stringify(embedded), JSON.stringify(profile))
})
