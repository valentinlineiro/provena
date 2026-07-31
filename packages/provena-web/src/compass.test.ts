import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCareerCompass, narrateCompass } from './compass.js'
import type { CareerTimeline } from './compass.js'
import timeline from './timeline.js'

const COMPASS = computeCareerCompass(timeline)

test('engine derives facts from the real timeline', () => {
  assert.equal(COMPASS.positioning, 'market-ready')
  assert.equal(COMPASS.readiness, 'ready')
  assert.equal(COMPASS.confidence, 1)
  assert.deepEqual(COMPASS.strengths[0]!, { name: 'Java', count: 4 })
  assert.equal(COMPASS.strengths[1]!.name, 'Spring Boot')
  assert.equal(COMPASS.gaps[0]!.organization, 'VINCLE')
  assert.equal(COMPASS.gaps[0]!.milestones, 2)
  assert.equal(COMPASS.nextBestImprovement.target, 'VINCLE')
})

test('narrator renders the market-ready compass', () => {
  const n = narrateCompass(COMPASS, timeline)
  assert.equal(n.status, 'Ready to explore the market')
  assert.equal(n.headline, 'Your recorded experience supports a move to Staff Software Engineer opportunities.')
  assert.deepEqual(n.strengths, ['Java', 'Spring Boot', 'Python'])
  assert.equal(n.gapLabel, 'VINCLE (2 milestones)')
  assert.equal(n.nextStep, 'Document one high-impact milestone from that period, or one demonstrating cross-team impact.')
  assert.match(n.why[1]!, /^Story updated /)
})

test('narrator exposes concrete evidence for every claim', () => {
  const n = narrateCompass(COMPASS, timeline)
  assert.equal(n.why[0], '23 documented milestones')
  assert.match(n.why[1]!, /^Story updated (today|\d+ (day|days) ago)$/)
  assert.equal(n.why[2], 'Current Staff Software Engineer positioning')
  assert.equal(n.why[3], 'Consistent strengths in Java, Spring Boot, Python')
})

test('low-evidence profile produces developing positioning', () => {
  const sparse: CareerTimeline = {
    title: 'Senior Software Engineer',
    updatedAt: '2026-07-30',
    experiences: [{
      organization: 'Acme',
      title: 'Engineer',
      start: '2025-01',
      end: null,
      hitos: 2,
      capabilities: ['Java'],
    }],
  }
  const compass = computeCareerCompass(sparse)
  assert.equal(compass.positioning, 'developing')
  assert.equal(compass.readiness, 'building')
  assert.equal(compass.confidence, 2 / 15)
  const n = narrateCompass(compass, sparse)
  assert.equal(n.status, 'Still developing')
  assert.equal(n.headline, 'Your story is still developing toward Senior Software Engineer opportunities.')
  assert.deepEqual(n.strengths, ['Java'])
  assert.equal(n.nextStep, 'Document one high-impact milestone from that period, or one demonstrating cross-team impact.')
})
