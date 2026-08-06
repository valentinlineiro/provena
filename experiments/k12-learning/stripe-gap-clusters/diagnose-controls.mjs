import { readFileSync } from 'node:fs'
import {
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
} from '/home/valentin/code/provena/packages/core/src/index.ts'

const dir = 'experiments/k12-learning/stripe-gap-clusters/'
const split = JSON.parse(readFileSync(dir + 'split.json', 'utf8'))
const delta = JSON.parse(readFileSync(dir + 'delta-gtm.json', 'utf8'))
const asK = d => ({ name: d.family, version: d.knowledgeBaseVersion, patterns: d.patterns })
const k1 = new DeclarativeMarketRecognizer(composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, asK(delta)))

const decode = s => s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
const strip = s => decode(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const res = await fetch('https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true')
const byId = new Map((await res.json()).jobs.map(j => [String(j.id), j]))

for (const id of split.controls) {
  const j = byId.get(id)
  const jd = strip(j?.content ?? '')
  const m1 = k1.extractMarketRequirements(jd)
  const deltaReqs = m1.requirements.filter(q => delta.patterns.some(p => p.concept === q.concept))
  if (deltaReqs.length) {
    console.log('LEAK', id, '|', j?.title, '|', deltaReqs.map(q => `${q.concept}[${q.rawText}]`).join(', '))
  }
}
