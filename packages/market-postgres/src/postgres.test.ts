import { test } from 'node:test'
import postgres from 'postgres'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runMarketRepositoryContractTests } from '@provena/core/contract-tests'
import {
  PostgresMarketOpportunityRepository,
  PostgresMarketPostingRepository,
  PostgresMarketModelStore,
} from './index.js'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://provena:provena@localhost:5432/provena_test'

test('Postgres Market Repositories Contract Tests', async () => {
  let sql: postgres.Sql

  try {
    sql = postgres(DATABASE_URL, { max: 1 })
    // Simple ping to test connection
    await sql`SELECT 1`
  } catch (err) {
    console.log('Skipping Postgres integration tests: Database connection failed.')
    return
  }

  // Load and execute schema.sql
  const schemaSql = readFileSync(join(import.meta.dirname, 'schema.sql'), 'utf-8')
  await sql.unsafe(schemaSql)

  const cleanDb = async () => {
    await sql`TRUNCATE TABLE market_models, opportunity_postings, opportunities CASCADE`
  }

  runMarketRepositoryContractTests(
    async () => {
      await cleanDb()
      return new PostgresMarketOpportunityRepository(sql)
    },
    async () => {
      await cleanDb()
      return new PostgresMarketPostingRepository(sql)
    },
    async () => {
      await cleanDb()
      return new PostgresMarketModelStore(sql)
    }
  )
})
