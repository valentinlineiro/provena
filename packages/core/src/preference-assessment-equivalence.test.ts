import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { assessPreferences } from './index.js'
import { PREFERENCE_SETS, JDS } from './preference-assessment-matrix.js'

// Golden captured from the PreferenceSet → preferenceSetToLegacy → assessPreferences(Preferences)
// path before assessPreferences consumed PreferenceSet natively. The refactor must not change it.
const golden = JSON.parse(
  readFileSync(new URL('./preference-assessment.golden.json', import.meta.url), 'utf-8'),
) as Record<string, unknown>

for (const [p, ps] of Object.entries(PREFERENCE_SETS)) {
  for (const [j, jd] of Object.entries(JDS)) {
    test(`shouldMatchPreRefactorAssessmentWhenPreferenceSetIs_${p}_andJdIs_${j}`, () => {
      assert.deepEqual(assessPreferences(jd, ps), golden[`${p}/${j}`])
    })
  }
}

test('shouldIgnoreCompensationPreferredWhenAssessingUntilSemanticsAreAdopted', () => {
  // Current effective behavior: PreferenceSet.compensation.preferred does not influence assessment.
  const [a] = assessPreferences('Software Engineer. Salary: €105,000.', PREFERENCE_SETS.minimumAndPreferred!)
  assert.equal(a!.status, 'acceptable')
})

test('shouldAssessNothingWhenPreferenceSetIsUndefined', () => {
  assert.deepEqual(assessPreferences('Salary: €65,000. Fully remote.', undefined), [])
})
