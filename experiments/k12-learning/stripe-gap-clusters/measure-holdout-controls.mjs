import { readFileSync } from 'node:fs'
import {
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
} from '/home/valentin/code/provena/packages/core/src/index.ts'

const dir = new URL('.', import.meta.url).pathname
const split = JSON.parse(readFileSync(`${dir}split.json`, 'utf8'))
const delta = JSON.parse(readFileSync(`${dir}delta-gtm.json`, 'utf8'))

const asKnowledge = d => ({ name: d.family, version: d.knowledgeBaseVersion, patterns: d.patterns })
const k0 = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
const k1 = new DeclarativeMarketRecognizer(composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, asKnowledge(delta)))

const decode = s => s.replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
  .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'")
const strip = s => decode(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const res = await fetch('https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true')
const jobs = (await res.json()).jobs
const byId = new Map(jobs.map(j => [String(j.id), j]))

function measure(ids) {
  const rows = ids.map(id => {
    const j = byId.get(id)
    const jd = strip(j?.content ?? '')
    const m0 = k0.extractMarketRequirements(jd)
    const m1 = k1.extractMarketRequirements(jd)
    return { id, m0, m1, jd }
  })
  const n = rows.length
  return {
    n,
    cov0: rows.reduce((a, r) => a + r.m0.recognitionCoverage, 0) / n,
    cov1: rows.reduce((a, r) => a + r.m1.recognitionCoverage, 0) / n,
    req0: rows.reduce((a, r) => a + r.m0.requirements.length, 0),
    req1: rows.reduce((a, r) => a + r.m1.requirements.length, 0),
    matchedByDelta: rows.filter(r => r.m1.requirements.some(q => delta.patterns.some(p => p.concept === q.concept))).length,
    rows,
  }
}

const h = measure(split.virginHoldout)
const c = measure(split.controls)

console.log(`Holdout (${h.n}):`)
console.log(`  K0 coverage mean = ${h.cov0.toFixed(3)} (reqs ${h.req0})`)
console.log(`  K1 coverage mean = ${h.cov1.toFixed(3)} (reqs ${h.req1})`)
console.log(`  HoldoutTransfer  = ${(h.cov1 - h.cov0).toFixed(3)}`)
console.log('')
console.log(`Controls (${c.n}):`)
console.log(`  K0 coverage mean = ${c.cov0.toFixed(3)} (reqs ${c.req0})`)
console.log(`  K1 coverage mean = ${c.cov1.toFixed(3)} (reqs ${c.req1})`)
console.log(`  ControlContamination = ${c.matchedByDelta} / ${c.n}`)
