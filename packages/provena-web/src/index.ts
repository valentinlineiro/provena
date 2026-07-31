/// <reference types="@cloudflare/workers-types" />
import timeline from './timeline.js'

interface Env {
  PROVENA_KV: KVNamespace
}

interface Capture {
  id: string
  content: string
  createdAt: string
  status: 'pending'
}

const PAGE = `<!DOCTYPE html>
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 1rem; }
main { max-width: 34rem; margin: 2rem auto; }
h1 { font-size: 1.5rem; font-weight: 700; }
.subtitle { color: #555; margin-top: 0.25rem; }
.focus { color: #777; font-size: 0.875rem; margin-top: 0.25rem; }
.current { color: #1a1a1a; font-size: 1rem; margin-top: 0.75rem; padding: 0.75rem; background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; }
section { margin-top: 2rem; }
h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #999; margin-bottom: 0.5rem; }
.experience { background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; margin-bottom: 0.5rem; }
.experience .role { font-weight: 600; font-size: 1rem; }
.experience .org { color: #555; font-size: 0.875rem; }
.experience .dates { color: #999; font-size: 0.75rem; }
.experience .hitos { color: #777; font-size: 0.75rem; margin-top: 0.25rem; }
.experience .caps { margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.375rem; }
.tag { background: #efefef; color: #333; font-size: 0.75rem; padding: 0.125rem 0.5rem; border-radius: 999px; }
.ok { color: #2e7d32; font-size: 0.875rem; }
.stats { display: flex; gap: 1rem; background: #fff; border: 1px solid #e5e5e5; border-radius: 0.5rem; padding: 0.875rem; }
.stat { flex: 1; text-align: center; }
.stat b { display: block; font-size: 1.25rem; }
.stat span { font-size: 0.75rem; color: #777; }
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
<h1 id="name"></h1>
<p class="subtitle" id="title"></p>
<p class="focus" id="focus"></p>
<p class="current" id="current"></p>

<section>
  <h2>Resumen</h2>
  <div class="stats" id="stats"></div>
</section>

<section>
  <h2>Experiencias</h2>
  <div id="experiences"></div>
</section>

<section>
  <h2>Capturas pendientes</h2>
  <div id="captures"></div>
  <p id="captures-empty" class="hidden ok">✓ Historia al día. Todo incorporado.</p>
</section>

<button id="add-btn" onclick="showAdd()">+ Añadir evolución</button>

<section id="add-form" class="hidden">
  <h2>¿Qué ha pasado?</h2>
  <div class="quick" id="quick"></div>
  <textarea id="content" placeholder="Acabo de..."></textarea>
  <button onclick="save()">Añadir a mi historia</button>
  <p id="status"></p>
</section>
</main>
<script>
const timeline = ${JSON.stringify(timeline)}

document.getElementById('name').textContent = timeline.name
document.getElementById('title').textContent = timeline.title
document.getElementById('focus').textContent = timeline.focus
document.getElementById('current').textContent = '· ' + timeline.current

const caps = new Set()
for (const e of timeline.experiences) for (const c of e.capabilities) caps.add(c)

document.getElementById('stats').innerHTML = [
  ['Experiencias', timeline.experiences.length],
  ['Capacidades', caps.size],
  ['Capturas', '<span id="capture-count">…</span>'],
].map(([label, value]) => '<div class="stat"><b id="stat-' + label.toLowerCase() + '">' + value + '</b><span>' + label + '</span></div>').join('')

document.getElementById('experiences').innerHTML = timeline.experiences.map(e => {
  const dates = e.end ? e.start + ' — ' + e.end : e.start + ' — presente'
  return '<div class="experience"><div class="role">' + e.title + '</div>' +
    '<div class="org">' + e.organization + '</div>' +
    '<div class="dates">' + dates + '</div>' +
    (e.hitos ? '<div class="hitos">' + e.hitos + (e.hitos === 1 ? ' hito registrado' : ' hitos registrados') + '</div>' : '') +
    '<div class="caps">' + e.capabilities.map(c => '<span class="tag">' + c + '</span>').join('') + '</div></div>'
}).join('')

const PROMPTS = ['Acabo de terminar…', 'He aprendido…', 'He conseguido…', 'Estoy trabajando en…']
document.getElementById('quick').innerHTML = PROMPTS.map(p => '<button onclick="setPrompt(\\'' + p + '\\')">' + p.replace('…', '') + '</button>').join('')

function setPrompt(p) {
  const ta = document.getElementById('content')
  ta.value = p.replace('…', '') + ' '
  ta.placeholder = ''
  ta.focus()
}

function showAdd() {
  document.getElementById('add-form').classList.remove('hidden')
  document.getElementById('add-btn').scrollIntoView({ behavior: 'smooth' })
}

async function loadCaptures() {
  const res = await fetch('/api/captures')
  if (!res.ok) return
  const { inbox } = await res.json()
  document.getElementById('capture-count').textContent = inbox.length
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
  document.getElementById('status').textContent = 'Guardando...'
  const res = await fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (res.ok) {
    document.getElementById('status').textContent = '✓ Añadido a tu historia'
    document.getElementById('content').value = ''
    loadCaptures()
  } else {
    document.getElementById('status').textContent = 'Error: ' + (await res.text())
  }
}

loadCaptures()
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
