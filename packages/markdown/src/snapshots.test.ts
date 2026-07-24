import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { MarkdownResumeRenderer } from './markdown-resume.js'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Test User', title: 'Engineer', summary: 'A summary.', urls: {} },
      metadata: { id: 'default', createdAt: '', updatedAt: '', version: 1 },
      experienceIds: ['exp-1'],
      projectIds: ['proj-1'],
      educationIds: ['edu-1'],
      publicationIds: ['pub-1'],
      certificationIds: ['cert-1'],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{
      id: 'exp-1',
      organization: 'Test Corp',
      title: 'Senior Engineer',
      start: '2023-01',
      end: '2024-06',
      summary: 'Led a team.',
      achievements: ['Shipped feature X', 'Reduced bugs by 50%'],
      technologies: ['TypeScript', 'Rust'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [{
      id: 'proj-1',
      name: 'Open Source Lib',
      role: 'Maintainer',
      description: 'A useful library.',
      url: 'https://github.com/test/lib',
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    education: [{
      id: 'edu-1',
      institution: 'University',
      degree: 'BS',
      field: 'Computer Science',
      start: '2015',
      end: '2019',
    }],
    publications: [{
      id: 'pub-1',
      title: 'A Paper',
      authors: ['Test User', 'Co-author'],
      venue: 'Journal of Things',
      date: '2023',
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    certifications: [{
      id: 'cert-1',
      name: 'AWS Certified',
      issuer: 'Amazon',
      date: '2023',
      evidenceIds: [],
    }],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'TypeScript', description: 'Expert-level', evidenceIds: ['ev-1'] }],
    evidence: [{ id: 'ev-1', type: 'experience', description: 'Shipped it', date: '2023' }],
  }
}

test('markdown snapshot matches expected output', () => {
  const profile = makeProfile()
  const model = resumeProjector.project(profile)
  const renderer = new MarkdownResumeRenderer()
  const output = renderer.render(model)
  assert.match(output, /# Test User/)
  assert.match(output, /## About/)
  assert.match(output, /A summary\./)
  assert.match(output, /## Experience/)
  assert.match(output, /### Test Corp/)
  assert.match(output, /\*\*Senior Engineer\*\* \| Jan 2023 — Jun 2024/)
  assert.match(output, /Shipped feature X/)
  assert.match(output, /## Projects/)
  assert.match(output, /\[Open Source Lib\]\(https:\/\/github\.com\/test\/lib\)/)
  assert.match(output, /## Education/)
  assert.match(output, /### BS in Computer Science/)
  assert.match(output, /University \| 2015 — 2019/)
  assert.match(output, /## Publications/)
  assert.match(output, /## Certifications/)
  assert.match(output, /AWS Certified/)
  assert.match(output, /## Skills/)
  assert.match(output, /\*\*TypeScript\*\* \(1 pieces of evidence\)/)
  assert.match(output, /Expert-level/)
})
