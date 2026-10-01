import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildApplicationKit } from './application-kit.js'
import type { Profile } from './profile.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: {
        name: 'Valen Test',
        email: 'valen@example.com',
        phone: '+34000000000',
        location: 'Cádiz, Spain · Remote',
        title: 'Staff Software Engineer',
        summary: 'Staff engineer focused on architecture and developer productivity. ' + 'x'.repeat(400),
        urls: { linkedin: 'https://linkedin.com/in/valen', github: 'https://github.com/valen' },
        availability: '15 days',
      },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: [],
    },
    experiences: [
      {
        id: 'exp-1',
        organization: 'Acme Corp',
        title: 'Staff Engineer',
        start: '2020-01',
        end: '2024-01',
        achievements: [],
        technologies: ['Java', 'Kafka'],
        capabilityIds: [],
        evidenceIds: [],
      },
    ],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [],
    evidence: [],
    preferenceSet: {
      targets: {
        roleFamilies: ['software-engineering'],
        roleLevels: ['staff'],
        workModes: [{ mode: 'remote', strength: 'required' }],
        languages: [
          { code: 'es', proficiency: 'native' },
          { code: 'en', proficiency: 'fluent' },
        ],
        compensation: { minimum: 80000, currency: 'EUR' },
      },
      constraints: { visaSponsorshipRequired: true },
    },
  }
}

test('shouldProjectEveryKitFieldFromCanonicalProfileWhenProfileIsComplete', () => {
  const profile = makeProfile()
  const kit = buildApplicationKit(profile)
  const person = profile.identity.person

  assert.equal(kit.fullName, person.name)
  assert.equal(kit.email, person.email)
  assert.equal(kit.phone, person.phone)
  assert.equal(kit.location, person.location)
  assert.equal(kit.linkedinUrl, person.urls.linkedin)
  assert.equal(kit.githubUrl, person.urls.github)
  assert.equal(kit.currentTitle, person.title)
  assert.equal(kit.longSummary, person.summary)
  assert.ok(kit.shortSummary.length <= 280)
  assert.ok(person.summary!.startsWith(kit.shortSummary.replace('…', '')))
  assert.deepEqual(kit.technologies, ['Java', 'Kafka'])
  assert.equal(kit.technologiesLine, 'Java, Kafka')
  assert.deepEqual(kit.experienceLines, ['Staff Engineer @ Acme Corp (2020-01 — 2024-01)'])
  assert.equal(kit.totalYearsExperience, 4)
  assert.equal(kit.languagesLine, 'Spanish (native), English (fluent)')
  assert.equal(kit.workAuthorizationLine, 'Requires visa sponsorship')
  assert.equal(kit.salaryLine, 'EUR 80,000+ minimum')
  assert.equal(kit.noticePeriod, person.availability)
  assert.equal(kit.remotePreference, 'Remote only')
})

test('shouldLeaveFieldsEmptyRatherThanInventThemWhenOptionalDataIsMissing', () => {
  const profile = makeProfile()
  const minimal: Profile = {
    ...profile,
    identity: {
      ...profile.identity,
      person: { name: 'No Contact', urls: {} },
    },
    preferenceSet: { targets: {}, constraints: {} },
  }
  const kit = buildApplicationKit(minimal)

  assert.equal(kit.fullName, 'No Contact')
  assert.equal(kit.email, '')
  assert.equal(kit.phone, '')
  assert.equal(kit.salaryLine, '')
  assert.equal(kit.workAuthorizationLine, '')
  assert.equal(kit.remotePreference, '')
  assert.equal(kit.languagesLine, '')
})
