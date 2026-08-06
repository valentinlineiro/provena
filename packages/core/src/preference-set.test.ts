import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DirectRetrievalPolicy } from './index.js'
import type { PreferenceSet } from './index.js'

// ── Fixtures ─────────────────────────────────────────────────────────────────

const emptyPreferences: PreferenceSet = {
  targets: {},
  constraints: {},
}

const staffEngineerPreferences: PreferenceSet = {
  targets: {
    roleFamilies: ['software-engineering', 'ai-engineering'],
    roleLevels: ['staff', 'principal'],
    workModes: [
      { mode: 'remote', strength: 'required' },
      { mode: 'hybrid', strength: 'preferred' },
    ],
    geographies: [
      { continent: 'Europe', country: 'ES' },
      { continent: 'Europe', country: 'DE' },
    ],
    compensation: { minimum: 120000, preferred: 160000, currency: 'EUR' },
  },
  constraints: {
    excludedCompanies: [
      { name: 'Acme Corp', domain: 'acme.com' },
      { name: 'BadFit Inc' },
    ],
    excludedRoleFamilies: ['project-management', 'academia'],
    legacyAvoidTerms: ['unpaid trial', 'commission-only'],
  },
}

const policyInstance = new DirectRetrievalPolicy()

// ── PreferenceSet shape ───────────────────────────────────────────────────────

test('PreferenceSet accepts empty targets and constraints', () => {
  assert.ok(emptyPreferences)
  assert.deepEqual(emptyPreferences.targets, {})
  assert.deepEqual(emptyPreferences.constraints, {})
})

test('PreferenceSet accepts partial targets (roleFamilies only)', () => {
  const ps: PreferenceSet = {
    targets: { roleFamilies: ['software-engineering'] },
    constraints: {},
  }
  assert.deepEqual(ps.targets.roleFamilies, ['software-engineering'])
  assert.equal(ps.targets.roleLevels, undefined)
})

// ── DirectRetrievalPolicy: empty preferences ─────────────────────────────────

test('DirectRetrievalPolicy produces empty criteria for empty preferences', () => {
  const criteria = policyInstance.toRetrievalCriteria(emptyPreferences)
  assert.deepEqual(criteria.hardExclusions, {})
  assert.deepEqual(criteria.candidateFilters, {})
  assert.equal(criteria.activeOnly, true)
  assert.equal(criteria.limit, 500)
})

// ── DirectRetrievalPolicy: candidate filters ──────────────────────────────────

test('DirectRetrievalPolicy maps roleFamilies to candidateFilters', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.deepEqual(criteria.candidateFilters.roleFamilies, ['software-engineering', 'ai-engineering'])
})

test('DirectRetrievalPolicy maps roleLevels to candidateFilters', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.deepEqual(criteria.candidateFilters.roleLevels, ['staff', 'principal'])
})

test('DirectRetrievalPolicy: required workModes become candidateFilters', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  // Only 'remote' (strength: required) should appear; 'hybrid' (preferred) must not
  assert.deepEqual(criteria.candidateFilters.workModes, ['remote'])
})

test('DirectRetrievalPolicy: preferred workModes do NOT appear in criteria', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.ok(!criteria.candidateFilters.workModes?.includes('hybrid'))
})

test('DirectRetrievalPolicy extracts country codes from geographies', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  // Countries extracted; continents not included (too coarse for candidate filter)
  assert.deepEqual(criteria.candidateFilters.countryCodes, ['ES', 'DE'])
})

test('DirectRetrievalPolicy: geographies with continent only produce no countryCodes', () => {
  const ps: PreferenceSet = {
    targets: {
      geographies: [{ continent: 'Europe' }],
    },
    constraints: {},
  }
  const criteria = policyInstance.toRetrievalCriteria(ps)
  // continent-only target → no country code to filter on
  assert.equal(criteria.candidateFilters.countryCodes, undefined)
})

// ── DirectRetrievalPolicy: hard exclusions ────────────────────────────────────

test('DirectRetrievalPolicy maps excludedCompanies names to hardExclusions', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.deepEqual(criteria.hardExclusions.companyNames, ['Acme Corp', 'BadFit Inc'])
})

test('DirectRetrievalPolicy maps excludedCompanies domains to hardExclusions', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  // Only 'Acme Corp' has a domain; 'BadFit Inc' does not
  assert.deepEqual(criteria.hardExclusions.companyDomains, ['acme.com'])
})

test('DirectRetrievalPolicy maps excludedRoleFamilies to hardExclusions', () => {
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.deepEqual(criteria.hardExclusions.roleFamilies, ['project-management', 'academia'])
})

// ── Principle: required ≠ hard filter ────────────────────────────────────────

test('required workMode does NOT appear in hardExclusions', () => {
  // Retrieval cannot hard-filter on work mode: many JDs omit it.
  // An unknown work mode must survive retrieval and reach K1–K6C.
  const criteria = policyInstance.toRetrievalCriteria(staffEngineerPreferences)
  assert.equal(criteria.hardExclusions.companyNames?.includes('remote'), false)
  // work mode is never a hard exclusion
  assert.equal('workModes' in criteria.hardExclusions, false)
})

// ── compat.ts adapter ────────────────────────────────────────────────────────

// Import directly (not via index) — compat is internal to core
import { preferenceSetToLegacy } from './compat.js'

test('preferenceSetToLegacy forwards roleFamilies as roles', () => {
  const legacy = preferenceSetToLegacy(staffEngineerPreferences)
  assert.deepEqual(legacy.roles, ['software-engineering', 'ai-engineering'])
})

test('preferenceSetToLegacy converts required remote workMode to legacy required', () => {
  const legacy = preferenceSetToLegacy(staffEngineerPreferences)
  assert.equal(legacy.work?.remote, 'required')
})

test('preferenceSetToLegacy forwards compensation minimum', () => {
  const legacy = preferenceSetToLegacy(staffEngineerPreferences)
  assert.equal(legacy.compensation?.minimum, 120000)
  assert.equal(legacy.compensation?.currency, 'EUR')
})

test('preferenceSetToLegacy forwards legacyAvoidTerms as avoid', () => {
  const legacy = preferenceSetToLegacy(staffEngineerPreferences)
  assert.deepEqual(legacy.avoid, ['unpaid trial', 'commission-only'])
})

test('preferenceSetToLegacy excludedCompanies are NOT forwarded to legacy avoid', () => {
  // Structured exclusions are retrieval-only; K5B does not need them
  const legacy = preferenceSetToLegacy(staffEngineerPreferences)
  assert.ok(!legacy.avoid?.includes('Acme Corp'))
})

test('preferenceSetToLegacy produces empty object for empty PreferenceSet', () => {
  const legacy = preferenceSetToLegacy(emptyPreferences)
  assert.equal(legacy.roles, undefined)
  assert.equal(legacy.work, undefined)
  assert.equal(legacy.compensation, undefined)
  assert.equal(legacy.avoid, undefined)
})

test('preferenceSetToLegacy: preferred-only workMode does not populate legacy remote', () => {
  const ps: PreferenceSet = {
    targets: {
      workModes: [{ mode: 'hybrid', strength: 'preferred' }],
    },
    constraints: {},
  }
  const legacy = preferenceSetToLegacy(ps)
  // No 'required' mode → no legacy remote preference
  assert.equal(legacy.work, undefined)
})
