import { describe, it, expect } from 'vitest'
import { validate } from '../src/validate.js'
import type { Profile } from '../src/types.js'

describe('validate with contributions', () => {
  it('passes for valid contributions', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: ['exp-1'],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: ['cap-1'],
        contributionIds: ['contrib-1'],
      },
      experiences: [
        { id: 'exp-1', organization: 'Org', title: 'Role', start: '2025', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }
      ],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [{ id: 'cap-1', name: 'Cap', evidenceIds: [] }],
      evidence: [{ id: 'ev-1', type: 'experience', description: 'Desc' }],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'exp-1',
          summary: 'Summary',
          capabilityIds: ['cap-1'],
          evidenceIds: ['ev-1'],
          scope: { level: 'team', affectedTeams: 2 },
        }
      ],
    }
    expect(validate(profile)).toEqual([])
  })

  it('fails if experienceRef points to unknown experience', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: [],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: [],
        contributionIds: ['contrib-1'],
      },
      experiences: [],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [],
      evidence: [],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'unknown-exp',
          summary: 'Summary',
          capabilityIds: [],
          evidenceIds: [],
        }
      ],
    }
    const errors = validate(profile)
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.experienceRef',
      message: 'Reference to unknown id "unknown-exp"',
    }))
  })

  it('fails if affectedTeams is less than 1', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: ['exp-1'],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: [],
        contributionIds: ['contrib-1'],
      },
      experiences: [
        { id: 'exp-1', organization: 'Org', title: 'Role', start: '2025', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }
      ],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [],
      evidence: [],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'exp-1',
          summary: 'Summary',
          capabilityIds: [],
          evidenceIds: [],
          scope: { level: 'team', affectedTeams: 0 },
        }
      ],
    }
    const errors = validate(profile)
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.scope.affectedTeams',
      message: 'affectedTeams must be greater than 0',
    }))
  })

  it('fails if capabilityIds or evidenceIds reference unknown entities', () => {
    const profile: Profile = {
      identity: {
        person: { name: 'Test', urls: {} },
        experienceIds: ['exp-1'],
        projectIds: [],
        educationIds: [],
        publicationIds: [],
        certificationIds: [],
        recommendationIds: [],
        capabilityIds: [],
        contributionIds: ['contrib-1'],
      },
      experiences: [
        { id: 'exp-1', organization: 'Org', title: 'Role', start: '2025', achievements: [], technologies: [], capabilityIds: [], evidenceIds: [] }
      ],
      projects: [],
      education: [],
      publications: [],
      certifications: [],
      recommendations: [],
      capabilities: [],
      evidence: [],
      contributions: [
        {
          id: 'contrib-1',
          experienceRef: 'exp-1',
          summary: 'Summary',
          capabilityIds: ['unknown-cap'],
          evidenceIds: ['unknown-ev'],
        }
      ],
    }
    const errors = validate(profile)
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.capabilityIds',
      message: 'Reference to unknown id "unknown-cap"',
    }))
    expect(errors).toContainEqual(expect.objectContaining({
      path: 'contribution.contrib-1.evidenceIds',
      message: 'Reference to unknown id "unknown-ev"',
    }))
  })
})
