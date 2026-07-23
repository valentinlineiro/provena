#!/usr/bin/env -S node --import tsx
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { resumeProjector } from '@provena/core'
import { jsonResumeProjector, jsonResumeRenderer } from '@provena/jsonresume'
import { YamlWorkspaceLoader } from '@provena/yaml'
import { MarkdownResumeRenderer } from '@provena/markdown'

const [, , command, ...args] = process.argv

function help(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(`Provena — canonical professional identity

Usage:
  provena render <workspace> [options]
  provena validate <workspace>
  provena --help

Commands:
  render    Generate output from a workspace
  validate  Check workspace integrity

Options:
  --format <format>  Output format: markdown (default) | jsonresume
  --stdout           Write to stdout instead of file
  --help             Show this message
`)
}

function renderHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(`Usage: provena render <workspace> [options]

Generate output from a workspace.

Arguments:
  workspace           Path to workspace directory

Options:
  --format <format>   Output format: markdown (default) | jsonresume
  --stdout            Write to stdout instead of file
  --help              Show this message

Examples:
  provena render .
  provena render examples/valen --format jsonresume
  provena render my-profile --stdout > resume.json
`)
}

function parseArgs(argv: string[]): { format: string; stdout: boolean; help: boolean; path?: string } {
  const result = { format: 'markdown', stdout: false, help: false, path: undefined as string | undefined }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!
    if (arg === '--help') result.help = true
    else if (arg === '--stdout') result.stdout = true
    else if (arg === '--format') {
      const val = argv[++i]
      if (!val || val.startsWith('--')) {
        console.error('Error: --format requires a value (markdown | jsonresume)')
        process.exit(2)
      }
      if (val !== 'markdown' && val !== 'jsonresume') {
        console.error(`Error: unknown format "${val}". Use markdown or jsonresume.`)
        process.exit(2)
      }
      result.format = val
    } else if (!arg.startsWith('--')) {
      result.path = arg
    }
  }

  return result
}

function err(msg: string, hint?: string): never {
  console.error(`Error: ${msg}`)
  if (hint) console.error(`\n${hint}`)
  console.error('\nRun `provena --help` for usage.')
  process.exit(1)
}

async function cmdRender(path: string, opts: { format: string; stdout: boolean }): Promise<void> {
  const loader = new YamlWorkspaceLoader()
  const profile = await loader.load(path)

  if (opts.format === 'jsonresume') {
    const model = jsonResumeProjector.project(profile)
    const output = jsonResumeRenderer.render(model)
    if (opts.stdout) {
      console.log(output)
    } else {
      const outPath = join(path, 'resume.json')
      await writeFile(outPath, output, 'utf-8')
      console.log(`Written: ${outPath}`)
    }
  } else {
    const model = resumeProjector.project(profile)
    const output = new MarkdownResumeRenderer().render(model)
    if (opts.stdout) {
      console.log(output)
    } else {
      const outPath = join(path, 'resume.md')
      await writeFile(outPath, output, 'utf-8')
      console.log(`Written: ${outPath}`)
    }
  }
}

async function cmdValidate(path: string): Promise<void> {
  const loader = new YamlWorkspaceLoader()
  await loader.load(path)
  console.log('✓ Workspace is valid')
}

if (!command || command === '--help') {
  help()
  process.exit(0)
}

if (command === 'render') {
  const opts = parseArgs(args)
  if (opts.help) { renderHelp(); process.exit(0) }
  if (!opts.path) err('Missing workspace path.', 'Usage: provena render <workspace>')
  try {
    await cmdRender(opts.path, { format: opts.format, stdout: opts.stdout })
  } catch (e) {
    err(e instanceof Error ? e.message : String(e))
  }
} else if (command === 'validate') {
  const path = args[0]
  if (!path || path === '--help') {
    console.error('Usage: provena validate <workspace>')
    process.exit(1)
  }
  try {
    await cmdValidate(path)
  } catch (e) {
    err(e instanceof Error ? e.message : String(e))
  }
} else {
  err(`Unknown command: "${command}"`, 'Available commands: render, validate')
}
