import type { PreferenceSet } from './preference-set.js'

const base = { constraints: {} }

export const PREFERENCE_SETS: Readonly<Record<string, PreferenceSet>> = {
  empty: { targets: {}, constraints: {} },
  minimumOnly: { targets: { compensation: { minimum: 80000, currency: 'EUR' } }, ...base },
  minimumAndPreferred: { targets: { compensation: { minimum: 80000, preferred: 100000, currency: 'EUR' } }, ...base },
  remoteRequired: { targets: { workModes: [{ mode: 'remote', strength: 'required' }] }, ...base },
  remotePreferred: { targets: { workModes: [{ mode: 'remote', strength: 'preferred' }] }, ...base },
  hybridPreferred: { targets: { workModes: [{ mode: 'hybrid', strength: 'preferred' }] }, ...base },
  remoteRequiredAndMinimum: {
    targets: { workModes: [{ mode: 'remote', strength: 'required' }], compensation: { minimum: 80000, currency: 'EUR' } },
    ...base,
  },
  everything: {
    targets: {
      roleFamilies: ['software-engineering'],
      roleLevels: ['staff'],
      workModes: [{ mode: 'remote', strength: 'required' }, { mode: 'hybrid', strength: 'preferred' }],
      compensation: { minimum: 80000, preferred: 100000, currency: 'EUR' },
    },
    constraints: { legacyAvoidTerms: ['crypto'], excludedCompanies: [{ name: 'Acme' }] },
  },
}

export const JDS: Readonly<Record<string, string>> = {
  silent: 'Staff Software Engineer. Join our team.',
  eur65: 'Software Engineer. Salary: €65,000.',
  eur85: 'Software Engineer. Salary: €85,000.',
  eur105: 'Software Engineer. Salary: €105,000.',
  usd160: 'Principal Architect (fully remote). Salary: $160,000 USD.',
  fullRemote: 'Staff Engineer. Fully remote opportunity from Spain.',
  hybrid: 'Software Engineer. Barcelona — Hybrid, 3 days onsite.',
  onsite: 'Responsable de Administración (Presencial). Salario: €30.000 bruto/año.',
  empty: '',
}
