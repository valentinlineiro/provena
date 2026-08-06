import { readFileSync } from 'node:fs'
import {
  DeclarativeMarketRecognizer,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
} from '/home/valentin/code/provena/packages/core/src/index.ts'

const dir = new URL('.', import.meta.url).pathname
const delta = JSON.parse(readFileSync(`${dir}delta-gtm.json`, 'utf8'))
const text = readFileSync(`${dir}source.md`, 'utf8')

const strip = s => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
const desc = text.split(/^## /m).slice(1).map(b => {
  const [head, ...rest] = b.split('\n')
  return { id: head.split(/[ —]/)[0], jd: strip(rest.join('\n')) }
})

const asKnowledge = d => ({
  name: d.family,
  version: d.knowledgeBaseVersion,
  patterns: d.patterns,
})

const k0 = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)
const k1 = new DeclarativeMarketRecognizer(composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, asKnowledge(delta)))

let cov0 = 0, cov1 = 0, req0 = 0, req1 = 0
for (const { id, jd } of desc) {
  const m0 = k0.extractMarketRequirements(jd)
  const m1 = k1.extractMarketRequirements(jd)
  cov0 += m0.recognitionCoverage
  cov1 += m1.recognitionCoverage
  req0 += m0.requirements.length
  req1 += m1.requirements.length
}

const n = desc.length
console.log(`Discovery (${n}):`)
console.log(`  K0 coverage mean = ${(cov0 / n).toFixed(3)}  (reqs ${req0})`)
console.log(`  K1 coverage mean = ${(cov1 / n).toFixed(3)}  (reqs ${req1})`)
console.log(`  RecoveryGain     = ${((cov1 - cov0) / n).toFixed(3)}`)
