# Redesign `/cv` as an A4-first CV Document Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `@provena/html` and `/cv` in `@provena/web` so that `/cv` renders an authentic A4-first CV document with WYSIWYG print parity.

**Architecture:** Refactor `HtmlCvRenderer` in `@provena/html` to separate `renderDocument(model)` (pure `.cv-document` HTML fragment) and `renderStyles()` (scoped CSS + print rules) while maintaining `render(model)` for standalone HTML shell. `/cv` in `@provena/web` directly embeds these primitives inside a workspace sidebar + paper canvas shell without an iframe.

**Tech Stack:** TypeScript, Node.js (`node:test`), Cloudflare Workers (`@provena/web`), Vanilla CSS.

## Global Constraints

- `HtmlCvRenderer` in `@provena/html` is the sole source of document HTML & CSS rendering logic.
- Document markup is root-wrapped in `.cv-document`; all document styles are scoped under `.cv-document`.
- Document CSS uses fixed A4 scale (`210mm` width, physical margins, sober typography).
- `/cv` workspace sidebar handles Provena UI controls and print orchestration (`@media print`). Canvas scales sheet visually on small screens without reflow.
- What is seen in screen preview matches paper / PDF export (WYSIWYG print parity).

---

### Task 1: Refactor `@provena/html` for Document Fragment & Scoped CSS Isolation

**Files:**
- Modify: `packages/html/src/html-cv.ts`
- Modify: `packages/html/src/html-resume.test.ts`

**Interfaces:**
- Produces: 
  - `HtmlCvRenderer.prototype.renderDocument(model: CVProjection): string`
  - `HtmlCvRenderer.prototype.renderStyles(): string`
  - `HtmlCvRenderer.prototype.render(model: CVProjection): string`

- [ ] **Step 1: Write failing unit test for `renderDocument` and `renderStyles`**

Add tests to `packages/html/src/html-resume.test.ts`:

```typescript
test('HtmlCvRenderer provides renderDocument and renderStyles methods', () => {
  const cv = cvProjector(profile)
  const renderer = new HtmlCvRenderer()
  const docHtml = renderer.renderDocument(cv)
  const css = renderer.renderStyles()
  
  assert.ok(docHtml.startsWith('<article class="cv-document">'))
  assert.ok(docHtml.includes('</article>'))
  assert.ok(!docHtml.includes('<!DOCTYPE html>'))
  
  assert.ok(css.includes('.cv-document {'))
  assert.ok(css.includes('.cv-document h1 {'))
  assert.ok(css.includes('210mm'))
})
```

- [ ] **Step 2: Run unit test to verify failure**

Run: `npm test --prefix packages/html`
Expected: FAIL (`renderDocument` and `renderStyles` not defined)

- [ ] **Step 3: Implement `renderDocument`, `renderStyles`, and refactor `render` in `html-cv.ts`**

Update `packages/html/src/html-cv.ts`:

```typescript
import type { Renderer, CVProjection } from '@provena/core'

function fmtDate(d: string): string {
  const [y, m] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m ? `${months[parseInt(m) - 1] ?? ''} ${y}` : y ?? d
}

function fmtRange(start: string, end?: string): string {
  return `${fmtDate(start)} — ${end ? fmtDate(end) : 'Present'}`
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export class HtmlCvRenderer implements Renderer<CVProjection> {
  renderStyles(): string {
    return `
      .cv-document {
        box-sizing: border-box;
        width: 210mm;
        min-height: 297mm;
        padding: 15mm 18mm;
        margin: 0 auto;
        background: #ffffff;
        color: #111111;
        font-family: system-ui, -apple-system, blinkmacsystemfont, "Segoe UI", roboto, sans-serif;
        font-size: 9.5pt;
        line-height: 1.45;
        text-align: left;
      }

      .cv-document * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .cv-document header {
        margin-bottom: 1.25rem;
      }

      .cv-document h1 {
        font-size: 20pt;
        font-weight: 700;
        letter-spacing: -0.02em;
        line-height: 1.15;
        margin-bottom: 0.2rem;
        color: #111111;
      }

      .cv-document header p.headline {
        font-size: 11pt;
        font-weight: 600;
        color: #444444;
        margin-bottom: 0.5rem;
      }

      .cv-document header p.summary {
        font-size: 9.5pt;
        color: #222222;
        line-height: 1.5;
      }

      .cv-document section {
        margin-top: 1.25rem;
      }

      .cv-document h2 {
        font-size: 11pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #111111;
        border-bottom: 1.5px solid #111111;
        padding-bottom: 0.2rem;
        margin-bottom: 0.6rem;
        page-break-after: avoid;
        break-after: avoid;
      }

      .cv-document-article {
        margin-bottom: 0.85rem;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .cv-document h3 {
        font-size: 10pt;
        font-weight: 700;
        color: #111111;
      }

      .cv-document-meta {
        font-size: 9pt;
        color: #555555;
        margin-bottom: 0.25rem;
      }

      .cv-document-meta time {
        color: #555555;
      }

      .cv-document p {
        margin-top: 0.2rem;
        color: #222222;
      }

      .cv-document ul {
        margin: 0.3rem 0 0.3rem 1.2rem;
      }

      .cv-document li {
        margin-bottom: 0.15rem;
        color: #222222;
      }

      .cv-document small.tech {
        display: block;
        font-size: 8.5pt;
        color: #555555;
        margin-top: 0.2rem;
      }

      .cv-document a {
        color: inherit;
        text-decoration: underline;
      }

      @media print {
        .cv-document h2 {
          page-break-after: avoid;
          break-after: avoid;
        }
        .cv-document-article {
          page-break-inside: avoid;
          break-inside: avoid;
        }
      }
    `
  }

  renderDocument(model: CVProjection): string {
    const parts: string[] = []
    parts.push('<article class="cv-document">')
    parts.push('<header>')
    parts.push('<h1>' + esc(model.identity.name) + '</h1>')
    if (model.headline) parts.push('<p class="headline">' + esc(model.headline) + '</p>')
    if (model.summary) parts.push('<p class="summary">' + esc(model.summary) + '</p>')
    parts.push('</header>')

    if (model.experiences.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Experience</h2>')
      for (const exp of model.experiences) {
        parts.push('<div class="cv-document-article">')
        parts.push('<h3>' + esc(exp.organization) + '</h3>')
        parts.push('<div class="cv-document-meta"><strong>' + esc(exp.title) + '</strong> — <time>' + fmtRange(exp.start, exp.end) + '</time></div>')
        if (exp.summary) parts.push('<p>' + esc(exp.summary) + '</p>')
        if (exp.achievements.length > 0) {
          parts.push('<ul>')
          for (const a of exp.achievements) parts.push('<li>' + esc(a) + '</li>')
          parts.push('</ul>')
        }
        if (exp.technologies.length > 0) parts.push('<small class="tech">Technologies: ' + exp.technologies.map(esc).join(', ') + '</small>')
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.projects.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Projects</h2>')
      for (const proj of model.projects) {
        parts.push('<div class="cv-document-article">')
        const name = proj.url ? '<a href="' + esc(proj.url) + '">' + esc(proj.name) + '</a>' : esc(proj.name)
        parts.push('<h3>' + name + '</h3>')
        if (proj.role) parts.push('<div class="cv-document-meta"><em>' + esc(proj.role) + '</em></div>')
        parts.push('<p>' + esc(proj.description) + '</p>')
        if (proj.technologies.length > 0) parts.push('<small class="tech">Technologies: ' + proj.technologies.map(esc).join(', ') + '</small>')
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.education.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Education</h2>')
      for (const edu of model.education) {
        const field = edu.field ? ' in ' + esc(edu.field) : ''
        parts.push('<div class="cv-document-article">')
        parts.push('<h3>' + esc(edu.degree) + field + '</h3>')
        parts.push('<div class="cv-document-meta">' + esc(edu.institution) + ' — <time>' + fmtRange(edu.start ?? '', edu.end) + '</time></div>')
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.certifications.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Certifications</h2>')
      parts.push('<ul>')
      for (const cert of model.certifications) {
        const name = cert.url ? '<a href="' + esc(cert.url) + '">' + esc(cert.name) + '</a>' : esc(cert.name)
        parts.push('<li>' + name + ' — ' + esc(cert.issuer) + (cert.date ? ' (' + esc(cert.date) + ')' : '') + '</li>')
      }
      parts.push('</ul>')
      parts.push('</section>')
    }

    if (model.expertise.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Core Expertise</h2>')
      parts.push('<ul>')
      for (const area of model.expertise) parts.push('<li>' + esc(area) + '</li>')
      parts.push('</ul>')
      parts.push('</section>')
    }

    if (model.technologies.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Primary Technologies</h2>')
      parts.push('<ul>')
      for (const t of model.technologies) parts.push('<li>' + esc(t) + '</li>')
      parts.push('</ul>')
      parts.push('</section>')
    }

    parts.push('</article>')
    return parts.join('\n')
  }

  render(model: CVProjection): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.identity.name)} — CV</title>
<style>
${this.renderStyles()}
</style>
</head>
<body style="background: #e5e5e5; padding: 2rem 0;">
${this.renderDocument(model)}
</body>
</html>`
  }
}

export { HtmlCvRenderer as HtmlResumeRenderer }
```

- [ ] **Step 4: Run unit tests to verify they pass**

Run: `npm test --prefix packages/html`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add packages/html/src/html-cv.ts packages/html/src/html-resume.test.ts
git commit -m "refactor(html): support renderDocument and renderStyles for A4-first document rendering"
```

---

### Task 2: Redesign `/cv` Workspace Layout & Print Orchestration in `@provena/web`

**Files:**
- Modify: `packages/provena-web/src/index.ts`
- Modify: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `HtmlResumeRenderer.prototype.renderDocument(model)` and `renderStyles()`
- Produces: `/cv` workspace HTML & client-side preview rendering script

- [ ] **Step 1: Write failing test in `packages/provena-web/src/pages.test.ts`**

Add tests to `packages/provena-web/src/pages.test.ts`:

```typescript
test('GET /cv contains workspace layout and cv-document preview container', async () => {
  const res = await app.fetch(new Request('http://localhost/cv'))
  assert.equal(res.status, 200)
  const html = await res.text()
  assert.ok(html.includes('class="cv-workspace"'))
  assert.ok(html.includes('class="cv-workspace-sidebar"'))
  assert.ok(html.includes('class="cv-canvas"'))
  assert.ok(html.includes('class="cv-sheet"'))
  assert.ok(html.includes('class="cv-document"'))
  assert.ok(html.includes('@media print'))
})
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test --prefix packages/provena-web`
Expected: FAIL (`.cv-workspace` classes not present)

- [ ] **Step 3: Refactor `CV_PAGE` in `packages/provena-web/src/index.ts`**

Replace `CV_PAGE` in `packages/provena-web/src/index.ts`:

```typescript
const htmlRenderer = new HtmlResumeRenderer()

const CV_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Provena — Prepare CV</title>
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: #f0f0f0; color: #1a1a1a; min-height: 100vh; }

.cv-workspace { display: flex; min-height: 100vh; }

.cv-workspace-sidebar {
  width: 320px;
  background: #ffffff;
  border-right: 1px solid #e0e0e0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  flex-shrink: 0;
}

.cv-workspace-sidebar h1 { font-size: 1.125rem; font-weight: 700; }
.cv-workspace-sidebar .subtitle { color: #666; font-size: 0.875rem; margin-top: 0.125rem; }

label { display: block; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-top: 0.5rem; }
input, select { width: 100%; padding: 0.5rem; font-size: 0.875rem; border: 1px solid #ccc; border-radius: 0.375rem; font-family: inherit; }

.check { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.check label { display: flex; align-items: center; gap: 0.25rem; text-transform: none; letter-spacing: 0; color: #333; font-size: 0.8125rem; background: #f5f5f5; border-radius: 999px; padding: 0.25rem 0.625rem; margin: 0; }
.check input { width: auto; }

.actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem; }
button { width: 100%; padding: 0.625rem; font-size: 0.875rem; font-weight: 600; background: #1a1a1a; color: #fff; border: none; border-radius: 0.5rem; cursor: pointer; }
button.secondary { background: #ffffff; color: #1a1a1a; border: 1px solid #ccc; }
button:hover { opacity: 0.9; }

.meta { background: #fffbe6; border: 1px solid #e6d98a; border-radius: 0.5rem; padding: 0.625rem; font-size: 0.8125rem; color: #6b5b00; display: none; }

.cv-canvas {
  flex: 1;
  background: #e2e8f0;
  padding: 2rem;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.cv-sheet {
  background: #ffffff;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  transform-origin: top center;
}

${htmlRenderer.renderStyles()}

@page {
  size: A4;
  margin: 0;
}

@media print {
  body { background: #ffffff; }
  .cv-workspace-sidebar { display: none !important; }
  .cv-canvas { display: contents !important; padding: 0 !important; background: transparent !important; }
  .cv-sheet { box-shadow: none !important; margin: 0 !important; padding: 0 !important; }
}

@media (max-width: 860px) {
  .cv-workspace { flex-direction: column; }
  .cv-workspace-sidebar { width: 100%; border-right: none; border-bottom: 1px solid #e0e0e0; }
  .cv-canvas { padding: 1rem 0.5rem; overflow-x: auto; }
  .cv-sheet { transform: scale(calc(min(100vw - 1rem, 794px) / 794)); transform-origin: top left; }
}
</style>

<div class="cv-workspace">
  <aside class="cv-workspace-sidebar">
    ${siteNav('prepare')}
    <div>
      <h1>Prepare CV</h1>
      <p class="subtitle">A4 printable document workspace</p>
    </div>

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
      <label>Suggested emphasis</label>
      <div class="check" id="caps"></div>
    </section>

    <div class="meta" id="meta"></div>
    <div class="meta" id="readiness"></div>

    <div class="actions">
      <button onclick="window.print()">Download PDF / Print</button>
      <button class="secondary" onclick="exportMd()">Download .md</button>
    </div>
  </aside>

  <main class="cv-canvas">
    <div class="cv-sheet" id="sheet">
      <!-- HtmlCvRenderer.renderDocument injects here -->
    </div>
  </main>
</div>

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
function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]) }
document.getElementById('caps').innerHTML = capNames.map(s =>
  '<label><input type="checkbox" data-cap="' + esc(s) + '" checked> ' + esc(s) + '</label>'
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
  if (!res.ok) { document.getElementById('sheet').innerHTML = '<p style="padding:2rem;">Error: ' + await res.text() + '</p>'; return }
  lastResult = await res.json()
  document.getElementById('sheet').innerHTML = lastResult.docHtml
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

document.getElementById('role').addEventListener('input', preview)
document.getElementById('audience').addEventListener('change', preview)
document.getElementById('autoSummary').addEventListener('change', preview)
document.getElementById('experiences').addEventListener('change', preview)
document.getElementById('caps').addEventListener('change', preview)

preview()
</script>
`
```

Also update `/api/cv/preview` response in `packages/provena-web/src/index.ts` to return `docHtml: htmlRenderer.renderDocument(cv.model)` alongside `markdown` and `cv`.

- [ ] **Step 4: Run tests in `@provena/web`**

Run: `npm test --prefix packages/provena-web`
Expected: PASS

- [ ] **Step 5: Commit task**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): redesign /cv as an A4-first workspace document renderer with print parity"
```

---

### Task 3: End-to-End Verification & Print Parity Inspection

**Files:**
- Test across workspace: `packages/html`, `packages/provena-web`

- [ ] **Step 1: Run all repository tests**

Run: `npm test --workspaces`
Expected: All tests pass cleanly across packages.

- [ ] **Step 2: Start dev server or inspect local bundle output**

Run: `npm run dev --prefix packages/provena-web` (or check build)

- [ ] **Step 3: Verification of WYSIWYG Print Parity (I12)**

Confirm:
1. `.cv-document` on screen retains fixed A4 proportions (`210mm` width).
2. Provena controls stay isolated in `.cv-workspace-sidebar`.
3. Invoking `window.print()` / Print Preview hides sidebar and removes paper shadow while leaving the document sheet 100% identical.

- [ ] **Step 4: Commit plan completion**

```bash
git commit --allow-empty -m "chore: verify A4-first CV document renderer print parity"
```
