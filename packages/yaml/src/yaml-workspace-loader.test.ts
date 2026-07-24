import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { YamlWorkspaceLoader } from './yaml-workspace-loader.js'

async function makeWorkspace(provenaYaml: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'provena-test-'))
  await writeFile(join(dir, 'provena.yaml'), provenaYaml)
  await writeFile(join(dir, 'person.yaml'), 'name: Test Person\nurls: {}\n')
  await writeFile(
    join(dir, 'experience.yaml'),
    [
      '- id: exp-a',
      '  organization: A Corp',
      '  title: Engineer',
      '  start: "2020-01"',
      '  achievements: []',
      '  technologies: []',
      '  capabilityIds: []',
      '  evidenceIds: []',
      '- id: exp-b',
      '  organization: B Corp',
      '  title: Engineer',
      '  start: "2022-01"',
      '  achievements: []',
      '  technologies: []',
      '  capabilityIds: []',
      '  evidenceIds: []',
      '',
    ].join('\n'),
  )
  return dir
}

test('experienceIds follow experience.yaml order by default', async () => {
  const dir = await makeWorkspace('version: "1.0"\n')
  try {
    const profile = await new YamlWorkspaceLoader().load(dir)
    assert.deepEqual(profile.identity.experienceIds, ['exp-a', 'exp-b'])
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('provena.yaml order overrides experience.yaml order', async () => {
  const dir = await makeWorkspace('version: "1.0"\norder:\n  experiences: [exp-b, exp-a]\n')
  try {
    const profile = await new YamlWorkspaceLoader().load(dir)
    assert.deepEqual(profile.identity.experienceIds, ['exp-b', 'exp-a'])
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('provena.yaml order referencing an unknown id fails validation', async () => {
  const dir = await makeWorkspace('version: "1.0"\norder:\n  experiences: [exp-a, exp-does-not-exist]\n')
  try {
    await assert.rejects(() => new YamlWorkspaceLoader().load(dir), /exp-does-not-exist/)
  } finally {
    await rm(dir, { recursive: true })
  }
})
