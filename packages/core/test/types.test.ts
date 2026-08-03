import { describe, it, expect } from 'vitest'
import type { Contribution, Profile, Identity } from '../src/index.js'

describe('Contribution types', () => {
  it('instantiates a valid Contribution entity structure', () => {
    const contribution: Contribution = {
      id: 'summa-clean-architecture',
      experienceRef: 'summa-networks',
      summary: 'Designed a Clean Architecture proposal for HSS backend.',
      period: { start: '2025-11' },
      outcome: { summary: 'Adopted as SMSC architecture foundation.' },
      scope: { level: 'product', role: 'initiator', affectedTeams: 3 },
      capabilityIds: ['software-architecture'],
      technologies: ['java', 'spring'],
      evidenceIds: [],
    }

    expect(contribution.id).toBe('summa-clean-architecture')
    expect(contribution.scope?.level).toBe('product')
  })
})
