/// <reference types="@cloudflare/workers-types" />
import { computeCareerCompass, narrateCompass, cvReadiness } from './compass.js'
import { profileToTimeline, cvProjector, evaluateOpportunity } from '@provena/core'
import type { CVContext, CVProjection } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'
import { HtmlResumeRenderer } from '@provena/html'
import profile, { updatedAt } from './profile.js'

const TIMELINE = profileToTimeline(profile, updatedAt)

const COMPASS_HTML = (() => {
  const compass = computeCareerCompass(profile)
  const n = narrateCompass(compass, TIMELINE)
  const sections = [
    '<div class="status ' + (compass.readiness === 'ready' ? 'ok' : compass.readiness === 'unknown' ? 'neutral' : 'warn') + '">' + n.status + '</div>',
    '<p class="headline">' + n.headline + '</p>',
    n.strengths.length ? '<div class="fact"><span class="label">Strengths</span><ul>' + n.strengths.map(s => '<li>' + s + '</li>').join('') + '</ul></div>' : '',
    n.gapLabel ? '<div class="fact"><span class="label">Evidence gap</span><ul><li>' + n.gapLabel + '</li></ul></div>' : '',
    '<div class="fact"><span class="label">Next step</span><p>' + n.nextStep + '</p></div>',
    n.why.length ? '<details class="why"><summary>Why this conclusion</summary><ul>' + n.why.map(l => '<li>' + l + '</li>').join('') + '</ul></details>' : '',
  ].filter(Boolean).join('')
  return sections
})()

interface Env {
  PROVENA_KV: KVNamespace
}

interface Capture {
  id: string
  content: string
  createdAt: string
  status: 'pending'
}

const EVENTS = ['timeline_open', 'capture_created', 'capture_curated', 'current_chapter_clicked'] as const
type EventName = (typeof EVENTS)[number]

async function recordEvent(env: Env, name: EventName) {
  const raw = await env.PROVENA_KV.get('events', 'json')
  const events = (raw as { events: { name: EventName; at: string }[] } | null)?.events ?? []
  events.push({ name, at: new Date().toISOString() })
  await env.PROVENA_KV.put('events', JSON.stringify({ events }))
}

export function siteNav(section: 'story' | 'prepare' | 'evaluate'): string {
  const link = (label: string, href: string, active: boolean) =>
    '<a' + (active ? ' class="active"' : '') + ' href="' + href + '">' + label + '</a>'
  const sections = [
    { label: 'Story', href: '/', id: 'story' as const },
    { label: 'Prepare', href: '/cv', id: 'prepare' as const },
    { label: 'Evaluate', href: '/evaluate', id: 'evaluate' as const },
  ]
  return (
    '<nav class="site">' +
    '<a class="brand" href="/">Provena</a>' +
    '<div class="links">' + sections.map(s => link(s.label, s.href, s.id === section)).join('') + '</div>' +
    '</nav>'
  )
}

const PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Professional Journey</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
@media (max-width: 480px) { body { padding: 0.75rem; } main { margin-top: 1rem; } }
main { max-width: 34rem; margin: 2rem auto; }
.hero { padding: 0.5rem 0 1rem; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
section { margin-top: 1.5rem; }
h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 0.5rem; }
.chapter { background: #1a1a1a; color: #fff; border-radius: 0.75rem; padding: 1.25rem; }
.chapter .kicker { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; }
.chapter .role { font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem; }
.chapter .org { color: #ccc; font-size: 0.875rem; }
.chapter .meta { color: #aaa; font-size: 0.875rem; margin-top: 0.5rem; }
.chapter .continue { margin-top: 1rem; width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #fff; color: #1a1a1a; border: none; border-radius: 0.5rem; cursor: pointer; }
.compass { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; }
.compass .status { font-size: 0.95rem; font-weight: 700; display: flex; align-items: center; gap: 0.375rem; }
.compass .status::before { content: ''; width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #2e7d32; flex: 0 0 auto; }
.compass .status.warn::before { background: #b26a00; }
.compass .status.neutral::before { background: #999; }
.compass .headline { font-size: 0.9rem; line-height: 1.6; color: #333; margin-top: 0.375rem; }
.compass .fact { margin-top: 0.75rem; }
.compass .label { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; }
.compass ul { margin: 0.25rem 0 0 1.125rem; }
.compass li { font-size: 0.875rem; color: #333; }
.compass .fact p { font-size: 0.875rem; color: #333; margin-top: 0.25rem; }
.compass details { margin-top: 0.75rem; }
.compass details summary { font-size: 0.8125rem; color: #666; }
.compass details ul { margin: 0.5rem 0 0 1.125rem; }
.experience { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; margin-bottom: 0.5rem; }
.experience .role { font-weight: 600; font-size: 1rem; }
.experience .org { color: #555; font-size: 0.875rem; }
.experience .dates { color: #999; font-size: 0.75rem; }
.experience .hitos { color: #777; font-size: 0.75rem; margin-top: 0.25rem; }
.experience .caps { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.375rem; }
.tag { background: #efefef; color: #333; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 999px; }
.ok { color: #2e7d32; font-size: 0.875rem; }
details summary { cursor: pointer; font-size: 0.8125rem; color: #666; padding: 0.25rem 0; }
.capture { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.75rem; margin-bottom: 0.5rem; }
.capture p { font-size: 0.875rem; }
.capture time { color: #999; font-size: 0.75rem; }
button { width: 100%; padding: 0.75rem; font-size: 1rem; font-weight: 500; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 0.75rem; }
button:active { opacity: 0.8; }
textarea { width: 100%; min-height: 5rem; font-size: 1rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
.quick { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.375rem; }
.quick button { width: auto; padding: 0.375rem 0.75rem; font-size: 0.875rem; background: #fff; color: #1a1a1a; border: 1px solid #ccc; margin: 0; }
#status { margin-top: 0.75rem; font-size: 0.875rem; color: #666; }
.hidden { display: none; }
.site { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; margin-bottom: 0.625rem; }
.site .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site .links a { font-size: 0.875rem; color: #999; text-decoration: none; padding-bottom: 0.125rem; }
.site .links a.active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; }
</style>
<main>
${siteNav('story')}
<div class="hero">
  <h1 id="name"></h1>
  <p class="subtitle" id="title"></p>
</div>

<section>
  <h2>Current chapter</h2>
  <div class="chapter" id="chapter">
    <div class="kicker">Now</div>
    <div class="role" id="chapter-role"></div>
    <div class="org" id="chapter-org"></div>
    <div class="meta" id="chapter-meta"></div>
    <button class="continue" onclick="chapterClick()">Continue this story</button>
  </div>
</section>

<section id="add-form" class="hidden">
  <div class="quick" id="quick"></div>
  <textarea id="content" placeholder="I just..."></textarea>
  <button onclick="save()">Add to my story</button>
  <p id="status"></p>
</section>

<section>
  <h2>Career Compass</h2>
  <div class="compass" id="compass"></div>
</section>

<section>
  <h2>Recent evidence</h2>
  <div id="captures"></div>
  <p id="captures-empty" class="hidden ok">✓ Story is up to date. Nothing pending.</p>
</section>

<section>
  <details>
    <summary id="experiences-summary"></summary>
    <div id="experiences"></div>
  </details>
</section>
</main>
<script>
const profile = ${JSON.stringify(profile)}
const timeline = ${JSON.stringify(TIMELINE)}

document.getElementById('name').textContent = profile.identity.person.name
document.getElementById('title').textContent = timeline.title

const current = timeline.experiences.find(e => !e.end)
document.getElementById('chapter-role').textContent = current.title
document.getElementById('chapter-org').textContent = current.organization
document.getElementById('chapter-meta').innerHTML =
  (current.hitos || 0) + (current.hitos === 1 ? ' milestone' : ' milestones') + ' · Last evolution: <span id="last-evo">…</span>'

document.getElementById('experiences-summary').textContent =
  'See full story (' + timeline.experiences.length + ' experiences)'

document.getElementById('compass').innerHTML = ${JSON.stringify(COMPASS_HTML)}

document.getElementById('experiences').innerHTML = timeline.experiences.map(e => {
  const dates = e.end ? e.start + ' — ' + e.end : e.start + ' — present'
  return '<div class="experience"><div class="role">' + e.title + '</div>' +
    '<div class="org">' + e.organization + '</div>' +
    '<div class="dates">' + dates + '</div>' +
    (e.hitos ? '<div class="hitos">' + e.hitos + (e.hitos === 1 ? ' milestone' : ' milestones') + '</div>' : '') +
    '<div class="caps">' + e.capabilities.map(c => '<span class="tag">' + c + '</span>').join('') + '</div></div>'
}).join('')

const PROMPTS = ['I just finished…', 'I learned…', 'I achieved…', 'I am working on…']
document.getElementById('quick').innerHTML = PROMPTS.map(p => '<button onclick="setPrompt(\\'' + p + '\\')">' + p.replace('…', '') + '</button>').join('')

function setPrompt(p) {
  const ta = document.getElementById('content')
  ta.value = p.replace('…', '') + ' '
  ta.placeholder = ''
  ta.focus()
}

function showAdd() {
  document.getElementById('add-form').classList.remove('hidden')
  document.getElementById('add-form').scrollIntoView({ behavior: 'smooth' })
}

function chapterClick() {
  fire('current_chapter_clicked')
  showAdd()
}

function fire(name) {
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: name }),
  }).catch(() => {})
}

function daysSince(dateStr) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days <= 0) return 'today'
  return days + (days === 1 ? ' day ago' : ' days ago')
}

async function loadCaptures() {
  let inbox = []
  try {
    const res = await fetch('/api/captures')
    if (!res.ok) throw new Error('bad response')
    inbox = (await res.json()).inbox
  } catch {
    document.getElementById('last-evo').textContent = daysSince(timeline.updatedAt)
    document.getElementById('captures-empty').textContent = "Couldn't load recent evidence — try reopening."
    document.getElementById('captures-empty').classList.remove('hidden', 'ok')
    return
  }
  const dates = inbox.map(c => c.createdAt)
  const lastEvo = dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : timeline.updatedAt
  document.getElementById('last-evo').textContent = daysSince(lastEvo)
  if (inbox.length === 0) {
    document.getElementById('captures-empty').classList.remove('hidden')
  } else {
    document.getElementById('captures').innerHTML = inbox.map(c =>
      '<div class="capture"><p>' + c.content + '</p><time>' + c.createdAt + '</time></div>'
    ).join('')
  }
}

async function save() {
  const content = document.getElementById('content').value.trim()
  if (!content) return
  document.getElementById('status').textContent = 'Saving...'
  const res = await fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (res.ok) {
    document.getElementById('status').textContent = '✓ Added to your story'
    document.getElementById('content').value = ''
    fire('capture_created')
    loadCaptures()
  } else {
    document.getElementById('status').textContent = 'Error: ' + (await res.text())
  }
}

loadCaptures()
fire('timeline_open')
</script>`

const markdownRenderer = new MarkdownResumeRenderer()
const htmlRenderer = new HtmlResumeRenderer()

const compassForPage = computeCareerCompass(profile)
const SUGGESTIONS = {
  strengths: compassForPage.strengths.map(s => s.name),
  gapLabel: compassForPage.gaps[0] ? compassForPage.gaps[0]!.organization + ' (' + compassForPage.gaps[0]!.milestones + ' milestone(s))' : '',
}

const CV_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Prepare</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
@media (max-width: 480px) { body { padding: 0.75rem; } main { margin-top: 1rem; } }
main { max-width: 40rem; margin: 2rem auto; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
input, select { width: 100%; padding: 0.5rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.375rem; font-family: inherit; }
.check { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.check label { display: flex; align-items: center; gap: 0.25rem; text-transform: none; letter-spacing: 0; color: #333; font-size: 0.8125rem; background: #efefef; border-radius: 999px; padding: 0.25rem 0.625rem; margin: 0; }
.check input { width: auto; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
pre { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; font-size: 0.8125rem; white-space: pre-wrap; margin-top: 0.75rem; max-height: 24rem; overflow: auto; }
.meta { background: #fffbe6; border: 1px solid #e6d98a; border-radius: 0.5rem; padding: 0.625rem; font-size: 0.8125rem; color: #6b5b00; margin-top: 1rem; display: none; }
.row { display: flex; gap: 0.5rem; }
.row button { flex: 1; }
.site { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; margin-bottom: 0.625rem; }
.site .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site .links a { font-size: 0.875rem; color: #999; text-decoration: none; padding-bottom: 0.125rem; }
.site .links a.active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; }
.your-cv { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; }
</style>
<main>
${siteNav('prepare')}
<h1>Prepare</h1>
<p class="subtitle">Target a role, review suggestions, export.</p>

<section>
  <label for="role">Target role</label>
  <input id="role" list="roles" placeholder="Staff Software Engineer">
  <datalist id="roles">
    <option value="Senior Software Engineer">
    <option value="Staff Software Engineer">
    <option value="Principal Software Engineer">
  </datalist>
</section>

<section>
  <label for="audience">Audience</label>
  <select id="audience">
    <option value="hiring-manager">Hiring manager</option>
    <option value="recruiter">Recruiter</option>
  </select>
</section>

<section>
  <label>Generate summary automatically</label>
  <div class="check"><label><input type="checkbox" id="autoSummary"> Auto-generate</label></div>
</section>

<section>
  <label>Experiences (uncheck to exclude)</label>
  <div class="check" id="experiences"></div>
</section>

<section>
  <label>Suggested emphasis (from your strengths — edit freely)</label>
  <div class="check" id="caps"></div>
</section>

<div class="meta" id="meta"></div>
<div class="meta" id="readiness"></div>

<div class="your-cv">Your CV</div>
<div class="row">
  <button onclick="exportMd()">Download .md</button>
  <button onclick="exportHtml()">Open HTML / Print PDF</button>
</div>

<pre id="preview"></pre>
</main>
<script>
const profile = ${JSON.stringify(profile)}
const suggestions = ${JSON.stringify(SUGGESTIONS)}
const params = new URLSearchParams(location.search)
const prefillRole = params.get('role')
if (prefillRole) document.getElementById('role').value = prefillRole
const prefillEmphasize = (params.get('emphasize') || '').split(',').filter(Boolean)

document.getElementById('experiences').innerHTML = profile.identity.experienceIds.map(id => {
  const e = profile.experiences.find(x => x.id === id)
  if (!e) return ''
  return '<label><input type="checkbox" data-exp="' + id + '" checked> ' + e.organization + '</label>'
}).join('')

const capNames = [...suggestions.strengths]
for (const name of prefillEmphasize) if (!capNames.includes(name)) capNames.push(name)
document.getElementById('caps').innerHTML = capNames.map(s =>
  '<label><input type="checkbox" data-cap="' + s + '" checked> ' + s + '</label>'
).join('')
document.querySelectorAll('[data-cap]').forEach(el => {
  if (prefillEmphasize.length && !prefillEmphasize.includes(el.dataset.cap)) el.checked = false
})

function buildContext() {
  const role = document.getElementById('role').value.trim()
  const audience = document.getElementById('audience').value
  const excludeExperienceIds = [...document.querySelectorAll('[data-exp]')]
    .filter(el => !el.checked).map(el => el.dataset.exp)
  const emphasize = [...document.querySelectorAll('[data-cap]')]
    .filter(el => el.checked).map(el => el.dataset.cap)
  return {
    targetRole: role || undefined,
    audience,
    excludeExperienceIds,
    emphasize,
    generateSummary: document.getElementById('autoSummary').checked ? true : undefined,
  }
}

let lastResult = null

async function preview() {
  const res = await fetch('/api/cv/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildContext()),
  })
  if (!res.ok) { document.getElementById('preview').textContent = 'Error: ' + await res.text(); return }
  lastResult = await res.json()
  document.getElementById('preview').textContent = lastResult.markdown
  const cv = lastResult.cv
  const parts = []
  parts.push('Included ' + cv.experiences.length + ' of ' + profile.identity.experienceIds.length + ' experiences.')
  const meta = document.getElementById('meta')
  meta.textContent = parts.join(' ')
  meta.style.display = parts.length ? 'block' : 'none'
  const readiness = document.getElementById('readiness')
  readiness.textContent = lastResult.readiness ? '⚠ ' + lastResult.readiness : ''
  readiness.style.display = lastResult.readiness ? 'block' : 'none'
}

function exportMd() {
  if (!lastResult) return
  const blob = new Blob([lastResult.markdown], { type: 'text/markdown' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'cv.md'
  a.click()
}

function exportHtml() {
  if (!lastResult) return
  const w = window.open('', '_blank')
  if (w) { w.document.write(lastResult.html); w.document.close(); w.focus() }
}

document.getElementById('role').addEventListener('input', preview)
document.getElementById('audience').addEventListener('change', preview)
document.getElementById('autoSummary').addEventListener('change', preview)
document.getElementById('experiences').addEventListener('change', preview)
document.getElementById('caps').addEventListener('change', preview)

preview()
</script>
`

const EVALUATE_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Evaluate</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
@media (max-width: 480px) { body { padding: 0.75rem; } main { margin-top: 1rem; } }
main { max-width: 40rem; margin: 2rem auto; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
textarea { width: 100%; min-height: 12rem; font-size: 0.875rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
.card { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; margin-top: 1rem; }
.card .verdict { font-size: 1.125rem; font-weight: 700; }
.card .verdict.apply { color: #2e7d32; }
.card .verdict.consider { color: #b26a00; }
.card .verdict.skip { color: #c62828; }
.card h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-top: 1rem; }
.card ul { margin: 0.25rem 0 0 1.125rem; }
.card li { font-size: 0.875rem; color: #333; margin-bottom: 0.375rem; }
.card .trace { font-size: 0.8125rem; color: #555; margin-top: 0.25rem; }
.meta { color: #777; font-size: 0.8125rem; margin-top: 0.5rem; }
.site { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; margin-bottom: 0.625rem; }
.site .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site .links a { font-size: 0.875rem; color: #999; text-decoration: none; padding-bottom: 0.125rem; }
.site .links a.active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; }
</style>
<main>
${siteNav('evaluate')}
<h1>Evaluate an opportunity</h1>
<p class="subtitle">Paste a job description. Provena looks for signals it can honestly evaluate against your profile.</p>
<label for="jd">Job description</label>
<textarea id="jd" placeholder="Staff Software Engineer..."></textarea>
<button onclick="evaluate()">Evaluate</button>
<div id="result"></div>
</main>
<script>
const result = document.getElementById('result')
let lastEv = null
async function evaluate() {
  const jd = document.getElementById('jd').value.trim()
  if (!jd) return
  result.innerHTML = '<p class="meta">Evaluating...</p>'
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd }),
  })
  if (!res.ok) { result.innerHTML = '<p class="meta">Error: ' + await res.text() + '</p>'; return }
  const ev = await res.json()
  lastEv = ev
  result.innerHTML = renderResult(ev)
}
function checkIcon(status) {
  return status === 'violated' ? '✗' : status === 'satisfied' ? '✓' : '?'
}
function renderResult(ev) {
  const parts = []
  parts.push('<div class="card"><div class="verdict ' + ev.verdict + '">' + ev.verdict.toUpperCase() + '</div>')
  parts.push('<h3>Criteria</h3><ul>')
  parts.push(ev.criteria.map(c => '<li>' + checkIcon(c.status) + ' <strong>' + c.criterion + '</strong> — ' + c.detail + '</li>').join(''))
  parts.push('</ul>')
  if (ev.demonstrated.length) {
    parts.push('<h3>Can demonstrate</h3><ul>')
    parts.push(ev.demonstrated.map(m => '<li>✓ <strong>' + m.capabilityName + '</strong>' +
      '<div class="trace">JD: "' + m.matchedPhrases.join('", "') + '" → your evidence: ' + m.evidence.join('; ') + '</div></li>').join(''))
    parts.push('</ul>')
  }
  if (ev.gaps.length) {
    parts.push('<h3>Gaps</h3><ul>')
    parts.push(ev.gaps.map(m => '<li>△ <strong>' + m.capabilityName + '</strong> — recognized but no recorded evidence</li>').join(''))
    parts.push('</ul>')
  }
  parts.push('<h3>Not evaluated</h3>')
  parts.push('<p class="meta">' + ev.notEvaluated + ' part(s) of the description could not be read against the profile vocabulary.</p>')
  parts.push('<p class="meta">Coverage ' + Math.round(ev.coverage * 100) + '% · Interpreted ' + Math.round(ev.interpretationCoverage * 100) + '% · Confidence ' + Math.round(ev.confidence * 100) + '%</p>')
  if (ev.verdict === 'apply') parts.push('<button onclick="prepare()">Prepare application</button>')
  parts.push('</div>')
  return parts.join('')
}
function prepare() {
  const dc = lastEv ? lastEv.decisionContext || {} : {}
  const q = new URLSearchParams()
  if (dc.targetRole) q.set('role', dc.targetRole)
  if (dc.emphasize && dc.emphasize.length) q.set('emphasize', dc.emphasize.join(','))
  location.href = '/cv?' + q.toString()
}
</script>
`

async function renderCV(context: CVContext): Promise<CVProjection> {
  return cvProjector(profile, context)
}

function cvContextFromBody(body: unknown): CVContext {
  const b = body as Record<string, unknown>
  const list = (v: unknown): string[] => Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
  return {
    targetRole: typeof b.targetRole === 'string' ? b.targetRole : undefined,
    audience: b.audience === 'recruiter' || b.audience === 'hiring-manager' ? b.audience : undefined,
    emphasize: list(b.emphasize),
    omit: list(b.omit),
    includeExperienceIds: list(b.includeExperienceIds),
    excludeExperienceIds: list(b.excludeExperienceIds),
    generateSummary: b.generateSummary === true ? true : undefined,
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'GET' && url.pathname === '/api/captures') {
      const raw = await env.PROVENA_KV.get('inbox', 'json')
      const inbox = (raw as { inbox: Capture[] } | null)?.inbox ?? []
      return new Response(JSON.stringify({ inbox }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/event') {
      try {
        const body = (await request.json()) as { event?: string }
        if (!body.event || !(EVENTS as readonly string[]).includes(body.event)) {
          return new Response('Unknown event', { status: 400 })
        }
        await recordEvent(env, body.event as EventName)
        return new Response('ok', { status: 200 })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/capture') {
      try {
        const body = (await request.json()) as { content?: string }
        if (!body.content || typeof body.content !== 'string') {
          return new Response('Missing content', { status: 400 })
        }

        const capture: Capture = {
          id: `capture-${Date.now()}`,
          content: body.content.trim(),
          createdAt: new Date().toISOString().split('T')[0]!,
          status: 'pending',
        }

        const raw = await env.PROVENA_KV.get('inbox', 'json')
        const existing = raw as { inbox: Capture[] } | null
        const inbox = existing?.inbox ?? []
        inbox.push(capture)
        await env.PROVENA_KV.put('inbox', JSON.stringify({ inbox }))

        return new Response(JSON.stringify({ id: capture.id }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

    if (request.method === 'GET' && url.pathname === '/cv') {
      return new Response(CV_PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/cv/preview') {
      try {
        const body = await request.json()
        const context = cvContextFromBody(body)
        const cv = await renderCV(context)
        return new Response(JSON.stringify({
          cv,
          readiness: cvReadiness(context, compassForPage),
          markdown: markdownRenderer.render(cv),
          html: htmlRenderer.render(cv),
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

    if (request.method === 'GET' && url.pathname === '/evaluate') {
      return new Response(EVALUATE_PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'POST' && url.pathname === '/api/evaluate') {
      try {
        const body = (await request.json()) as { jd?: string }
        if (!body.jd || typeof body.jd !== 'string') {
          return new Response('Missing jd', { status: 400 })
        }
        return new Response(JSON.stringify(evaluateOpportunity(body.jd, profile)), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

    return new Response('Not found', { status: 404 })
  },
}
