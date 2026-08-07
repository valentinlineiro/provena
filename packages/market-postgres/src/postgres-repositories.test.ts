import { test } from 'node:test'
import assert from 'node:assert/strict'
import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  PostgresMarketAssessmentRepository,
  PostgresUserDecisionRepository,
  PostgresObservationSourceRepository,
} from './index.js'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://provena:provena@localhost:5432/provena_test'

test('PostgresMarketAssessmentRepository module exports class with expected methods', () => {
  assert.equal(typeof PostgresMarketAssessmentRepository, 'function')
  assert.equal(typeof PostgresMarketAssessmentRepository.prototype.saveAssessment, 'function')
  assert.equal(typeof PostgresMarketAssessmentRepository.prototype.getCurrentAssessment, 'function')
})

test('PostgresUserDecisionRepository module exports class with expected methods', () => {
  assert.equal(typeof PostgresUserDecisionRepository, 'function')
  assert.equal(typeof PostgresUserDecisionRepository.prototype.setDecision, 'function')
  assert.equal(typeof PostgresUserDecisionRepository.prototype.getDecision, 'function')
})

test('PostgresObservationSourceRepository module exports class with expected methods', () => {
  assert.equal(typeof PostgresObservationSourceRepository, 'function')
  assert.equal(typeof PostgresObservationSourceRepository.prototype.list, 'function')
  assert.equal(typeof PostgresObservationSourceRepository.prototype.upsert, 'function')
  assert.equal(typeof PostgresObservationSourceRepository.prototype.delete, 'function')
})

test('PostgresMarketAssessmentRepository and PostgresUserDecisionRepository database operations', async () => {
  let sql: postgres.Sql

  try {
    sql = postgres(DATABASE_URL, { max: 1 })
    await sql`SELECT 1`
  } catch {
    console.log('Skipping Postgres repository integration test: Database connection failed.')
    return
  }

  try {
    const schemaSql = readFileSync(join(import.meta.dirname, 'schema.sql'), 'utf-8')
    await sql.unsafe(schemaSql)

    // Seed test opportunity
    await sql`INSERT INTO opportunities (id, company_name, title, normalized_title)
              VALUES ('opp-test-1', 'Test Corp', 'Senior Engineer', 'senior engineer')
              ON CONFLICT (id) DO NOTHING`

    const assessmentRepo = new PostgresMarketAssessmentRepository(sql)
    const decisionRepo = new PostgresUserDecisionRepository(sql)

    // Save assessment
    await assessmentRepo.saveAssessment({
      opportunityId: 'opp-test-1',
      profileId: 'valentin',
      profileVersion: '1.0.0',
      protocolVersion: 1,
      marketKnowledgeVersion: 0,
      recommendation: 'STRONG_FIT',
      decisionTier: 4,
      professionalFit: 8.5,
      personalFit: 9.0,
      confidence: 0.85,
      evidences: [
        {
          capabilityId: 'cap-rust',
          weight: 0.9,
          matchedText: '5 years of Rust experience',
          sourceTaxon: 'skill',
        },
      ],
    })

    const current = await assessmentRepo.getCurrentAssessment('opp-test-1', 'valentin')
    assert.ok(current, 'Assessment should be retrieved from view')
    assert.equal(current.opportunityId, 'opp-test-1')
    assert.equal(current.recommendation, 'STRONG_FIT')
    assert.equal(current.decisionTier, 4)
    assert.equal(current.professionalFit, 8.5)

    // Set decision
    await decisionRepo.setDecision('opp-test-1', 'interested', 'valentin')
    const decision = await decisionRepo.getDecision('opp-test-1', 'valentin')
    assert.equal(decision, 'interested')

    // Upsert decision
    await decisionRepo.setDecision('opp-test-1', 'applied', 'valentin')
    const updatedDecision = await decisionRepo.getDecision('opp-test-1', 'valentin')
    assert.equal(updatedDecision, 'applied')
  } finally {
    await sql.end()
  }
})
