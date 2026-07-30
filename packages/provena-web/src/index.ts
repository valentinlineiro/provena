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
main { max-width: 30rem; margin: 2rem auto; }
h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; }
textarea { width: 100%; min-height: 6rem; font-size: 1rem; padding: 0.75rem; border: 1px solid #ccc; border-radius: 0.5rem; resize: vertical; font-family: inherit; }
button { width: 100%; padding: 0.75rem; font-size: 1rem; font-weight: 500; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; margin-top: 0.75rem; }
button:active { opacity: 0.8; }
#status { margin-top: 0.75rem; font-size: 0.875rem; color: #666; }
</style>
<main>
<h1>Capturar</h1>
<p style="color:#666;margin-bottom:1rem">¿Qué quieres recordar?</p>
<textarea id="content" placeholder="Acabo de..."></textarea>
<button onclick="save()">Guardar</button>
<p id="status"></p>
</main>
<script>
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
    document.getElementById('status').textContent = '✓ Capturado'
    document.getElementById('content').value = ''
  } else {
    document.getElementById('status').textContent = 'Error: ' + (await res.text())
  }
}
</script>`

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (request.method === 'GET' && url.pathname === '/') {
      return new Response(PAGE, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
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
