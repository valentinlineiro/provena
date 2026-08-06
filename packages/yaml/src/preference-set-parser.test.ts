import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join } from 'node:path'
import { parsePreferenceSet } from './preference-set-parser.js'
import { YamlWorkspaceLoader } from './yaml-workspace-loader.js'
import { DirectRetrievalPolicy } from '@provena/core'

test('parsePreferenceSet parses structured O2 YAML into PreferenceSet', () => {
  const rawYaml = {
    targets: {
      roleFamilies: ['software-engineering', 'ai-engineering'],
      roleLevels: ['staff', 'principal'],
      workModes: [
        { mode: 'remote', strength: 'required' },
        { mode: 'hybrid', strength: 'preferred' },
      ],
      compensation: { minimum: 100000, preferred: 150000, currency: 'EUR' },
    },
    constraints: {
      excludedRoleFamilies: ['project-management', 'academia'],
      excludedCompanies: [{ name: 'Acme Corp', domain: 'acme.com' }],
      visaSponsorshipRequired: true,
    },
  }

  const ps = parsePreferenceSet(rawYaml)
  assert.ok(ps)
  assert.deepEqual(ps.targets.roleFamilies, ['software-engineering', 'ai-engineering'])
  assert.deepEqual(ps.targets.roleLevels, ['staff', 'principal'])
  assert.equal(ps.targets.workModes?.[0]?.mode, 'remote')
  assert.equal(ps.targets.workModes?.[0]?.strength, 'required')
  assert.deepEqual(ps.constraints.excludedRoleFamilies, ['project-management', 'academia'])
  assert.equal(ps.constraints.excludedCompanies?.[0]?.name, 'Acme Corp')
  assert.equal(ps.constraints.visaSponsorshipRequired, true)
})

test('parsePreferenceSet rejects invalid roleFamily vocabulary', () => {
  const invalidYaml = {
    targets: {
      roleFamilies: ['invalid-family'],
    },
  }
  assert.throws(
    () => parsePreferenceSet(invalidYaml),
    /invalid roleFamily "invalid-family"/,
  )
})

test('parsePreferenceSet rejects invalid roleLevel vocabulary', () => {
  const invalidYaml = {
    targets: {
      roleLevels: ['super-senior'],
    },
  }
  assert.throws(
    () => parsePreferenceSet(invalidYaml),
    /invalid roleLevel "super-senior"/,
  )
})

test('parsePreferenceSet parses legacy preferences format into fallback PreferenceSet', () => {
  const legacyYaml = {
    roles: ['Staff Engineer', 'Principal Engineer'],
    work: { remote: 'required' },
    compensation: { minimum: 80000, currency: '€' },
    avoid: ['Maintenance-only roles'],
  }

  const ps = parsePreferenceSet(legacyYaml)
  assert.ok(ps)
  assert.deepEqual(ps.targets.roleFamilies, ['software-engineering'])
  assert.equal(ps.targets.workModes?.[0]?.mode, 'remote')
  assert.equal(ps.targets.compensation?.minimum, 80000)
  assert.equal(ps.targets.compensation?.currency, 'EUR')
  assert.deepEqual(ps.constraints.legacyAvoidTerms, ['Maintenance-only roles'])
})

test('YamlWorkspaceLoader loads profiles/valentin and attaches valid PreferenceSet', async () => {
  const loader = new YamlWorkspaceLoader()
  const profilePath = join(process.cwd(), 'profiles/valentin')
  const { profile } = await loader.load(profilePath)

  assert.ok(profile.preferenceSet)
  assert.ok(profile.preferenceSet.targets)

  // Verify retrieval policy works end-to-end with loaded profile's preferenceSet
  const policy = new DirectRetrievalPolicy()
  const criteria = policy.toRetrievalCriteria(profile.preferenceSet)

  assert.ok(criteria.activeOnly)
  assert.equal(criteria.limit, 500)
})
