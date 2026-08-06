import { readFileSync } from 'node:fs'

const dir = 'experiments/k12-learning/stripe-gap-clusters/'
const split = JSON.parse(readFileSync(dir + 'u2-split-final.json', 'utf8'))
const raw = JSON.parse(readFileSync(dir + 'u2-universe-raw.json', 'utf8'))
const gtmNew = new Set(JSON.parse(readFileSync(dir + 'gtm-u2-new.json', 'utf8')))

const failures = []
const D = split.discovery
const H = split.virginHoldout
const C = split.controls

const pureNew = new Set(raw.pureNewGtm)
const positiveGtm = new Set([...raw.gtmU1, ...raw.u1Controls, ...pureNew])

const uniq = arr => new Set(arr).size === arr.length
if (!uniq(D)) failures.push('Discovery has duplicate IDs')
if (!uniq(H)) failures.push('VirginHoldout has duplicate IDs')
if (!uniq(C)) failures.push('Controls has duplicate IDs')

const DH = [...D, ...H]
if (new Set(DH).size !== DH.length) failures.push('Discovery ∩ VirginHoldout ≠ ∅')
if (new Set(DH).size !== new Set(pureNew).size) failures.push('Discovery ∪ VirginHoldout ≠ pureNewGtm (28)')
for (const id of DH) if (!pureNew.has(id)) failures.push(`ID ${id} not in pureNewGtm`)

if (D.length !== 19) failures.push(`|Discovery| = ${D.length}, expected 19`)
if (H.length !== 9) failures.push(`|VirginHoldout| = ${H.length}, expected 9`)
if (C.length !== 14) failures.push(`|Controls| = ${C.length}, expected 14`)

const cInGtm = C.filter(id => positiveGtm.has(id))
if (cInGtm.length) failures.push(`Controls intersects positive GTM: ${cInGtm}`)

if (failures.length) {
  console.error('U2 SPLIT INVALID:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
console.log(`u2 split OK: D=${D.length} H=${H.length} C=${C.length} | D∪H=28 pure GTM | Controls=14 ∉ GTM`)
