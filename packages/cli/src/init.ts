import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const templatesDir = join(__dirname, '..', 'templates')

const TEMPLATES = ['default', 'consultant', 'academic'] as const

export function listTemplates(): string[] {
  return [...TEMPLATES]
}

export async function cmdInit(path: string, template: string = 'default'): Promise<void> {
  if (!TEMPLATES.includes(template as typeof TEMPLATES[number])) {
    throw new Error(
      `Unknown template "${template}". Available: ${TEMPLATES.join(', ')}`
    )
  }

  try {
    await mkdir(path, { recursive: true })
  } catch {
    throw new Error(`Cannot create directory "${path}"`)
  }

  const srcDir = join(templatesDir, template)
  const files = await readdir(srcDir).catch(() => {
    throw new Error(`Template "${template}" not found at ${srcDir}`)
  })

  for (const file of files) {
    const content = await readFile(join(srcDir, file), 'utf-8')
      .catch(() => { throw new Error(`Cannot read template file "${file}"`) })
    await writeFile(join(path, file), content, 'utf-8')
  }

  console.log(`✓ Created workspace at ${path}`)
  console.log(`  Template: ${template}`)
  console.log('')
  console.log('Next steps:')
  console.log(`  1. Edit the YAML files in ${path}`)
  console.log('  2. Run render:')
  console.log(`     provena render ${path}`)
}
