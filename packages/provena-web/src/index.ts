/// <reference types="@cloudflare/workers-types" />
import timeline from './timeline.js'
import { computeCareerCompass, narrateCompass } from './compass.js'

const COMPASS_HTML = (() => {
  const compass = computeCareerCompass(timeline)
  const n = narrateCompass(compass, timeline)
  const sections = [
    '<div class="status ' + (compass.readiness === 'ready' ? 'ok' : compass.readiness === 'unknown' ? 'neutral' : 'warn') + '">' + n.status + '</div>',
    '<p class="headline">' + n.headline + '</p>',
    n.strengths.length ? '<div class="fact"><span class="label">Strengths</span><ul>' + n.strengths.map(s => '<li>' + s + '</li>').join('') + '</ul></div>' : '',
    n.gapLabel ? '<div class="fact"><span class="label">Evidence gap</span><ul><li>' + n.gapLabel + '</li></ul></div>' : '',
    '<div class="fact"><span class="label">Next step</span><p>' + n.nextStep + '</p></div>',
    '<details class="why"><summary>Why this conclusion</summary><ul>' + n.why.map(l => '<li>' + l + '</li>').join('') + '</ul></details>',
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

const PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Professional Journey</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
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
</style>
<main>
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
const timeline = ${JSON.stringify(timeline)}

document.getElementById('name').textContent = timeline.name
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

    return new Response('Not found', { status: 404 })
  },
}
