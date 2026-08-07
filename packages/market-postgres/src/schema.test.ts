import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

test('schema.sql includes all relational tables, views, and indexes', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'packages/market-postgres/src/schema.sql'), 'utf8')
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunities'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_postings'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_posting_history'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS opportunity_assessments'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS assessment_evidences'))
  assert.ok(sql.includes('CREATE OR REPLACE VIEW current_opportunity_assessments'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS user_opportunity_decisions'))
  assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS ingestion_runs'))
  assert.ok(sql.includes('idx_assessments_keyset'))
})
