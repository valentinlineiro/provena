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

// R10 — renderer never reasons; it serialises the editorialised CvProjection.
export class HtmlCvRenderer implements Renderer<CVProjection> {
  render(model: CVProjection): string {
    const head = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(model.identity.name)}</title>
<style>
  :root { --c-text: #111; --c-muted: #555; --c-border: #ddd; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; color: var(--c-text);
         max-width: 860px; margin: 2rem auto; padding: 0 1.5rem; line-height: 1.6; }
  h1 { font-size: 2rem; margin-bottom: .25rem; }
  h2 { font-size: 1.2rem; margin: 2rem 0 .75rem; border-bottom: 1px solid var(--c-border); padding-bottom: .25rem; }
  h3 { font-size: 1rem; margin-bottom: .15rem; }
  time, small { color: var(--c-muted); font-size: .875rem; }
  ul { padding-left: 1.25rem; }
  a { color: inherit; }
  @media print {
    body { margin: 0; padding: 0; max-width: 100%; font-size: 11pt; }
    h2 { page-break-after: avoid; }
    article { page-break-inside: avoid; }
  }
</style>
</head>
<body>`
    const parts: string[] = [head]

    parts.push('<article>')
    parts.push('<header>')
    parts.push('<h1>' + esc(model.identity.name) + '</h1>')
    if (model.headline) parts.push('<p><em>' + esc(model.headline) + '</em></p>')
    if (model.summary) parts.push('<p>' + esc(model.summary) + '</p>')
    parts.push('</header>')

    if (model.experiences.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Experience</h2>')
      for (const exp of model.experiences) {
        parts.push('<article>')
        parts.push('<h3>' + esc(exp.organization) + '</h3>')
        parts.push('<p><strong>' + esc(exp.title) + '</strong> — <time>' + fmtRange(exp.start, exp.end) + '</time></p>')
        if (exp.summary) parts.push('<p>' + esc(exp.summary) + '</p>')
        if (exp.achievements.length > 0) {
          parts.push('<ul>')
          for (const a of exp.achievements) parts.push('<li>' + esc(a) + '</li>')
          parts.push('</ul>')
        }
        if (exp.technologies.length > 0) parts.push('<p><small>' + exp.technologies.map(esc).join(', ') + '</small></p>')
        parts.push('</article>')
      }
      parts.push('</section>')
    }

    if (model.projects.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Projects</h2>')
      for (const proj of model.projects) {
        parts.push('<article>')
        const name = proj.url ? '<a href="' + esc(proj.url) + '">' + esc(proj.name) + '</a>' : esc(proj.name)
        parts.push('<h3>' + name + '</h3>')
        if (proj.role) parts.push('<p><em>' + esc(proj.role) + '</em></p>')
        parts.push('<p>' + esc(proj.description) + '</p>')
        if (proj.technologies.length > 0) parts.push('<p><small>' + proj.technologies.map(esc).join(', ') + '</small></p>')
        parts.push('</article>')
      }
      parts.push('</section>')
    }

    if (model.education.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Education</h2>')
      for (const edu of model.education) {
        const field = edu.field ? ' in ' + esc(edu.field) : ''
        parts.push('<article>')
        parts.push('<h3>' + esc(edu.degree) + field + '</h3>')
        parts.push('<p>' + esc(edu.institution) + ' — <time>' + fmtRange(edu.start ?? '', edu.end) + '</time></p>')
        parts.push('</article>')
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
      parts.push('<h2>Core expertise</h2>')
      parts.push('<ul>')
      for (const area of model.expertise) parts.push('<li><strong>' + esc(area) + '</strong></li>')
      parts.push('</ul>')
      parts.push('</section>')
    }

    if (model.technologies.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Primary technologies</h2>')
      parts.push('<ul>')
      for (const t of model.technologies) parts.push('<li><strong>' + esc(t) + '</strong></li>')
      parts.push('</ul>')
      parts.push('</section>')
    }

    parts.push('</article>')
    parts.push('</body></html>')

    return parts.join('\n')
  }
}

export { HtmlCvRenderer as HtmlResumeRenderer }