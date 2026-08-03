import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { YamlWorkspaceLoader } from '@provena/yaml'

describe('Canonical Profile Integration (profiles/valentin)', () => {
  it('loads profiles/valentin using standard workspace API', async () => {
    const profilePath = path.resolve(process.cwd(), 'profiles/valentin')
    const loader = new YamlWorkspaceLoader()
    const { profile: workspace } = await loader.load(profilePath)
    assert.equal(workspace.identity.person.name, 'Valentín Liñeiro Barea')
    assert.ok(workspace.experiences.length > 0)
  })
})
