import { readFileSync, writeFileSync } from 'node:fs'

const dir = new URL('.', import.meta.url).pathname
const split = JSON.parse(readFileSync(`${dir}split.json`, 'utf8'))
const D = new Set(split.discovery)

const decode = s => s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")

const res = await fetch('https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true')
const data = await res.json()
const matched = data.jobs.filter(j => D.has(String(j.id)))
const missing = [...D].filter(id => !matched.some(j => String(j.id) === id))

const strip = s => decode(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const body = matched.map(j => {
  const desc = strip(j.content ?? '')
  return `## ${j.id} — ${j.title}\n\n${desc}`
}).join('\n\n---\n\n')

writeFileSync(`${dir}source.md`, `# K12-GTM-001 Discovery Source (${matched.length}/37)\n\nMissing: ${missing.join(', ') || 'none'}\n\n${body}`, 'utf-8')
console.log(`Wrote ${matched.length} Discovery descriptions to source.md`)
