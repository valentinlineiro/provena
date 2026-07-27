import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Profile } from '@provena/core'
import { YamlWorkspaceWriter } from './yaml-workspace-writer.js'
import { YamlWorkspaceLoader } from './yaml-workspace-loader.js'

const minimalProfile: Profile = {
  identity: {
    person: { name: 'Test Person', urls: {} },
    experienceIds: ['exp-1'],
    projectIds: [],
    educationIds: [],
    publicationIds: [],
    certificationIds: [],
    recommendationIds: [],
    capabilityIds: [],
  },
  experiences: [
    {
      id: 'exp-1',
      organization: 'Acme',
      title: 'Engineer',
      start: '2020-01',
      achievements: [],
      technologies: [],
      capabilityIds: [],
      evidenceIds: [],
    },
  ],
  projects: [],
  education: [],
  publications: [],
  certifications: [],
  recommendations: [],
  capabilities: [],
  evidence: [],
}

test('YamlWorkspaceWriter creates all YAML files', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-test-'))
  try {
    const writer = new YamlWorkspaceWriter()
    await writer.write(dir, minimalProfile)

    const files = ['provena.yaml', 'person.yaml', 'experience.yaml']
    for (const f of files) {
      const content = await readFile(join(dir, f), 'utf-8')
      assert.ok(content.length > 0, `${f} should not be empty`)
    }
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('YamlWorkspaceWriter roundtrips through YamlWorkspaceLoader', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-test-'))
  try {
    const writer = new YamlWorkspaceWriter()
    await writer.write(dir, minimalProfile)

    const loader = new YamlWorkspaceLoader()
    const { profile } = await loader.load(dir)

    assert.equal(profile.identity.person.name, 'Test Person')
    assert.deepEqual(profile.identity.experienceIds, ['exp-1'])
    assert.equal(profile.experiences.length, 1)
    assert.equal(profile.experiences[0]!.id, 'exp-1')
    assert.equal(profile.experiences[0]!.organization, 'Acme')
  } finally {
    await rm(dir, { recursive: true })
  }
})

test('empty arrays serialize as [] not null', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'provena-writer-test-'))
  try {
    const writer = new YamlWorkspaceWriter()
    await writer.write(dir, minimalProfile)

    const projectsYaml = await readFile(join(dir, 'projects.yaml'), 'utf-8')
    const educationYaml = await readFile(join(dir, 'education.yaml'), 'utf-8')

    assert.match(projectsYaml, /^\[\]$/m)
    assert.match(educationYaml, /^\[\]$/m)
  } finally {
    await rm(dir, { recursive: true })
  }
})
