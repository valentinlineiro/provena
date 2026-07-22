#!/usr/bin/env -S node --import tsx
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { toResumeProjection } from '@provena/core'
import { YamlWorkspaceLoader } from '@provena/yaml'
import { MarkdownResumeRenderer } from '@provena/markdown'

const [, , command, workspacePath] = process.argv

function usage(): never {
  console.error('Usage: provena render <workspace>')
  process.exit(1)
}

if (command !== 'render' || !workspacePath) usage()

try {
  const loader = new YamlWorkspaceLoader()
  const profile = await loader.load(workspacePath)
  console.log('✓ Workspace valid')
  console.log('✓ Identity loaded')

  const projection = toResumeProjection(profile)
  console.log('✓ Resume projection generated')

  const renderer = new MarkdownResumeRenderer()
  const output = renderer.render(projection)

  const outPath = join(workspacePath, 'resume.md')
  await writeFile(outPath, output, 'utf-8')
  console.log(`✓ Output written: ${outPath}`)
} catch (err) {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
}
