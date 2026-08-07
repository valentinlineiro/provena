/// <reference types="@cloudflare/workers-types" />
import { renderAppShell, APP_SHELL_CSS } from './shell.js'
import { computeCareerCompass, narrateCompass, cvReadiness } from './compass.js'
import {
  profileToTimeline,
  cvProjector,
  evaluateOpportunity,
  composeKnowledge,
  DEFAULT_SOFTWARE_KNOWLEDGE,
  ADMIN_KNOWLEDGE,
  MLOPS_KNOWLEDGE,
  DATA_AGENTIC_KNOWLEDGE,
  resolveRequirements,
  evaluateSufficiency,
  projectProfessionalFit,
  assessPreferences,
  projectPersonalFit,
  computeRecognitionCoverage,
  applyPolicy,
  UrlOpportunitySource,
  GreenhousePublicSource,
  reconcileBoardSync,
  MarketFeedService,
  MarketIngestionEngine,
  DeclarativeMarketRecognizer,
  encodeBookmark,
  decodeBookmark,
} from '@provena/core'
import {
  PostgresMarketOpportunityRepository,
  PostgresMarketPostingRepository,
  PostgresMarketModelStore,
  PostgresMarketAssessmentRepository,
  PostgresUserDecisionRepository,
  PostgresOpportunitySearchAdapter,
  PostgresObservationSourceRepository,
} from '@provena/market-postgres'
import postgres from 'postgres'
import type { CVContext, CVProjection, OpportunityUserDecision, AttentionTab } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'
import { HtmlResumeRenderer } from '@provena/html'
import profile, { updatedAt } from './profile.js'
import { KvOpportunityRepository } from './kv-opportunity-repository.js'

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
  DATABASE_URL?: string
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

const PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Professional Journey</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; }
.hero { padding: 0.5rem 0 1rem; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
section { margin-top: 1.5rem; }
section:first-child { margin-top: 0; }
h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 0.5rem; }
.chapter { background: #1a1a1a; color: #fff; border-radius: 0.75rem; padding: 1.25rem; }
.chapter .kicker { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #aaa; }
.chapter .role { font-size: 1.25rem; font-weight: 700; margin-top: 0.25rem; }
.chapter .org { color: #ccc; font-size: 0.875rem; }
.chapter .meta { color: #aaa; font-size: 0.875rem; margin-top: 0.5rem; }
.chapter .continue { margin-top: 1rem; width: 100%; padding: 0.75rem; min-height: 44px; font-size: 0.875rem; font-weight: 600; background: #fff; color: #1a1a1a; border: none; border-radius: 0.5rem; cursor: pointer; }
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
.market-banner { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; }
.market-banner .header { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #666; display: flex; align-items: center; gap: 0.5rem; font-weight: 600; }
.market-banner .pulse { width: 0.5rem; height: 0.5rem; border-radius: 50%; background: #2e7d32; box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4); animation: pulse-ring 2s infinite; display: inline-block; }
@keyframes pulse-ring { 0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.7); } 70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(46, 125, 50, 0); } 100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(46, 125, 50, 0); } }
.market-banner .stats { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; margin-top: 0.75rem; }
.market-banner .stat-box { background: #f9f9f9; border: 1px solid #efefef; border-radius: 0.375rem; padding: 0.5rem; }
.market-banner .stat-val { font-size: 1.125rem; font-weight: 700; color: #1a1a1a; }
.market-banner .stat-lbl { font-size: 0.6875rem; color: #666; text-transform: uppercase; letter-spacing: 0.04em; }
.market-banner .action { margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; border-top: 1px solid #efefef; padding-top: 0.5rem; }
.market-banner .action a { color: #1a1a1a; font-weight: 600; text-decoration: none; }
.market-banner .action a:hover { text-decoration: underline; }
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
button { width: 100%; padding: 0.75rem; min-height: 44px; font-size: 1rem; font-weight: 500; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 0.75rem; }
button:active { opacity: 0.8; }
.action-bar button { margin-top: 0; }
textarea { width: 100%; min-height: 5rem; font-size: 1rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
.quick { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.375rem; }
.quick button { width: auto; min-height: 44px; padding: 0.5rem 0.75rem; font-size: 0.875rem; background: #fff; color: #1a1a1a; border: 1px solid #ccc; margin: 0; }
#status { margin-top: 0.75rem; font-size: 0.875rem; color: #666; }
.hidden { display: none; }
</style>
${renderAppShell(
  'story',
  '<div class="hero">' +
  '<h1 id="name"></h1>' +
  '<p class="subtitle" id="title"></p>' +
  '</div>',
  '<div class="split-view" style="--split-threshold: 56rem;">' +
  '<div style="flex: 1.5;">' +
  '<section>' +
  '<h2>Current chapter</h2>' +
  '<div class="chapter" id="chapter">' +
  '<div class="kicker">Now</div>' +
  '<div class="role" id="chapter-role"></div>' +
  '<div class="org" id="chapter-org"></div>' +
  '<div class="meta" id="chapter-meta"></div>' +
  '<button class="continue" onclick="chapterClick()">Continue this story</button>' +
  '</div>' +
  '</section>' +
  '<section id="add-form" class="hidden">' +
  '<div class="quick" id="quick"></div>' +
  '<textarea id="content" placeholder="I just..."></textarea>' +
  '<div class="action-bar">' +
  '<button onclick="save()">Add to my story</button>' +
  '</div>' +
  '<p id="status"></p>' +
  '</section>' +
  '<section>' +
  '<h2>Recent evidence</h2>' +
  '<div id="captures"></div>' +
  '<p id="captures-empty" class="hidden ok">✓ Story is up to date. Nothing pending.</p>' +
  '</section>' +
  '<section>' +
  '<details>' +
  '<summary id="experiences-summary"></summary>' +
  '<div id="experiences"></div>' +
  '</details>' +
  '</section>' +
  '</div>' +
  '<div style="flex: 1; display: flex; flex-direction: column; gap: 1.5rem;">' +
  '<section>' +
  '<h2>Market Activity</h2>' +
  '<div class="market-banner">' +
  '<div class="header"><span class="pulse"></span><span>Continuous Observation</span></div>' +
  '<div class="stats">' +
  '<div class="stat-box"><div class="stat-val">4 Feeds</div><div class="stat-lbl">Active Sources</div></div>' +
  '<div class="stat-box"><div class="stat-val">1,284</div><div class="stat-lbl">Observed Roles</div></div>' +
  '</div>' +
  '<div class="action">' +
  '<span style="color:#2e7d32; font-weight:600; font-size:0.75rem;">3 require attention</span>' +
  '<a href="/opportunities">Open Inbox →</a>' +
  '</div>' +
  '</div>' +
  '</section>' +
  '<section>' +
  '<h2>Career Compass</h2>' +
  '<div class="compass" id="compass"></div>' +
  '</section>' +
  '</div>' +
  '</div>'
)}
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
<title>Provena — Identity</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; }
.cv-workspace { display: flex; gap: 1.5rem; width: 100%; }
.cv-workspace-sidebar { width: 340px; flex-shrink: 0; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1.5rem; overflow-y: auto; }
.cv-canvas { flex: 1; min-width: 0; padding: 1rem; overflow: auto; display: flex; justify-content: center; align-items: flex-start; }
.cv-sheet { background: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05); max-width: 100%; }
.canonical-banner { background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #1a1a1a; border-radius: 0.375rem; padding: 0.75rem 1rem; margin-top: 0.75rem; }
.canonical-badge { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; color: #1a1a1a; display: inline-block; margin-bottom: 0.25rem; }
.canonical-banner p { font-size: 0.8125rem; color: #4a5568; line-height: 1.4; }
.identity-health { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.75rem; margin-bottom: 1.25rem; }
.identity-health .health-title { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; font-weight: 700; margin-bottom: 0.375rem; }
.identity-health .health-item { font-size: 0.8125rem; color: #334155; margin-top: 0.25rem; }

@container page (max-width: 63.9375rem) {
  .cv-workspace-sidebar { display: none; }
  .cv-sheet { transform: scale(min(1, calc((100vw - 3rem) / 800))); transform-origin: top center; }
}

@container page (min-width: 64rem) {
  .cv-action-bar { display: none; }
}

@media print {
  body { background: #ffffff; padding: 0; margin: 0; }
  .app-header, .site-nav, .cv-action-bar, .cv-workspace-sidebar, .bottom-sheet, .bottom-sheet-overlay { display: none !important; }
  .cv-workspace { display: block; }
  .cv-canvas { display: contents; padding: 0; margin: 0; background: none; }
  .cv-sheet { display: contents; box-shadow: none; padding: 0; margin: 0; background: none; transform: none; }
}

${htmlRenderer.renderStyles()}

h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
input, select { width: 100%; padding: 0.5rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.375rem; font-family: inherit; }
.check { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.check label { display: flex; align-items: center; gap: 0.25rem; text-transform: none; letter-spacing: 0; color: #333; font-size: 0.8125rem; background: #efefef; border-radius: 999px; padding: 0.25rem 0.625rem; margin: 0; }
.check input { width: auto; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
.action-bar button { margin-top: 0; }
pre { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; font-size: 0.8125rem; white-space: pre-wrap; margin-top: 0.75rem; max-height: 24rem; overflow: auto; }
.meta { background: #fffbe6; border: 1px solid #e6d98a; border-radius: 0.5rem; padding: 0.625rem; font-size: 0.8125rem; color: #6b5b00; margin-top: 1rem; display: none; }
.row { display: flex; gap: 0.5rem; }
.row button { flex: 1; }
.your-cv { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; }
</style>
${renderAppShell(
  'prepare',
  '<div class="page-header">' +
  '<h1>Identity</h1>' +
  '<p class="subtitle">Your canonical professional identity model. Maintain it once, derive everywhere.</p>' +
  '<div class="canonical-banner">' +
  '<span class="canonical-badge">Canonical Source of Truth</span>' +
  '<p>This model is the authoritative source used by Career Compass, Protocol v1 market evaluations, and every exported projection.</p>' +
  '</div>' +
  '</div>',
  '<div class="cv-workspace split-view" style="--split-threshold: 64rem;">' +
  '<aside class="cv-workspace-sidebar">' +
  '<div class="identity-health">' +
  '<div class="health-title">Identity Health</div>' +
  '<div class="health-item ok">✓ 100% evidence-backed capabilities</div>' +
  '<div class="health-item ok">✓ 4 active market feeds connected</div>' +
  '<div class="health-item ok">✓ 1,284 opportunities evaluated</div>' +
  '</div>' +
  '<section>' +
  '<label for="role">Projection Target Role</label>' +
  '<input id="role" list="roles" placeholder="Staff Software Engineer">' +
  '<datalist id="roles">' +
  '<option value="Senior Software Engineer">' +
  '<option value="Staff Software Engineer">' +
  '<option value="Principal Software Engineer">' +
  '</datalist>' +
  '</section>' +
  '<section>' +
  '<label for="audience">Audience</label>' +
  '<select id="audience">' +
  '<option value="hiring-manager">Hiring manager</option>' +
  '<option value="recruiter">Recruiter</option>' +
  '</select>' +
  '</section>' +
  '<section>' +
  '<label>Professional summary</label>' +
  '<div class="check"><label><input type="checkbox" id="autoSummary"> Auto-generate from canonical identity</label></div>' +
  '</section>' +
  '<section>' +
  '<label>Included experience</label>' +
  '<div class="check" id="experiences"></div>' +
  '</section>' +
  '<section>' +
  '<label>Recommended focus (derived from Compass strengths)</label>' +
  '<div class="check" id="caps"></div>' +
  '</section>' +
  '<div class="meta" id="meta"></div>' +
  '<div class="meta" id="readiness"></div>' +
  '<div class="your-cv">Export</div>' +
  '<div class="row">' +
  '<button onclick="exportPdf()">Download PDF</button>' +
  '<button onclick="exportJsonResume()" style="background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1;">JSON Resume</button>' +
  '</div>' +
  '</aside>' +
  '<main class="cv-canvas">' +
  '<div class="cv-sheet" id="sheet"></div>' +
  '</main>' +
  '</div>' +
  '<div class="action-bar cv-action-bar">' +
  '<div class="row">' +
  '<button type="button" onclick="openCustomize()" style="background:#f1f5f9; color:#0f172a; border:1px solid #cbd5e1;">Projection Settings</button>' +
  '<button type="button" onclick="exportPdf()">Download PDF</button>' +
  '</div>' +
  '</div>' +
  '<div class="bottom-sheet-overlay" onclick="closeCustomize()"></div>' +
  '<div class="bottom-sheet">' +
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">' +
  '<h2 style="font-size:1rem;font-weight:700;">Projection Settings</h2>' +
  '<button type="button" onclick="closeCustomize()" style="width:auto;margin-top:0;padding:0.375rem 0.75rem;background:#e5e5e5;color:#1a1a1a;">Done</button>' +
  '</div>' +
  '<section>' +
  '<label for="role">Target role</label>' +
  '<input id="role" list="roles-bs" placeholder="Staff Software Engineer">' +
  '<datalist id="roles-bs">' +
  '<option value="Senior Software Engineer">' +
  '<option value="Staff Software Engineer">' +
  '<option value="Principal Software Engineer">' +
  '</datalist>' +
  '</section>' +
  '<section>' +
  '<label for="audience">Audience</label>' +
  '<select id="audience">' +
  '<option value="hiring-manager">Hiring manager</option>' +
  '<option value="recruiter">Recruiter</option>' +
  '</select>' +
  '</section>' +
  '<section>' +
  '<label>Professional summary</label>' +
  '<div class="check"><label><input type="checkbox" id="autoSummary"> Auto-generate from canonical identity</label></div>' +
  '</section>' +
  '<section>' +
  '<label>Included experience</label>' +
  '<div class="check" id="experiences-bs"></div>' +
  '</section>' +
  '<section>' +
  '<label>Recommended focus (derived from Compass strengths)</label>' +
  '<div class="check" id="caps-bs"></div>' +
  '</section>' +
  '<div class="meta" id="meta"></div>' +
  '<div class="meta" id="readiness"></div>' +
  '</div>'
)}
<script>
const profile = ${JSON.stringify(profile)}
const suggestions = ${JSON.stringify(SUGGESTIONS)}
const params = new URLSearchParams(location.search)
const prefillRole = params.get('role')
if (prefillRole) {
  document.querySelectorAll('#role').forEach(el => { el.value = prefillRole })
}
const prefillEmphasize = (params.get('emphasize') || '').split(',').filter(Boolean)

function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]) }

const expHtml = profile.identity.experienceIds.map(id => {
  const e = profile.experiences.find(x => x.id === id)
  if (!e) return ''
  return '<label><input type="checkbox" data-exp="' + id + '" checked> ' + e.organization + '</label>'
}).join('')
document.querySelectorAll('#experiences, #experiences-bs').forEach(el => { el.innerHTML = expHtml })

const capNames = [...suggestions.strengths]
for (const name of prefillEmphasize) if (!capNames.includes(name)) capNames.push(name)
const capsHtml = capNames.map(s =>
  '<label><input type="checkbox" data-cap="' + esc(s) + '" checked> ' + esc(s) + '</label>'
).join('')
document.querySelectorAll('#caps, #caps-bs').forEach(el => { el.innerHTML = capsHtml })

document.querySelectorAll('[data-cap]').forEach(el => {
  if (prefillEmphasize.length && !prefillEmphasize.includes(el.dataset.cap)) el.checked = false
})

function syncElements(source) {
  if (!source) return
  if (source.id) {
    document.querySelectorAll('#' + source.id).forEach(el => {
      if (el !== source) {
        if (el.type === 'checkbox') el.checked = source.checked
        else el.value = source.value
      }
    })
  }
  if (source.dataset && source.dataset.exp) {
    document.querySelectorAll('[data-exp="' + source.dataset.exp + '"]').forEach(el => {
      if (el !== source) el.checked = source.checked
    })
  }
  if (source.dataset && source.dataset.cap) {
    document.querySelectorAll('[data-cap="' + source.dataset.cap + '"]').forEach(el => {
      if (el !== source) el.checked = source.checked
    })
  }
}

function buildContext() {
  const roleEl = [...document.querySelectorAll('#role')].find(el => el.value.trim()) || document.querySelector('#role')
  const role = roleEl ? roleEl.value.trim() : ''
  const audienceEl = document.querySelector('#audience')
  const audience = audienceEl ? audienceEl.value : 'hiring-manager'
  const excludeExperienceIds = [...document.querySelectorAll('[data-exp]')]
    .filter(el => !el.checked).map(el => el.dataset.exp)
    .filter((v, i, a) => a.indexOf(v) === i)
  const emphasize = [...document.querySelectorAll('[data-cap]')]
    .filter(el => el.checked).map(el => el.dataset.cap)
    .filter((v, i, a) => a.indexOf(v) === i)
  const autoSummaryEl = document.querySelector('#autoSummary')
  const generateSummary = autoSummaryEl && autoSummaryEl.checked ? true : undefined
  return {
    targetRole: role || undefined,
    audience,
    excludeExperienceIds,
    emphasize,
    generateSummary,
  }
}

let lastResult = null

async function preview() {
  const res = await fetch('/api/cv/preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildContext()),
  })
  if (!res.ok) { document.getElementById('sheet').textContent = 'Error: ' + await res.text(); return }
  lastResult = await res.json()
  document.getElementById('sheet').innerHTML = lastResult.docHtml
  const cv = lastResult.cv
  const parts = []
  parts.push('Included ' + cv.experiences.length + ' of ' + profile.identity.experienceIds.length + ' experiences.')
  document.querySelectorAll('#meta').forEach(meta => {
    meta.textContent = parts.join(' ')
    meta.style.display = parts.length ? 'block' : 'none'
  })
  document.querySelectorAll('#readiness').forEach(readiness => {
    readiness.textContent = lastResult.readiness ? '⚠ ' + lastResult.readiness : ''
    readiness.style.display = lastResult.readiness ? 'block' : 'none'
  })
}

function exportPdf() {
  if (!lastResult) return
  const w = window.open('', '_blank')
  if (w) {
    const htmlWithPrint = lastResult.html.replace(
      '</body>',
      '<script>window.onload=function(){setTimeout(function(){window.print();},100);}</' + 'script></body>'
    )
    w.document.write(htmlWithPrint)
    w.document.close()
    w.focus()
  }
}

function exportJsonResume() {
  if (!lastResult) return
  const blob = new Blob([JSON.stringify(lastResult.cv, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'resume.json'
  a.click()
}

function openCustomize() {
  document.querySelector('.bottom-sheet')?.classList.add('open')
  document.querySelector('.bottom-sheet-overlay')?.classList.add('open')
}

function closeCustomize() {
  document.querySelector('.bottom-sheet')?.classList.remove('open')
  document.querySelector('.bottom-sheet-overlay')?.classList.remove('open')
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCustomize()
  }
})

document.addEventListener('input', (e) => {
  if (e.target && (e.target.id === 'role' || e.target.dataset.exp || e.target.dataset.cap)) {
    syncElements(e.target)
    preview()
  }
})

document.addEventListener('change', (e) => {
  if (e.target && (e.target.id === 'audience' || e.target.id === 'autoSummary' || e.target.dataset.exp || e.target.dataset.cap)) {
    syncElements(e.target)
    preview()
  }
})

document.querySelectorAll('#role').forEach(el => el.addEventListener('input', preview))

preview()
</script>
`

const EVALUATE_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Evaluate</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin: 1rem 0 0.25rem; }
textarea { width: 100%; min-height: 12rem; font-size: 0.875rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
select { width: 100%; padding: 0.625rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.375rem; background: #fff; }
button { width: 100%; padding: 0.75rem; min-height: 44px; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 1rem; }
.action-bar button { margin-top: 0; }
.card { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; margin-top: 1rem; }
.card .verdict { font-size: 1.25rem; font-weight: 800; letter-spacing: 0.02em; display: inline-block; padding: 0.25rem 0.625rem; border-radius: 0.25rem; margin-bottom: 0.5rem; }
.card .verdict.strong-candidate { background: #e8f5e9; color: #1b5e20; }
.card .verdict.consider { background: #fff3e0; color: #e65100; }
.card .verdict.abstain { background: #ede7f6; color: #4a148c; }
.card .verdict.skip { background: #ffebee; color: #b71c1c; }
.card h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-top: 1.25rem; border-bottom: 1px solid #eee; padding-bottom: 0.25rem; }
.card ul { margin: 0.5rem 0 0 1.25rem; }
.card li { font-size: 0.875rem; color: #333; margin-bottom: 0.5rem; }
.card .trace { font-size: 0.8125rem; color: #555; margin-top: 0.25rem; background: #f9f9f9; padding: 0.375rem 0.5rem; border-radius: 0.25rem; border-left: 3px solid #ccc; }
.meta { color: #666; font-size: 0.8125rem; margin-top: 0.5rem; }
.pill-grid { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem; }
.pill { font-size: 0.75rem; background: #f0f0f0; border: 1px solid #ddd; padding: 0.25rem 0.5rem; border-radius: 0.25rem; }
.badge { display: inline-block; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 0.125rem 0.375rem; border-radius: 0.2rem; }
.badge.direct { background: #e8f5e9; color: #2e7d32; }
.badge.adjacent { background: #e3f2fd; color: #1565c0; }
.badge.uncertain { background: #fff8e1; color: #f57f17; }
</style>
${renderAppShell(
  'evaluate',
  '<div class="page-header">' +
  '<h1>Evaluate an opportunity</h1>' +
  '<p class="subtitle">O1.1 Opportunity Ingestion: Paste a job description or enter a job posting URL</p>' +
  '</div>',
  '<div class="split-view" style="--split-threshold: 54rem;">' +
  '<div>' +
  '<label for="jobUrl">Job Posting URL (O1.1 Ingestion)</label>' +
  '<div style="display:flex;gap:0.5rem;margin-top:0.25rem;">' +
  '<input id="jobUrl" type="url" placeholder="https://boards.greenhouse.io/..." style="flex:1;padding:0.625rem;font-size:0.875rem;border:1px solid #ccc;border-radius:0.375rem;">' +
  '<button style="width:auto;margin-top:0;padding:0.625rem 1rem;" onclick="evaluateUrl()">Fetch & Evaluate</button>' +
  '</div>' +
  '<label for="jd">Or Paste Job Description</label>' +
  '<textarea id="jd" placeholder="Paste job description text here..."></textarea>' +
  '<label for="knowledgeMode">Market Knowledge (Experimental Intervention)</label>' +
  '<select id="knowledgeMode" onchange="evaluateJD()">' +
  '<option value="software">Software Knowledge (Default)</option>' +
  '<option value="admin">Administration Knowledge (Lydia)</option>' +
  '<option value="composed">Composed ($K^*$ All Domains)</option>' +
  '<option value="off">Knowledge: OFF (0 patterns — Test Abstention)</option>' +
  '</select>' +
  '<div class="action-bar">' +
  '<button onclick="evaluateJD()">Evaluate Manual Text</button>' +
  '</div>' +
  '</div>' +
  '<div>' +
  '<div id="result"></div>' +
  '</div>' +
  '</div>'
)}
<script>
const result = document.getElementById('result')
let lastEv = null
async function evaluateUrl() {
  const url = document.getElementById('jobUrl').value.trim()
  const knowledgeMode = document.getElementById('knowledgeMode').value
  if (!url) return
  result.innerHTML = '<p class="meta">Safe Fetching & Extracting URL via OpportunitySource...</p>'
  const res = await fetch('/api/evaluate-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, knowledgeMode }),
  })
  if (!res.ok) { result.innerHTML = '<p class="meta">Error: ' + await res.text() + '</p>'; return }
  const ev = await res.json()
  lastEv = ev
  if (ev.rawOpportunity && ev.rawOpportunity.description) {
    document.getElementById('jd').value = ev.rawOpportunity.description
  }
  result.innerHTML = renderResult(ev)
}
async function evaluateJD() {
  const jd = document.getElementById('jd').value.trim()
  const knowledgeMode = document.getElementById('knowledgeMode').value
  if (!jd) return
  result.innerHTML = '<p class="meta">Running Universal Decision Protocol...</p>'
  const res = await fetch('/api/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jd, knowledgeMode }),
  })
  if (!res.ok) { result.innerHTML = '<p class="meta">Error: ' + await res.text() + '</p>'; return }
  const ev = await res.json()
  lastEv = ev
  result.innerHTML = renderResult(ev)
}
function renderResult(ev) {
  const parts = []
  const rec = ev.assessment ? ev.assessment.recommendation : ev.verdict
  const recUpper = rec.toUpperCase().replace('-', ' ')

  parts.push('<div class="card">')
  parts.push('<div class="verdict ' + rec.toLowerCase() + '">' + recUpper + '</div>')
  parts.push('<p class="meta">' + (ev.assessment ? ev.assessment.rationale : '') + '</p>')

  parts.push('<h3>Decision System Projections</h3>')
  parts.push('<ul style="list-style:none;margin-left:0;">')
  if (ev.professionalFit) {
    parts.push('<li><strong>Professional Fit:</strong> ' + ev.professionalFit.score.toFixed(1) + ' / 10 <span class="meta">(' + Math.round(ev.professionalFit.assessmentCoverage * 100) + '% coverage)</span></li>')
  }
  if (ev.personalFit) {
    parts.push('<li><strong>Personal Fit:</strong> ' + (ev.personalFit.assessedCount > 0 ? ev.personalFit.score.toFixed(1) + ' / 10' : '—') + ' <span class="meta">(eligible: ' + (ev.personalFit.eligible ? '✓ Yes' : '✗ Violates constraint') + ')</span></li>')
  }
  parts.push('<li><strong>Recognition Coverage:</strong> ' + Math.round((ev.recognitionCoverage || 0) * 100) + '%</li>')
  parts.push('<li><strong>Confidence:</strong> ' + Math.round((ev.assessment ? ev.assessment.confidence : ev.confidence) * 100) + '%</li>')
  parts.push('</ul>')

  parts.push('<h3>Market Understanding (' + ev.knowledgeName + ')</h3>')
  if (ev.marketModel && ev.marketModel.requirements.length) {
    parts.push('<div class="pill-grid">')
    parts.push(ev.marketModel.requirements.map(r => '<span class="pill">✓ ' + r.concept + '</span>').join(''))
    parts.push('</div>')
  } else {
    parts.push('<p class="meta">0 requirements recognized under active MarketKnowledge. (Confidence suppressed → ABSTAIN)</p>')
  }

  if (ev.demonstrated && ev.demonstrated.length) {
    parts.push('<h3>Causal Evidence Chain</h3><ul>')
    parts.push(ev.demonstrated.map(m =>
      '<li>✓ <strong>' + m.capabilityName + '</strong>' +
      '<div class="trace">JD Raw: "' + m.matchedPhrases.join('", "') + '"<br>Evidence: ' + (m.evidence.join('; ') || 'Direct capability evidence') + '</div></li>'
    ).join(''))
    parts.push('</ul>')
  }

  if (ev.gaps && ev.gaps.length) {
    parts.push('<h3>Gaps</h3><ul>')
    parts.push(ev.gaps.map(m => '<li>△ <strong>' + m.capabilityName + '</strong> — recognized requirement without evidence</li>').join(''))
    parts.push('</ul>')
  }

  parts.push('<h3>Market Recognition Diagnostics</h3>')
  parts.push('<p class="meta">' + ev.notEvaluated + ' chunk(s) uninterpreted by current knowledge dictionary (' + ev.knowledgePatternsCount + ' active patterns).</p>')

  if (ev.verdict === 'apply' || rec === 'strong-candidate') {
    parts.push('<button onclick="prepare()">Prepare application</button>')
  }
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
          docHtml: htmlRenderer.renderDocument(cv),
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

    if (request.method === 'POST' && url.pathname === '/api/evaluate-url') {
      try {
        const body = (await request.json()) as { url?: string; knowledgeMode?: string }
        if (!body.url || typeof body.url !== 'string') {
          return new Response('Missing url', { status: 400 })
        }

        const source = new UrlOpportunitySource()
        const rawOpportunity = await source.fetch({ url: body.url })

        const mode = body.knowledgeMode || 'software'
        let knowledge
        if (mode === 'off') {
          knowledge = { name: 'none', version: '0.0.0', patterns: [] }
        } else if (mode === 'admin') {
          knowledge = ADMIN_KNOWLEDGE
        } else if (mode === 'composed') {
          knowledge = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)
        } else {
          knowledge = DEFAULT_SOFTWARE_KNOWLEDGE
        }

        const recognizer = new DeclarativeMarketRecognizer(knowledge)
        const marketModel = recognizer.extractMarketRequirements(rawOpportunity.description)
        const resolved = resolveRequirements(marketModel, profile)
        const suffList = resolved.map(evaluateSufficiency)
        const profFit = projectProfessionalFit(suffList)
        const prefAssessments = assessPreferences(rawOpportunity.description, profile.preferences)
        const persFit = projectPersonalFit(prefAssessments)
        const recCov = computeRecognitionCoverage(rawOpportunity.description, marketModel)
        const assessment = applyPolicy(profFit, persFit, recCov)

        const legacyEv = evaluateOpportunity(rawOpportunity.description, profile)

        return new Response(JSON.stringify({
          ...legacyEv,
          rawOpportunity,
          marketModel,
          professionalFit: profFit,
          personalFit: persFit,
          assessment,
          recognitionCoverage: recCov,
          knowledgeMode: mode,
          knowledgeName: knowledge.name,
          knowledgePatternsCount: knowledge.patterns.length,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Failed to fetch/evaluate URL', { status: 400 })
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/evaluate') {
      try {
        const body = (await request.json()) as { jd?: string; knowledgeMode?: string }
        if (!body.jd || typeof body.jd !== 'string') {
          return new Response('Missing jd', { status: 400 })
        }

        const mode = body.knowledgeMode || 'software'
        let knowledge
        if (mode === 'off') {
          knowledge = { name: 'none', version: '0.0.0', patterns: [] }
        } else if (mode === 'admin') {
          knowledge = ADMIN_KNOWLEDGE
        } else if (mode === 'composed') {
          knowledge = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE)
        } else {
          knowledge = DEFAULT_SOFTWARE_KNOWLEDGE
        }

        const recognizer = new DeclarativeMarketRecognizer(knowledge)
        const marketModel = recognizer.extractMarketRequirements(body.jd)
        const resolved = resolveRequirements(marketModel, profile)
        const suffList = resolved.map(evaluateSufficiency)
        const profFit = projectProfessionalFit(suffList)
        const prefAssessments = assessPreferences(body.jd, profile.preferences)
        const persFit = projectPersonalFit(prefAssessments)
        const recCov = computeRecognitionCoverage(body.jd, marketModel)
        const assessment = applyPolicy(profFit, persFit, recCov)

        // Legacy compatibility + K11-LIVE full causal trace
        const legacyEv = evaluateOpportunity(body.jd, profile)

        return new Response(JSON.stringify({
          ...legacyEv,
          marketModel,
          professionalFit: profFit,
          personalFit: persFit,
          assessment,
          recognitionCoverage: recCov,
          knowledgeMode: mode,
          knowledgeName: knowledge.name,
          knowledgePatternsCount: knowledge.patterns.length,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

interface ObservationSourceItem {
  name: string
  provider: string
  token: string
  url: string
  status: string
  jobsObserved: string
}

const DEFAULT_OBSERVATION_SOURCES: ObservationSourceItem[] = [
  { name: 'Stripe Careers', provider: 'Greenhouse', token: 'stripe', url: 'https://boards.greenhouse.io/stripe', status: 'Watching', jobsObserved: '3,482' },
  { name: 'OpenAI Careers', provider: 'Greenhouse', token: 'openai', url: 'https://boards.greenhouse.io/openai', status: 'Watching', jobsObserved: '412' },
  { name: 'Anthropic Careers', provider: 'Ashby', token: 'anthropic', url: 'https://jobs.ashbyhq.com/anthropic', status: 'Watching', jobsObserved: '189' },
  { name: 'Linear Careers', provider: 'Lever', token: 'linear', url: 'https://jobs.lever.co/linear', status: 'Watching', jobsObserved: '64' },
]

const memoryCustomSources: ObservationSourceItem[] = []

async function getMergedSources(env: Env): Promise<ObservationSourceItem[]> {
  if (env.DATABASE_URL) {
    try {
      const sql = postgres(env.DATABASE_URL, { max: 1 })
      try {
        const repo = new PostgresObservationSourceRepository(sql)
        const dbSources = await repo.list('valentin')
        if (dbSources.length > 0) {
          return dbSources.map(r => ({
            name: r.name,
            provider: r.provider,
            token: r.id,
            url: r.url,
            status: r.status,
            jobsObserved: r.jobsObserved > 0 ? r.jobsObserved.toLocaleString() : 'Watching',
          }))
        }
      } finally {
        await sql.end()
      }
    } catch {}
  }

  let customList: ObservationSourceItem[] = memoryCustomSources
  if (env.PROVENA_KV) {
    try {
      const raw = await env.PROVENA_KV.get('user_sources', 'json')
      if (Array.isArray(raw)) customList = raw as ObservationSourceItem[]
    } catch {}
  }
  const map = new Map<string, ObservationSourceItem>()
  for (const s of DEFAULT_OBSERVATION_SOURCES) map.set(s.token, s)
  for (const s of customList) map.set(s.token, s)
  return Array.from(map.values())
}

async function registerObservedSource(env: Env, token: string, count: number): Promise<void> {
  const tokenClean = token.toLowerCase().trim()
  const name = tokenClean.charAt(0).toUpperCase() + tokenClean.slice(1) + ' Careers'
  const url = `https://boards.greenhouse.io/${tokenClean}`

  if (env.DATABASE_URL) {
    try {
      const sql = postgres(env.DATABASE_URL, { max: 1 })
      try {
        const repo = new PostgresObservationSourceRepository(sql)
        await repo.upsert({
          id: tokenClean,
          profileId: 'valentin',
          name,
          provider: 'Greenhouse',
          url,
          status: 'Watching',
          jobsObserved: count,
        })
      } finally {
        await sql.end()
      }
    } catch {}
  }

  const newSource: ObservationSourceItem = {
    name,
    provider: 'Greenhouse',
    token: tokenClean,
    url,
    status: 'Watching',
    jobsObserved: count > 0 ? `${count} postings` : 'Watching',
  }

  const idx = memoryCustomSources.findIndex(s => s.token === tokenClean)
  if (idx >= 0) memoryCustomSources[idx] = newSource
  else memoryCustomSources.push(newSource)

  if (env.PROVENA_KV) {
    try {
      const raw = await env.PROVENA_KV.get('user_sources', 'json')
      const list: ObservationSourceItem[] = Array.isArray(raw) ? (raw as ObservationSourceItem[]) : []
      const kvIdx = list.findIndex(s => s.token === tokenClean)
      if (kvIdx >= 0) list[kvIdx] = newSource
      else list.push(newSource)
      await env.PROVENA_KV.put('user_sources', JSON.stringify(list))
    } catch {}
  }
}

const SOURCES_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Observation Sources</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
.sources-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-top: 1rem; }
.source-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; }
.source-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; }
.source-name { font-weight: 700; font-size: 1rem; }
.source-provider { font-size: 0.75rem; background: #f0f0f0; color: #555; padding: 0.15rem 0.4rem; border-radius: 0.25rem; text-transform: uppercase; font-weight: 600; white-space: nowrap; }
.source-meta { font-size: 0.8125rem; color: #666; margin-top: 0.5rem; line-height: 1.5; }
.source-actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
.source-actions button { flex: 1; padding: 0.4rem 0.6rem; font-size: 0.8125rem; border-radius: 0.25rem; min-height: 36px; cursor: pointer; }
.btn-primary { background: #1a1a1a; color: #fff; border: none; }
.btn-secondary { background: #fff; color: #333; border: 1px solid #ccc; }
.btn-secondary:hover { background: #f5f5f5; }
.sync-bar { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1.5rem; display: flex; gap: 0.75rem; align-items: center; }
.sync-bar input { flex: 1; padding: 0.5rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.25rem; }
.status-pill { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; font-weight: 600; color: #2e7d32; }
.status-dot { width: 6px; height: 6px; border-radius: 50%; background: #2e7d32; }
</style>
${renderAppShell(
  'sources',
  '<div class="page-header">' +
  '<h1>Observation Sources</h1>' +
  '<p class="subtitle">Connect career pages once. Provena continuously watches your targeted companies in the background.</p>' +
  '</div>',
  '<div class="readable">' +
  '<div class="sync-bar">' +
  '<input id="newBoardToken" type="text" placeholder="Career page URL (e.g. https://boards.greenhouse.io/openai or company name)" value="https://boards.greenhouse.io/stripe">' +
  '<button class="btn-primary" style="width:auto;margin:0;" onclick="addAndSyncSource()">+ Connect Source</button>' +
  '</div>' +
  '<div id="sources-status" style="margin-bottom:1rem;font-size:0.875rem;color:#666;"></div>' +
  '<div class="sources-grid" id="sources-list">' +
  'Loading observed market sources...' +
  '</div>' +
  '</div>'
)}
<script>
async function loadSources() {
  const container = document.getElementById('sources-list')
  try {
    const res = await fetch('/api/sources')
    const data = await res.json()
    container.innerHTML = data.sources.map(s =>
      '<div class="source-card">' +
      '<div>' +
      '<div class="source-header">' +
      '<span class="source-name">' + s.name + '</span>' +
      '<span class="source-provider">' + s.provider + '</span>' +
      '</div>' +
      '<div class="source-meta">' +
      '<div style="word-break:break-all;"><a href="' + (s.url || '#') + '" target="_blank" style="color:#666;text-decoration:none;">' + (s.url || s.token) + '</a></div>' +
      '<div style="margin-top:0.25rem;">Status: <span class="status-pill"><span class="status-dot"></span>' + (s.status || 'Watching') + '</span></div>' +
      '<div>Observed Jobs: ' + s.jobsObserved + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="source-actions">' +
      '<button class="btn-primary" onclick="syncSource(\\'' + s.token + '\\')">Sync Now</button>' +
      '</div>' +
      '</div>'
    ).join('')
  } catch (e) {
    container.innerHTML = '<p>Failed to load sources.</p>'
  }
}

async function syncSource(token) {
  const statusEl = document.getElementById('sources-status')
  statusEl.textContent = 'Syncing board "' + token + '"...'
  const res = await fetch('/api/opportunities/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardToken: token }),
  })
  if (res.ok) {
    const data = await res.json()
    statusEl.textContent = '✓ Sync complete for ' + token + ': ' + data.fetchedCount + ' fetched, ' + data.newlyAddedCount + ' new.'
    loadSources()
  } else {
    statusEl.textContent = 'Sync failed: ' + (await res.text())
  }
}

async function addAndSyncSource() {
  const rawInput = document.getElementById('newBoardToken').value.trim()
  if (!rawInput) return
  let token = rawInput
  if (rawInput.includes('/')) {
    const parts = rawInput.split('/').filter(Boolean)
    token = parts[parts.length - 1] || rawInput
  }
  await syncSource(token)
}

loadSources()
</script>`

const OPPORTUNITIES_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Opportunity Inbox</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }
.tabs { display: flex; gap: 0.5rem; margin-top: 1rem; border-bottom: 2px solid #e5e5e5; }
.tab-btn { padding: 0.6rem 1rem; font-size: 0.875rem; font-weight: 600; border: none; background: transparent; cursor: pointer; color: #666; border-bottom: 2px solid transparent; margin-bottom: -2px; }
.tab-btn:hover { color: #1a1a1a; }
.tab-btn.active { color: #1a1a1a; border-bottom-color: #1a1a1a; }
.count-pill { display: inline-block; background: #e0e0e0; color: #333; font-size: 0.75rem; padding: 0.1rem 0.4rem; border-radius: 10px; margin-left: 0.3rem; }
.tab-btn.active .count-pill { background: #1a1a1a; color: #fff; }
.opp-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 0.5rem; overflow: hidden; border: 1px solid #e5e5e5; margin-top: 0.75rem; }
.opp-table th, .opp-table td { padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; border-bottom: 1px solid #eee; }
.opp-table th { background: #fafafa; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #777; }
.badge { display: inline-block; padding: 0.2rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
.badge.strong-candidate { background: #e8f5e9; color: #2e7d32; }
.badge.consider { background: #fff3e0; color: #ef6c00; }
.badge.abstain { background: #f3e5f5; color: #6a1b9a; }
.badge.skip { background: #ffebee; color: #c62828; }
.badge.interested { background: #e8f5e9; color: #2e7d32; }
.badge.applied { background: #e3f2fd; color: #1565c0; }
.badge.dismissed { background: #ffebee; color: #c62828; }
.btn-group { display: flex; gap: 0.375rem; }
.btn-group button { padding: 0.25rem 0.5rem; font-size: 0.75rem; min-height: 28px; width: auto; border: 1px solid #ccc; background: #fff; border-radius: 0.25rem; cursor: pointer; }
.btn-group button:hover { background: #f0f0f0; }
.btn-group button.active { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
.sentinel { text-align: center; padding: 1.5rem; color: #888; font-size: 0.875rem; }
</style>
${renderAppShell(
  'opportunities',
  '<div class="page-header">' +
  '<h1>Attention Inbox</h1>' +
  '<p class="subtitle">Provena continuously evaluates observed opportunities and surfaces only what deserves your attention.</p>' +
  '</div>',
  '<div class="readable">' +
  '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;background:#fff;padding:0.875rem 1.125rem;border-radius:0.5rem;border:1px solid #e5e5e5;box-shadow:0 1px 2px rgba(0,0,0,0.03);">' +
  '<div style="display:flex;gap:1.25rem;align-items:center;font-size:0.875rem;color:#444;">' +
  '<div>Watching <strong style="color:#1a1a1a;">4 observation sources</strong></div>' +
  '<div style="color:#ccc;">·</div>' +
  '<div><strong style="color:#1a1a1a;" id="inbox-total-eval">1,284</strong> opportunities evaluated</div>' +
  '<div style="color:#ccc;">·</div>' +
  '<div><strong style="color:#2e7d32;" id="inbox-attention-count">0</strong> require attention</div>' +
  '</div>' +
  '<a href="/sources" style="font-size:0.875rem;color:#1a1a1a;font-weight:600;text-decoration:none;">Manage Observation Sources →</a>' +
  '</div>' +
  '<div class="tabs">' +
  '<button class="tab-btn active" id="tab-needs-attention" onclick="switchTab(\'needs-attention\')">Needs Attention <span class="count-pill" id="cnt-needs-attention">0</span></button>' +
  '<button class="tab-btn" id="tab-worth-considering" onclick="switchTab(\'worth-considering\')">Worth Considering <span class="count-pill" id="cnt-worth-considering">0</span></button>' +
  '<button class="tab-btn" id="tab-unresolved" onclick="switchTab(\'unresolved\')">Unresolved <span class="count-pill" id="cnt-unresolved">0</span></button>' +
  '<button class="tab-btn" id="tab-decided" onclick="switchTab(\'decided\')">Decided <span class="count-pill" id="cnt-decided">0</span></button>' +
  '</div>' +
  '<div id="inbox">Loading opportunities...</div>' +
  '<div id="sentinel" class="sentinel"></div>' +
  '</div>'
)}
<script>
let currentTab = 'needs-attention'
let currentBookmark = null
let isLoading = false
let hasMore = false
let observer = null

function switchTab(tab) {
  currentTab = tab
  currentBookmark = null
  hasMore = false
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'))
  const activeBtn = document.getElementById('tab-' + tab)
  if (activeBtn) activeBtn.classList.add('active')
  const container = document.getElementById('inbox')
  container.innerHTML = '<table class="opp-table"><thead><tr><th>Opportunity</th><th>Verdict</th><th>Prof Fit</th><th>Personal Fit</th><th>Evidence</th><th>Action</th></tr></thead><tbody id="opp-rows"></tbody></table>'
  loadTab(true)
}

async function loadTab(reset = false) {
  if (isLoading) return
  isLoading = true
  const sentinel = document.getElementById('sentinel')
  sentinel.textContent = 'Loading...'

  const url = new URL('/api/opportunities', location.origin)
  url.searchParams.set('tab', currentTab)
  url.searchParams.set('limit', '30')
  if (currentBookmark && !reset) {
    url.searchParams.set('bookmark', currentBookmark)
  }

  try {
    const res = await fetch(url)
    if (!res.ok) { sentinel.textContent = 'Error loading tab'; isLoading = false; return }
    const data = await res.json()

    // Update tab counters
    if (data.counts) {
      for (const k of Object.keys(data.counts)) {
        const el = document.getElementById('cnt-' + k)
        if (el) el.textContent = data.counts[k]
      }
      const attEl = document.getElementById('inbox-attention-count')
      if (attEl) attEl.textContent = data.counts['needs-attention'] || 0
      const totalEl = document.getElementById('inbox-total-eval')
      if (totalEl) {
        const total = (data.counts['needs-attention'] || 0) + (data.counts['worth-considering'] || 0) + (data.counts['unresolved'] || 0) + (data.counts['decided'] || 0)
        if (total > 0) totalEl.textContent = total.toLocaleString()
      }
    }

    const rows = document.getElementById('opp-rows')
    if (!rows) { isLoading = false; return }

    if (reset && data.items.length === 0) {
      rows.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2.5rem 1rem;color:#666;line-height:1.5;"><strong style="display:block;color:#1a1a1a;margin-bottom:0.25rem;">Nothing requires your attention right now.</strong>Provena is continuously watching your observation sources in the background.</td></tr>'
      if (sentinel) sentinel.textContent = ''
      isLoading = false
      return
    }

    if (reset) {
      rows.innerHTML = ''
    }

    for (const item of data.items) {
      const tr = document.createElement('tr')
      tr.innerHTML =
        '<td><strong>' + item.title + '</strong>' + (item.companyName ? ' <span class="meta">at ' + item.companyName + '</span>' : '') + '<br><a class="meta" href="' + item.url + '" target="_blank">View Source</a></td>' +
        '<td><span class="badge ' + item.verdict + '">' + item.verdict + '</span></td>' +
        '<td>' + item.profFit + '</td>' +
        '<td>' + item.personalFit + '</td>' +
        '<td>' + item.evidenceCoverage + '</td>' +
        '<td><div class="btn-group">' +
        '<button class="' + (item.userDecision === 'interested' ? 'active' : '') + '" title="Save" onclick="setDecision(\\'' + item.id + '\\', \\'interested\\')">⭐ Save</button>' +
        '<button class="' + (item.userDecision === 'applied' ? 'active' : '') + '" title="Apply" onclick="setDecision(\\'' + item.id + '\\', \\'applied\\')">✓ Apply</button>' +
        '<button class="' + (item.userDecision === 'dismissed' ? 'active' : '') + '" title="Dismiss" onclick="setDecision(\\'' + item.id + '\\', \\'dismissed\\')">✗ Dismiss</button>' +
        '</div></td>'
      rows.appendChild(tr)
    }

    currentBookmark = data.nextBookmark
    hasMore = !!data.nextBookmark
    sentinel.textContent = hasMore ? 'Scroll for more...' : ''

    // Re-observe the sentinel after each page load so the IntersectionObserver
    // re-evaluates intersection state. Without this it only fires on *changes*,
    // meaning it never triggers again if the sentinel stays visible after load.
    if (observer) {
      observer.unobserve(sentinel)
      observer.observe(sentinel)
    }
  } catch (e) {
    sentinel.textContent = 'Failed to load'
  } finally {
    isLoading = false
  }
}

async function syncBoard() {
  const container = document.getElementById('inbox')
  const boardToken = document.getElementById('boardToken').value.trim() || 'stripe'
  container.innerHTML = '<p class="meta">Fetching and evaluating ATS board positions for "' + boardToken + '" via K*...</p>'
  const res = await fetch('/api/opportunities/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ boardToken }),
  })
  if (!res.ok) { container.innerHTML = '<p class="meta">Sync failed: ' + await res.text() + '</p>'; return }
  switchTab(currentTab)
}

async function setDecision(id, decision) {
  await fetch('/api/opportunities/decision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, decision }),
  })
  switchTab(currentTab)
}

// IntersectionObserver for Cursor Infinite Scroll
window.addEventListener('DOMContentLoaded', () => {
  const sentinel = document.getElementById('sentinel')
  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMore && !isLoading) {
      loadTab(false)
    }
  }, { threshold: 0.1 })
  observer.observe(sentinel)
  switchTab('needs-attention')
})
</script>
`

    if (request.method === 'GET' && url.pathname === '/sources') {
      return new Response(SOURCES_PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'GET' && url.pathname === '/api/sources') {
      const sources = await getMergedSources(env)
      return new Response(JSON.stringify({ sources }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (request.method === 'GET' && url.pathname === '/opportunities') {
      return new Response(OPPORTUNITIES_PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    if (request.method === 'GET' && url.pathname === '/api/opportunities') {
      const tab = (url.searchParams.get('tab') || 'needs-attention') as AttentionTab
      const bookmarkParam = url.searchParams.get('bookmark') || url.searchParams.get('cursor')
      const limit = parseInt(url.searchParams.get('limit') || '30', 10)

      try {
        if (env.DATABASE_URL) {
          const sql = postgres(env.DATABASE_URL, { max: 1 })
          try {
            const searchAdapter = new PostgresOpportunitySearchAdapter(sql)

            const decodedBookmark = bookmarkParam ? decodeBookmark(bookmarkParam, tab) : null

            const results = await searchAdapter.searchKeyset({
              tab,
              bookmark: decodedBookmark ? {
                tier: decodedBookmark.tier,
                pf: decodedBookmark.pf,
                conf: decodedBookmark.conf,
                seen: decodedBookmark.seen,
                id: decodedBookmark.id,
              } : null,
              limit: limit + 1,
            })

            const hasMore = results.length > limit
            const pageItems = hasMore ? results.slice(0, limit) : results

            const toVerdict = (rec: string | null | undefined): string => {
              const r = (rec || '').toLowerCase()
              if (r === 'strong-candidate' || r === 'strong_fit' || r === 'apply') return 'strong-candidate'
              if (r === 'consider') return 'consider'
              return 'unresolved'
            }
            const tierToTab = (tier: number | null | undefined, userDec: string): AttentionTab => {
              if (userDec && userDec !== 'new') return 'decided'
              if (tier === 4) return 'needs-attention'
              if (tier === 3) return 'worth-considering'
              return 'unresolved'
            }
            const items = pageItems.map(r => ({
              id: r.id,
              title: r.title,
              companyName: r.companyName,
              url: r.url,
              tab: tierToTab(r.decisionTier ?? null, r.userDecision || 'new'),
              verdict: toVerdict(r.recommendation),
              profFit: typeof r.professionalFit === 'number' ? r.professionalFit.toFixed(1) : '—',
              personalFit: typeof r.personalFit === 'number' ? r.personalFit.toFixed(1) : '—',
              evidenceCoverage: typeof r.confidence === 'number' ? Math.round(r.confidence * 100) + '%' : '—',
              userDecision: r.userDecision || 'new',
            }))

            const lastItem = pageItems[pageItems.length - 1]
            let nextBookmark: string | null = null
            if (hasMore && lastItem) {
              const tierNum = lastItem.decisionTier ?? (
                lastItem.recommendation === 'strong-candidate' ? 4 :
                lastItem.recommendation === 'consider' ? 3 :
                lastItem.recommendation === 'abstain' ? 2 : 1
              )
              nextBookmark = encodeBookmark({
                bookmarkVersion: 1,
                orderingVersion: 1,
                tab,
                tier: tierNum,
                pf: lastItem.professionalFit ?? 0,
                conf: lastItem.confidence ?? 0,
                seen: lastItem.evaluatedAt || new Date().toISOString(),
                id: lastItem.id,
              })
            }

            const countRows = await sql<Array<{ tab_name: string; count: string }>>`
              SELECT 
                CASE 
                  WHEN d.user_decision IS NOT NULL AND d.user_decision != 'new' THEN 'decided'
                  WHEN a.decision_tier = 4 AND a.confidence >= 0.25 AND (d.user_decision IS NULL OR d.user_decision = 'new') THEN 'needs-attention'
                  WHEN a.decision_tier = 3 AND a.confidence >= 0.25 AND (d.user_decision IS NULL OR d.user_decision = 'new') THEN 'worth-considering'
                  ELSE 'unresolved'
                END as tab_name,
                COUNT(*)::text as count
              FROM current_opportunity_assessments a
              JOIN opportunity_postings p ON p.opportunity_id = a.opportunity_id AND p.active = true
              LEFT JOIN user_opportunity_decisions d ON d.opportunity_id = a.opportunity_id AND d.user_id = 'valentin'
              WHERE a.profile_id = 'valentin'
              GROUP BY tab_name
            `
            const counts = {
              'needs-attention': 0,
              'worth-considering': 0,
              'unresolved': 0,
              'decided': 0,
            }
            for (const row of countRows) {
              if (row.tab_name in counts) {
                counts[row.tab_name as AttentionTab] = parseInt(row.count, 10)
              }
            }
            const totalEvaluatedCount = counts['needs-attention'] + counts['worth-considering'] + counts['unresolved'] + counts['decided']

            return new Response(JSON.stringify({
              tab,
              counts,
              items,
              nextBookmark,
              totalInTab: counts[tab] ?? items.length,
              totalEvaluatedCount,
            }), {
              headers: { 'Content-Type': 'application/json' },
            })
          } finally {
            await sql.end()
          }
        }

        const opps = env.PROVENA_KV ? await new KvOpportunityRepository(env.PROVENA_KV).list() : []

        // Domain classification happens here in the backend, not in the UI
        const toKvVerdict = (v: string): string => {
          if (v === 'apply') return 'strong-candidate'
          if (v === 'consider') return 'consider'
          return 'unresolved'
        }
        const toKvTab = (tier: string, userDecision: string): AttentionTab => {
          if (userDecision && userDecision !== 'new') return 'decided'
          if (tier === 'strong-candidate') return 'needs-attention'
          if (tier === 'consider') return 'worth-considering'
          return 'unresolved'
        }

        const classified = (opps || []).map(o => {
          if (!o) return null
          const ev = o.evaluation || {}
          const evAny = ev as any
          const pf: number = evAny.professionalFit?.score ?? evAny.professionalFitScore ?? 0
          const pers: number = evAny.personalFit?.score ?? evAny.personalFitScore ?? 0
          const conf: number = ev?.confidence ?? 0.5
          const verdict = toKvVerdict(ev?.verdict || 'abstain')
          const userDecision = o.userDecision || 'new'
          return {
            id: o.id || '',
            title: o.raw?.title || 'Opportunity',
            companyName: o.raw?.company || '',
            url: o.raw?.url || '#',
            tab: toKvTab(verdict, userDecision),
            verdict,
            profFit: pf.toFixed(1),
            personalFit: pers.toFixed(1),
            evidenceCoverage: Math.round(conf * 100) + '%',
            userDecision,
            _pf: pf,
            _conf: conf,
          }
        }).filter((item): item is NonNullable<typeof item> => item !== null)

        const counts = {
          'needs-attention': classified.filter(r => r.tab === 'needs-attention').length,
          'worth-considering': classified.filter(r => r.tab === 'worth-considering').length,
          'unresolved': classified.filter(r => r.tab === 'unresolved').length,
          'decided': classified.filter(r => r.tab === 'decided').length,
        }

        const tabItems = classified.filter(r => r.tab === tab)
          .sort((a, b) => b._pf - a._pf || b._conf - a._conf)
        const offset = bookmarkParam ? parseInt(bookmarkParam, 10) || 0 : 0
        const pageItems = tabItems.slice(offset, offset + limit)
        const nextOffset = offset + pageItems.length

        return new Response(JSON.stringify({
          tab,
          counts,
          items: pageItems,
          nextBookmark: nextOffset < tabItems.length ? String(nextOffset) : null,
          totalInTab: tabItems.length,
          totalEvaluatedCount: classified.length,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(JSON.stringify({
          tab,
          counts: { 'needs-attention': 0, 'worth-considering': 0, 'unresolved': 0, 'decided': 0 },
          items: [],
          nextBookmark: null,
          totalInTab: 0,
          error: e instanceof Error ? e.message : 'Failed to fetch opportunities',
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/opportunities/decision') {
      try {
        const body = (await request.json()) as { id?: string; decision?: OpportunityUserDecision }
        if (!body.id || !body.decision) return new Response('Missing id or decision', { status: 400 })

        if (env.DATABASE_URL) {
          const sql = postgres(env.DATABASE_URL, { max: 1 })
          try {
            const decisionRepo = new PostgresUserDecisionRepository(sql)
            await decisionRepo.setDecision(body.id, body.decision, 'valentin')
          } finally {
            await sql.end()
          }
        }

        if (env.PROVENA_KV) {
          await new KvOpportunityRepository(env.PROVENA_KV).updateDecision(body.id, body.decision)
        }
        return new Response('ok', { status: 200 })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Invalid request', { status: 400 })
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/opportunities/ingest') {
      try {
        const body = (await request.json()) as { boardToken?: string }
        const boardToken = body.boardToken || 'stripe'
        
        // Greenhouse's public board API is a fixed, known-safe domain (unlike arbitrary
        // user-submitted URLs), so a larger board can legitimately exceed the general
        // SSRF-guard default cap without it being a resource-exhaustion risk.
        const source = new GreenhousePublicSource(boardToken, { maxSizeBytes: 10 * 1024 * 1024 })
        const fetchedRawJobs = await source.fetchAllBoardJobs()
        await registerObservedSource(env, boardToken, fetchedRawJobs.length)

        if (env.DATABASE_URL) {
          const sql = postgres(env.DATABASE_URL, { max: 1 })
          try {
            const oppRepo = new PostgresMarketOpportunityRepository(sql)
            const postRepo = new PostgresMarketPostingRepository(sql)
            const modelStore = new PostgresMarketModelStore(sql)
            const assessmentRepo = new PostgresMarketAssessmentRepository(sql)
            const composedK = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)
            const recognizer = new DeclarativeMarketRecognizer(composedK)

            const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
            const ingestResult = await engine.ingest(fetchedRawJobs, {
              now: new Date().toISOString(),
              marketKnowledgeVersion: composedK.version,
              recognitionOrder: 100,
              sourceType: 'greenhouse',
              sourceBoardId: boardToken,
            })

            for (const rawOpp of fetchedRawJobs) {
              const companyName = rawOpp.company ?? boardToken ?? 'Unknown'
              const normalizedCompany = companyName.toLowerCase().replace(/[^a-z0-9]/g, '')
              const externalId = rawOpp.externalId ?? rawOpp.url
              const oppDedupeKey = `opp-${normalizedCompany}-${externalId}`

              const marketModel = recognizer.extractMarketRequirements(rawOpp.description)
              const resolved = resolveRequirements(marketModel, profile)
              const suffList = resolved.map(evaluateSufficiency)
              const profFit = projectProfessionalFit(suffList)
              const prefAssessments = assessPreferences(rawOpp.description, profile.preferences)
              const persFit = projectPersonalFit(prefAssessments)
              const recCov = computeRecognitionCoverage(rawOpp.description, marketModel)
              const assessment = applyPolicy(profFit, persFit, recCov)

              const tierNum = assessment.recommendation === 'strong-candidate' ? 4 :
                              assessment.recommendation === 'consider' ? 3 :
                              assessment.recommendation === 'abstain' ? 2 : 1

              await assessmentRepo.saveAssessment({
                opportunityId: oppDedupeKey,
                profileId: 'valentin',
                profileVersion: '1.0.0',
                protocolVersion: 1,
                marketKnowledgeVersion: 1,
                recommendation: assessment.recommendation,
                decisionTier: tierNum,
                professionalFit: profFit.score,
                personalFit: persFit.assessedCount > 0 ? persFit.score : 0,
                confidence: assessment.confidence,
                evaluatedAt: new Date().toISOString(),
              })
            }

            if (!env.PROVENA_KV) {
              return new Response(JSON.stringify({
                boardToken,
                fetchedCount: fetchedRawJobs.length,
                newlyAddedCount: ingestResult.newlyAddedPostings,
                totalMemoryCount: ingestResult.totalIngested,
                dbDirect: true,
              }), {
                headers: { 'Content-Type': 'application/json' },
              })
            }
          } finally {
            await sql.end()
          }
        }

        if (!env.PROVENA_KV) {
          return new Response(JSON.stringify({
            boardToken,
            fetchedCount: 0,
            newlyAddedCount: 0,
            totalMemoryCount: 0,
            message: 'PROVENA_KV is not configured in this environment.'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } })
        }

        const repository = new KvOpportunityRepository(env.PROVENA_KV)
        const existing = await repository.list()

        const composedK = composeKnowledge(DEFAULT_SOFTWARE_KNOWLEDGE, ADMIN_KNOWLEDGE, MLOPS_KNOWLEDGE, DATA_AGENTIC_KNOWLEDGE)
        const recognizer = new DeclarativeMarketRecognizer(composedK)

        const { opportunities, newlyAddedCount } = reconcileBoardSync(
          existing,
          fetchedRawJobs,
          raw => raw.source === 'greenhouse' && raw.company === boardToken,
          rawOpp => {
            const marketModel = recognizer.extractMarketRequirements(rawOpp.description)
            const resolved = resolveRequirements(marketModel, profile)
            const suffList = resolved.map(evaluateSufficiency)
            const profFit = projectProfessionalFit(suffList)
            const prefAssessments = assessPreferences(rawOpp.description, profile.preferences)
            const persFit = projectPersonalFit(prefAssessments)
            const recCov = computeRecognitionCoverage(rawOpp.description, marketModel)
            const assessment = applyPolicy(profFit, persFit, recCov)
            const legacyEv = evaluateOpportunity(rawOpp.description, profile)

            return {
              evaluation: {
                ...legacyEv,
                rawOpportunity: rawOpp,
                marketModel,
                professionalFit: profFit,
                personalFit: persFit,
                assessment,
                recognitionCoverage: recCov,
                knowledgeMode: 'composed',
                knowledgeName: composedK.name,
                knowledgePatternsCount: composedK.patterns.length,
              },
              knowledgeVersion: composedK.version,
            }
          },
          new Date().toISOString()
        )

        await repository.saveMany(opportunities)

        return new Response(JSON.stringify({
          boardToken,
          fetchedCount: fetchedRawJobs.length,
          newlyAddedCount,
          totalMemoryCount: opportunities.length,
        }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Ingestion failed'
        const hint = message.includes('404') ? ` — no public Greenhouse board found for that token. Check the company's careers page for its board token (often visible in the URL as boards.greenhouse.io/{token}).` : ''
        return new Response(message + hint, { status: 400 })
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/market/sync') {
      try {
        if (!env.DATABASE_URL) {
          return new Response('DATABASE_URL secret is not set in environment', { status: 500 })
        }

        const sql = postgres(env.DATABASE_URL, { max: 1 })
        const oppRepo = new PostgresMarketOpportunityRepository(sql)
        const postRepo = new PostgresMarketPostingRepository(sql)
        const modelStore = new PostgresMarketModelStore(sql)
        const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)

        const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
        const feedService = new MarketFeedService(postRepo, engine)

        const source = new GreenhousePublicSource('stripe')
        const registration = {
          id: 'stripe-board',
          sourceType: 'greenhouse' as const,
          source,
          sourceBoardId: 'stripe',
        }

        const syncResult = await feedService.syncSource(registration, {
          now: new Date().toISOString(),
          marketKnowledgeVersion: DEFAULT_SOFTWARE_KNOWLEDGE.version,
          recognitionOrder: 100,
        })

        await sql.end()

        return new Response(JSON.stringify({ status: 'ok', syncResult }), {
          headers: { 'Content-Type': 'application/json' },
        })
      } catch (e) {
        return new Response(e instanceof Error ? e.message : 'Sync failed', { status: 500 })
      }
    }

    return new Response('Not found', { status: 404 })
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (!env.DATABASE_URL) {
      console.error('[Cloudflare Cron] Cannot execute autonomous market sync: DATABASE_URL is not set.')
      return
    }

    ctx.waitUntil(
      (async () => {
        const sql = postgres(env.DATABASE_URL!, { max: 1 })
        const oppRepo = new PostgresMarketOpportunityRepository(sql)
        const postRepo = new PostgresMarketPostingRepository(sql)
        const modelStore = new PostgresMarketModelStore(sql)
        const recognizer = new DeclarativeMarketRecognizer(DEFAULT_SOFTWARE_KNOWLEDGE)

        const engine = new MarketIngestionEngine(oppRepo, postRepo, modelStore, recognizer)
        const feedService = new MarketFeedService(postRepo, engine)

        const source = new GreenhousePublicSource('stripe')
        const registration = {
          id: 'stripe-board',
          sourceType: 'greenhouse' as const,
          source,
          sourceBoardId: 'stripe',
        }

        const res = await feedService.syncSource(registration, {
          now: new Date().toISOString(),
          marketKnowledgeVersion: DEFAULT_SOFTWARE_KNOWLEDGE.version,
          recognitionOrder: 100,
        })

        console.log(`[Cloudflare Cron Auto-Sync Result]: ${JSON.stringify(res.ingestResult)}`)
        await sql.end()
      })()
    )
  },
}

