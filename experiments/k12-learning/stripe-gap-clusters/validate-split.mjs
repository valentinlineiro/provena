import { readFileSync } from 'node:fs'

const dir = new URL('.', import.meta.url).pathname
const split = JSON.parse(readFileSync(`${dir}split.json`, 'utf8'))
const source = JSON.parse(readFileSync(`${dir}candidate-delta.json`, 'utf8'))

const failures = []
const D = split.discovery
const H = split.virginHoldout
const C = split.controls

const srcIds = new Set(source.observedExternalIds)

const uniq = arr => new Set(arr).size === arr.length
if (!uniq(D)) failures.push('Discovery has duplicate IDs')
if (!uniq(H)) failures.push('VirginHoldout has duplicate IDs')
if (!uniq(C)) failures.push('Controls has duplicate IDs')

const DH = [...D, ...H]
if (new Set(DH).size !== DH.length) failures.push('Discovery ∩ VirginHoldout ≠ ∅')

const sourceIds = source.observedExternalIds
if (new Set(sourceIds).size !== sourceIds.length) failures.push('source candidate-delta.json has duplicate ids')
for (const id of [...D, ...H]) {
  if (!srcIds.has(id)) failures.push(`ID ${id} not in source candidate-delta.json`)
}
if (new Set(DH).size !== new Set(sourceIds).size) failures.push('Discovery ∪ VirginHoldout ≠ source (56)')
if (D.length !== 37) failures.push(`|Discovery| = ${D.length}, expected 37`)
if (H.length !== 19) failures.push(`|VirginHoldout| = ${H.length}, expected 19`)

const controlsIntersect = C.filter(id => srcIds.has(id))
if (controlsIntersect.length) failures.push(`Controls intersects GTM source: ${controlsIntersect}`)

if (failures.length) {
  console.error('SPLIT INVALID:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`split OK: D=${D.length} H=${H.length} C=${C.length} | D∪H=${DH.length} unique | Controls∉GTM`)
