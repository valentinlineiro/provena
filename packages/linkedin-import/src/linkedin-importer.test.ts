import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { LinkedInImporter } from './linkedin-importer.js'

import { deflateRawSync } from 'node:zlib'
function createZipBuffer(files: Record<string, string>): Buffer {
  const localHeaders: Buffer[] = []
  const centralEntries: Buffer[] = []
  let offset = 0

  for (const name of Object.keys(files).sort()) {
    const content = Buffer.from(files[name]!, 'utf-8')
    const compressed = deflateRawSync(content)
    const nameBuf = Buffer.from(name, 'utf-8')

    const lh = Buffer.alloc(30)
    lh.writeUInt32LE(0x04034b50, 0)
    lh.writeUInt16LE(20, 4)
    lh.writeUInt16LE(0, 6)
    lh.writeUInt16LE(8, 8)
    lh.writeUInt16LE(0, 10)
    lh.writeUInt16LE(0, 12)
    lh.writeUInt32LE(0, 14)
    lh.writeUInt32LE(compressed.length, 18)
    lh.writeUInt32LE(content.length, 22)
    lh.writeUInt16LE(nameBuf.length, 26)
    lh.writeUInt16LE(0, 28)

    localHeaders.push(lh, nameBuf, compressed)

    const ce = Buffer.alloc(46)
    ce.writeUInt32LE(0x02014b50, 0)
    ce.writeUInt16LE(20, 4)
    ce.writeUInt16LE(20, 6)
    ce.writeUInt16LE(0, 8)
    ce.writeUInt16LE(8, 10)
    ce.writeUInt16LE(0, 12)
    ce.writeUInt16LE(0, 14)
    ce.writeUInt32LE(0, 16)
    ce.writeUInt32LE(compressed.length, 20)
    ce.writeUInt32LE(content.length, 24)
    ce.writeUInt16LE(nameBuf.length, 28)
    ce.writeUInt16LE(0, 30)
    ce.writeUInt16LE(0, 32)
    ce.writeUInt16LE(0, 34)
    ce.writeUInt16LE(0, 36)
    ce.writeUInt32LE(0, 38)
    ce.writeUInt32LE(offset, 42)

    centralEntries.push(ce, nameBuf)
    offset += lh.length + nameBuf.length + compressed.length
  }

  const cdLength = centralEntries.reduce((s, b) => s + b.length, 0)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(0, 4)
  eocd.writeUInt16LE(0, 6)
  eocd.writeUInt16LE(centralEntries.length / 2, 8)
  eocd.writeUInt16LE(centralEntries.length / 2, 10)
  eocd.writeUInt32LE(cdLength, 12)
  eocd.writeUInt32LE(offset, 16)
  eocd.writeUInt16LE(0, 20)

  return Buffer.concat([...localHeaders, ...centralEntries, eocd])
}

async function withTestZip(
  files: Record<string, string>,
  fn: (path: string) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-test-'))
  const zipPath = join(dir, 'export.zip')
  await writeFile(zipPath, createZipBuffer(files))
  try {
    await fn(zipPath)
  } finally {
    await rm(dir, { recursive: true })
  }
}

test('reads Profile.csv and returns person', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name,Email,Headline,Summary\nAlex,Chen,alex@test.com,Engineer,Good worker\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.identity?.person.name, 'Alex Chen')
    assert.equal(result.identity?.person.email, 'alex@test.com')
    assert.equal(result.identity?.person.title, 'Engineer')
    assert.equal(result.identity?.person.summary, 'Good worker')
  })
})

test('reads Positions.csv and returns experiences', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
    'Positions.csv': 'Company Name,Title,Started On,Finished On,Description\nAcme Corp,Engineer,2020-01,2023-06,Did things\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.experiences?.length, 1)
    assert.equal(result.experiences![0]?.organization, 'Acme Corp')
    assert.equal(result.experiences![0]?.title, 'Engineer')
    assert.equal(result.experiences![0]?.start, '2020-01')
    assert.equal(result.experiences![0]?.end, '2023-06')
    assert.equal(result.experiences![0]?.summary, 'Did things')
  })
})

test('reads Education.csv', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
    'Education.csv': 'School Name,Degree Name,Field Of Study,Started On,Finished On\nMIT,BS,CS,2016-09,2020-06\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.education?.length, 1)
    assert.equal(result.education![0]?.institution, 'MIT')
    assert.equal(result.education![0]?.degree, 'BS')
    assert.equal(result.education![0]?.field, 'CS')
  })
})

test('missing optional CSVs does not fail', async () => {
  await withTestZip({
    'Profile.csv': 'First Name,Last Name\nVal,Tester\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    const result = await importer.read(zipPath)
    assert.equal(result.identity?.person.name, 'Val Tester')
    assert.equal(result.experiences?.length, 0)
  })
})

test('missing Profile.csv throws', async () => {
  await withTestZip({
    'Positions.csv': 'Company Name,Title\nAcme,Eng\n',
  }, async (zipPath) => {
    const importer = new LinkedInImporter()
    await assert.rejects(() => importer.read(zipPath), /Profile\.csv/)
  })
})

test('non-zip file throws', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'linkedin-test-'))
  try {
    const path = join(dir, 'not-a-zip.txt')
    await writeFile(path, 'hello')
    const importer = new LinkedInImporter()
    await assert.rejects(() => importer.read(path))
  } finally {
    await rm(dir, { recursive: true })
  }
})
