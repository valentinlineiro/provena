import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumeProjector } from '@provena/core'
import type { Profile } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'
import { HtmlResumeRenderer } from '@provena/html'

function makeProfile(): Profile {
  return {
    identity: {
      person: { name: 'Alex Chen', title: 'Technical Lead', summary: 'Builds distributed systems.', urls: {} },
      experienceIds: ['exp-1'],
      projectIds: [],
      educationIds: [],
      publicationIds: [],
      certificationIds: [],
      recommendationIds: [],
      capabilityIds: ['cap-1'],
    },
    experiences: [{
      id: 'exp-1',
      organization: 'Acme Corp',
      title: 'Technical Lead',
      start: '2022-03',
      achievements: ['Reduced p99 latency by 40%'],
      technologies: ['TypeScript'],
      capabilityIds: ['cap-1'],
      evidenceIds: [],
    }],
    projects: [],
    education: [],
    publications: [],
    certifications: [],
    recommendations: [],
    capabilities: [{ id: 'cap-1', name: 'Distributed Systems', evidenceIds: [] }],
    evidence: [],
  }
}

test('I6: one representation may have multiple artifacts — Markdown and HTML render the same ResumeModel faithfully', () => {
  const model = resumeProjector.project(makeProfile())

  const markdown = new MarkdownResumeRenderer().render(model)
  const html = new HtmlResumeRenderer().render(model)

  assert.notEqual(markdown, html, 'the two artifacts are genuinely different formats')

  for (const fact of ['Alex Chen', 'Acme Corp', 'Technical Lead', 'Reduced p99 latency by 40%', 'TypeScript']) {
    assert.ok(markdown.includes(fact), `markdown is missing "${fact}"`)
    assert.ok(html.includes(fact), `html is missing "${fact}"`)
  }
})
