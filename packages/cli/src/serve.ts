import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'

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
<h1>¿Qué quieres recordar?</h1>
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

export async function startServer(workspacePath: string, port: number): Promise<void> {
  const capturesDir = join(workspacePath, 'captures')

  const server = createServer(async (req, res) => {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(PAGE)
    } else if (req.method === 'POST' && req.url === '/api/capture') {
      let body = ''
      req.on('data', (chunk) => (body += chunk))
      req.on('end', async () => {
        try {
          const data = JSON.parse(body) as { content: string }
          if (!data.content || typeof data.content !== 'string') {
            res.writeHead(400, { 'Content-Type': 'text/plain' })
            res.end('Missing content')
            return
          }

          await mkdir(capturesDir, { recursive: true })
          const inboxPath = join(capturesDir, 'inbox.yaml')

          const capture = {
            id: `capture-${Date.now()}`,
            content: data.content,
            createdAt: new Date().toISOString().split('T')[0]!,
            status: 'pending',
          }

          const existing = await readFile(inboxPath, 'utf-8').then(
            (d) => yaml.load(d) as { inbox: unknown[] } | null,
            () => null,
          )
          const inbox = existing?.inbox ?? []
          inbox.push(capture)
          await writeFile(inboxPath, yaml.dump({ inbox }))

          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ id: capture.id }))
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'text/plain' })
          res.end(e instanceof Error ? e.message : 'Unknown error')
        }
      })
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  return new Promise((resolve) => {
    server.listen(port, () => {
      const addr = server.address()
      const host = typeof addr === 'object' ? `http://localhost:${addr?.port}` : `http://localhost:${port}`
      console.log(`Provena capture server at ${host}/add`)
      resolve()
    })
  })
}
