import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function findRepoRoot(dir: string): string {
  if (fs.existsSync(path.join(dir, 'PRODUCT.md'))) {
    return dir
  }
  const parent = path.dirname(dir)
  if (parent === dir) throw new Error('Repo root not found')
  return findRepoRoot(parent)
}

const rootDir = findRepoRoot(__dirname)

function readDoc(relPath: string): string {
  const fullPath = path.join(rootDir, relPath)
  return fs.readFileSync(fullPath, 'utf8')
}

test('D1: Hero & Value Proposition contract assertion', () => {
  const readme = readDoc('README.md')
  const landing = readDoc('website/index.md')
  const why = readDoc('website/why.md')
  const product = readDoc('PRODUCT.md')

  assert.ok(product.includes('preserved attention') || product.includes('Preserved human attention'))
  assert.ok(landing.includes('Helping to look less'))
  assert.ok(why.includes('Helping to look less'))
  assert.ok(readme.includes('Helping to look less'))
  assert.ok(landing.includes('Traditional job platforms optimize for engagement'))
  assert.ok(why.includes('Traditional job platforms optimize for engagement'))
  assert.ok(readme.includes('Traditional job platforms optimize for engagement'))
})

test('D2: Canonical Sequence contract assertion', () => {
  const problem = readDoc('website/problem.md')
  const concept = readDoc('website/concept.md')
  const landing = readDoc('website/index.md')

  const expectedNodes = ['Identity', 'Observation', 'Assessment', 'Inbox']
  for (const node of expectedNodes) {
    assert.ok(landing.includes(node), `Landing missing canonical node ${node}`)
    assert.ok(concept.includes(node), `Concept missing canonical node ${node}`)
  }
  assert.ok(problem.includes('Attention'), 'Problem missing Attention focus')
})

test('D3: Architecture Fidelity contract assertion', () => {
  const archWeb = readDoc('website/architecture.md')
  const archDocs = readDoc('docs/architecture.md')

  assert.ok(archWeb.includes('Continuous Market Observation'))
  assert.ok(archDocs.includes('Continuous Market Observation'))
  assert.ok(archWeb.includes('Deterministic Assessment'))
  assert.ok(archDocs.includes('Deterministic Assessment'))
  assert.ok(archWeb.includes('Attention Inbox'))
  assert.ok(archDocs.includes('Attention Inbox'))
  assert.ok(archWeb.includes('Identity Projections'))
  assert.ok(archDocs.includes('Identity Projections'))
})

test('D4: Scenario Alignment contract assertion', () => {
  const useCases = readDoc('website/use-cases.md')

  assert.ok(useCases.includes('1. Continuous Market Observation'))
  assert.ok(useCases.includes('2. Attention Inbox'))
  assert.ok(useCases.includes('3. Career Knowledge'))
  assert.ok(useCases.includes('4. Identity Projections'))
  assert.ok(!useCases.includes('## Developer'))
  assert.ok(!useCases.includes('## Freelancer'))
})

test('D5: Roadmap Stage Continuum contract assertion', () => {
  const roadmapWeb = readDoc('website/roadmap.md')
  const roadmapDocs = readDoc('docs/roadmap.md')

  assert.ok(roadmapWeb.includes('Foundation'))
  assert.ok(roadmapDocs.includes('Foundation'))
  assert.ok(roadmapWeb.includes('Platform'))
  assert.ok(roadmapDocs.includes('Platform'))
  assert.ok(roadmapWeb.includes('Validation'))
  assert.ok(roadmapDocs.includes('Validation'))
  assert.ok(roadmapWeb.includes('v0.7.1'))
  assert.ok(roadmapDocs.includes('v0.7.1'))
})

test('D6: Web-First Onboarding contract assertion', () => {
  const quickstart = readDoc('website/quickstart.md')

  assert.ok(quickstart.includes('Build your professional identity'))
  assert.ok(quickstart.includes('Connect market sources'))
  assert.ok(quickstart.includes('Review your Attention Inbox'))
  assert.ok(quickstart.includes('Optional: Use the CLI'))
})
