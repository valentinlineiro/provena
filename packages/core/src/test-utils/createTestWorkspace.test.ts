import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createTestWorkspace } from './createTestWorkspace.js'

test('createTestWorkspace creates synthetic workspace files and cleans up', async () => {
  const ws = await createTestWorkspace({ personName: 'Jane Doe', title: 'Lead Architect' })
  assert.ok(fs.existsSync(ws.rootDir))
  assert.ok(fs.existsSync(path.join(ws.rootDir, 'provena.yaml')))
  assert.ok(fs.existsSync(path.join(ws.rootDir, 'person.yaml')))
  assert.ok(fs.existsSync(path.join(ws.rootDir, 'experience.yaml')))
  assert.ok(fs.existsSync(path.join(ws.rootDir, 'capabilities.yaml')))

  const personYaml = fs.readFileSync(path.join(ws.rootDir, 'person.yaml'), 'utf-8')
  assert.ok(personYaml.includes('Jane Doe'))
  assert.ok(personYaml.includes('Lead Architect'))

  ws.cleanup()
  assert.equal(fs.existsSync(ws.rootDir), false)
})
