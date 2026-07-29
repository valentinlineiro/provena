import { mkdir, writeFile } from 'node:fs/promises'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { join } from 'node:path'
import yaml from 'js-yaml'

async function ask(rl: { question: (q: string) => Promise<string> }, prompt: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` [${fallback}]` : ''
  const answer = (await rl.question(`  ${prompt}${hint}: `)).trim()
  return answer || (fallback ?? '')
}

export async function cmdInit(path: string): Promise<void> {
  await mkdir(path, { recursive: true })

  const rl = createInterface({ input, output })

  console.log('')
  console.log('  Let\'s build your professional identity.')
  console.log('  Answer a few questions — you can edit the YAML files later.')
  console.log('')

  const name = await ask(rl, 'Name')
  const title = await ask(rl, 'Current role / title')
  const summary = await ask(rl, 'Short summary (what you do)')
  const skillsRaw = await ask(rl, 'Top skills (comma separated)')
  const github = await ask(rl, 'GitHub URL')
  const linkedin = await ask(rl, 'LinkedIn URL')
  const org = await ask(rl, 'Current employer / organization')
  const expTitle = await ask(rl, 'Your role there')
  const years = await ask(rl, 'Years of experience')

  rl.close()

  const skills = skillsRaw.split(',').map(s => s.trim()).filter(Boolean)
  const capIds = skills.map((_, i) => `cap-${i + 1}`)

  const now = new Date()
  const startYear = years ? now.getFullYear() - parseInt(years) : now.getFullYear()

  const person: Record<string, unknown> = { name }
  if (title) person.title = title
  if (summary) person.summary = summary
  const urls: Record<string, string> = {}
  if (github) urls.github = github
  if (linkedin) urls.linkedin = linkedin
  if (Object.keys(urls).length > 0) person.urls = urls

  const capabilities = skills.map((s, i) => ({
    id: capIds[i] ?? `cap-${i + 1}`,
    name: s,
    description: '',
    evidenceIds: [] as string[],
  }))

  const experiences = (org && expTitle) ? [{
    id: 'exp-1',
    organization: org,
    title: expTitle,
    start: `${startYear}-01`,
    achievements: [] as string[],
    technologies: skills.length > 0 ? skills : [' '],
    capabilityIds: capIds,
    evidenceIds: [] as string[],
  }] : []

  await writeFile(join(path, 'provena.yaml'), yaml.dump({ version: 1 }))
  await writeFile(join(path, 'person.yaml'), yaml.dump(person))

  if (experiences.length > 0) await writeFile(join(path, 'experience.yaml'), yaml.dump(experiences))
  if (capabilities.length > 0) await writeFile(join(path, 'capabilities.yaml'), yaml.dump(capabilities))

  console.log('')
  console.log(`  ✓ Created workspace at ${path}`)
  console.log('')
  console.log('  Your profile is your source of truth.')
  console.log('  Change one thing, and every output updates.')
  console.log('')
  console.log('  Try it:')
  console.log(`    provena render ${path} --stdout`)
  console.log(`    provena render ${path} --format linkedin --stdout`)
  console.log('')
  console.log('  Then edit person.yaml, change your title, and render again.')
  console.log('  One change. Every format follows.')
}
