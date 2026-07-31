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

test('narrator renders the market-ready judgment', () => {
  const { judgment, evidence, action } = narrateCompass(COMPASS, timeline)
  assert.equal(
    judgment,
    '<strong>Based on your recorded experience, you\'re ready to explore the market. ' +
    'Your career currently supports a move to Staff Software Engineer opportunities, ' +
    'with clear strengths in Java and Spring Boot.</strong>'
  )
  assert.equal(
    evidence,
    'Your recent work reinforces that positioning, but your story has limited evidence ' +
    'from your time at VINCLE (2017-01 — 2021-06) — currently 2 milestones.'
  )
  assert.equal(
    action,
    '<strong>Next best improvement:</strong> document a milestone from that period, ' +
    'or one that shows impact beyond your immediate team.'
  )
})

test('low-evidence profile produces developing positioning', () => {
  const sparse: CareerTimeline = {
    title: 'Senior Software Engineer',
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
  const { judgment } = narrateCompass(compass, sparse)
  assert.match(judgment, /Your story is still developing toward Senior Software Engineer opportunities, with early strengths in Java/)
})
