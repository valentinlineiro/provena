#!/usr/bin/env -S node --import tsx
import { access, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { LinkedInImporter } from '@provena/linkedin-import'
import { resumeProjector, validate, formatValidationErrors } from '@provena/core'
import { jsonResumeProjector, jsonResumeRenderer } from '@provena/jsonresume'
import { linkedInProjector, linkedInRenderer } from '@provena/linkedin'
import { YamlWorkspaceLoader, YamlWorkspaceWriter, merge } from '@provena/yaml'
import { MarkdownResumeRenderer } from '@provena/markdown'
import { HtmlResumeRenderer } from '@provena/html'
import { cmdInit } from './init.js'
import type { Profile } from '@provena/core'

async function cmdImportLinkedin(
  zipPath: string,
  workspacePath: string,
  opts: { fresh: boolean },
): Promise<void> {
  const importer = new LinkedInImporter()
  const imported = await importer.read(zipPath)

  const workspaceExists = await access(join(workspacePath, 'provena.yaml')).then(() => true).catch(() => false)

  let profile: Profile

  if (workspaceExists && opts.fresh) {
    err(`Workspace at "${workspacePath}" already exists. Use --fresh only on empty workspaces.`)
  }

  if (workspaceExists && !opts.fresh) {
    const loader = new YamlWorkspaceLoader()
    const loaded = await loader.load(workspacePath)
    profile = merge(imported, loaded.profile)
  } else {
    profile = {
      identity: {
        person: imported.identity?.person ?? { name: 'Imported', urls: {} },
        experienceIds: imported.experiences?.map((e) => e.id) ?? [],
        projectIds: imported.projects?.map((p) => p.id) ?? [],
        educationIds: imported.education?.map((e) => e.id) ?? [],
        publicationIds: imported.publications?.map((p) => p.id) ?? [],
        certificationIds: imported.certifications?.map((c) => c.id) ?? [],
        recommendationIds: imported.recommendations?.map((r) => r.id) ?? [],
        capabilityIds: imported.capabilities?.map((c) => c.id) ?? [],
      },
      experiences: imported.experiences ?? [],
      projects: imported.projects ?? [],
      education: imported.education ?? [],
      publications: imported.publications ?? [],
      certifications: imported.certifications ?? [],
      recommendations: imported.recommendations ?? [],
      capabilities: imported.capabilities ?? [],
      evidence: [],
    }
  }

  const errors = validate(profile)
  if (errors.length > 0) {
    err(`Validation failed:\n${formatValidationErrors(errors)}`)
  }

  const writer = new YamlWorkspaceWriter()
  await writer.write(workspacePath, profile)

  console.log(`✓ Imported from "${zipPath}" into "${workspacePath}"`)
}

interface FormatEntry {
  project: (profile: Profile) => unknown
  render: (model: unknown) => string
  ext: string
}

const FORMAT_REGISTRY: Record<string, FormatEntry> = {
  markdown: {
    project: (p) => resumeProjector.project(p),
    render: (m) => new MarkdownResumeRenderer().render(m as never),
    ext: 'md',
  },
  jsonresume: {
    project: (p) => jsonResumeProjector.project(p),
    render: (m) => jsonResumeRenderer.render(m as never),
    ext: 'json',
  },
  html: {
    project: (p) => resumeProjector.project(p),
    render: (m) => new HtmlResumeRenderer().render(m as never),
    ext: 'html',
  },
  linkedin: {
    project: (p) => linkedInProjector.project(p),
    render: (m) => linkedInRenderer.render(m as never),
    ext: 'linkedin.md',
  },
}

const [, , command, ...args] = process.argv

function help(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(`Provena — canonical professional identity

Usage:
  provena render <workspace> [options]
  provena validate <workspace>
  provena init <workspace> [options]
  provena import linkedin <export.zip> [options]
  provena --help

Commands:
  render    Generate output from a workspace
  validate  Check workspace integrity
  init      Create a new workspace from a template
  import    Import data into a workspace from external sources

Options:
  --format <format>  Output format: ${formatsList()}
  --stdout           Write to stdout instead of file
  --help             Show this message
`)
}

function formatsList(): string { return Object.keys(FORMAT_REGISTRY).join(' | ') }

function renderHelp(stream: NodeJS.WriteStream = process.stdout): void {
  stream.write(`Usage: provena render <workspace> [options]

Generate output from a workspace.

Arguments:
  workspace           Path to workspace directory

Options:
  --format <format>   Output format: ${formatsList()}
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
        console.error(`Error: --format requires a value (${formatsList()})`)
        process.exit(2)
      }
      if (!(val in FORMAT_REGISTRY)) {
        console.error(`Error: unknown format "${val}". Use ${formatsList()}.`)
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
  const entry = FORMAT_REGISTRY[opts.format]
  if (!entry) err(`Unknown format "${opts.format}". Use: ${formatsList()}`)

  const loader = new YamlWorkspaceLoader()
  const { profile } = await loader.load(path)
  const model = entry.project(profile)
  const output = entry.render(model)

  if (opts.stdout) {
    console.log(output)
  } else {
    const outPath = join(path, `resume.${entry.ext}`)
    await writeFile(outPath, output, 'utf-8')
    console.log(`Written: ${outPath}`)
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
} else if (command === 'init') {
  const path = args[0]
  if (!path || path === '--help') {
    console.error('Usage: provena init <workspace> [--template default|consultant|academic]')
    process.exit(1)
  }
  const template = args.includes('--template')
    ? args[args.indexOf('--template') + 1] ?? 'default'
    : 'default'
  try {
    await cmdInit(path, template)
  } catch (e) {
    err(e instanceof Error ? e.message : String(e))
  }
} else if (command === 'import') {
  const subcommand = args[0]
  if (subcommand === 'linkedin') {
    const zipPath = args[1]
    if (!zipPath || zipPath.startsWith('--')) {
      err('Usage: provena import linkedin <export.zip> [--workspace <path>] [--fresh]')
    }
    let workspacePath = '.'
    let fresh = false
    for (let i = 2; i < args.length; i++) {
      if (args[i] === '--workspace') workspacePath = args[++i] ?? '.'
      else if (args[i] === '--fresh') fresh = true
    }
    try { await cmdImportLinkedin(zipPath, workspacePath, { fresh }) }
    catch (e) { err(e instanceof Error ? e.message : String(e)) }
  } else {
    err(`Unknown import source: "${subcommand}". Available: linkedin`)
  }
} else {
  err(`Unknown command: "${command}"`, 'Available commands: render, validate, init')
}
