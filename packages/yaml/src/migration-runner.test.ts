import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyMigrations, type Migration } from './migration-runner.js'

test('no migrations returns data unchanged', () => {
  const result = applyMigrations(1, { foo: 'bar' }, [])
  assert.equal(result.migrated, false)
  assert.equal(result.version, 1)
  assert.deepEqual(result.data, { foo: 'bar' })
})

test('single migration is applied', () => {
  const addField: Migration = {
    from: 1, to: 2,
    migrate: (d) => ({ ...d, newField: 'added' }),
  }
  const result = applyMigrations(1, { foo: 'bar' }, [addField])
  assert.equal(result.migrated, true)
  assert.equal(result.version, 2)
  assert.deepEqual(result.data, { foo: 'bar', newField: 'added' })
})

test('chain of migrations runs in order', () => {
  const m1: Migration = { from: 1, to: 2, migrate: (d) => ({ ...d, step: '1' }) }
  const m2: Migration = { from: 2, to: 3, migrate: (d) => ({ ...d, step: '2' }) }
  const result = applyMigrations(1, {}, [m1, m2])
  assert.equal(result.version, 3)
  assert.deepEqual(result.data, { step: '2' })
})

test('already current version does not migrate', () => {
  const m: Migration = { from: 1, to: 2, migrate: (d) => ({ ...d, x: 'y' }) }
  const result = applyMigrations(2, { a: 1 }, [m])
  assert.equal(result.migrated, false)
  assert.equal(result.version, 2)
  assert.deepEqual(result.data, { a: 1 })
})

test('default version 1 for undefined input', () => {
  const result = applyMigrations(undefined as unknown as number, { x: 1 }, [])
  assert.equal(result.version, 1)
})
