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
  renderStyles(): string {
    return `
      .cv-document {
        box-sizing: border-box;
        width: 210mm;
        min-height: 297mm;
        padding: 12mm 15mm;
        margin: 0 auto;
        background: #ffffff;
        color: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif;
        font-size: 9.5pt;
        line-height: 1.5;
        text-align: left;
      }

      .cv-document * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .cv-document header {
        margin-bottom: 1.5rem;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 1.25rem;
      }

      .cv-document h1 {
        font-size: 24pt;
        font-weight: 800;
        letter-spacing: -0.03em;
        line-height: 1.15;
        margin-bottom: 0.25rem;
        color: #0f172a;
      }

      .cv-document header p.headline {
        font-size: 11pt;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.75rem;
      }

      .cv-document header p.summary {
        font-size: 9.5pt;
        color: #334155;
        line-height: 1.6;
        max-width: 68ch;
      }

      .cv-document section {
        margin-top: 1.5rem;
      }

      .cv-document h2 {
        font-size: 9pt;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: #64748b;
        border-bottom: 1px solid #e2e8f0;
        padding-bottom: 0.35rem;
        margin-bottom: 0.85rem;
        page-break-after: avoid;
        break-after: avoid;
      }

      .cv-document-article {
        margin-bottom: 1rem;
      }

      .cv-document-article-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 0.25rem;
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-after: avoid;
        break-after: avoid;
      }

      .cv-document h3 {
        font-size: 10.5pt;
        font-weight: 700;
        color: #0f172a;
      }

      .cv-document-meta {
        font-size: 9pt;
        color: #475569;
        margin-bottom: 0.35rem;
      }

      .cv-document-meta time {
        color: #64748b;
        font-size: 8.5pt;
        font-weight: 500;
      }

      .cv-document p {
        margin-top: 0.25rem;
        color: #334155;
        line-height: 1.55;
      }

      .cv-document ul {
        margin: 0.35rem 0 0.35rem 1.25rem;
      }

      .cv-document li {
        margin-bottom: 0.25rem;
        color: #334155;
        line-height: 1.5;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      .cv-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-top: 0.375rem;
      }

      .cv-chip {
        display: inline-block;
        background: #f1f5f9;
        color: #334155;
        font-size: 8pt;
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
        border: 1px solid #e2e8f0;
      }

      .cv-cert-item {
        margin-bottom: 0.35rem;
        font-size: 9pt;
      }

      .cv-cert-name {
        font-weight: 600;
        color: #0f172a;
      }

      .cv-cert-meta {
        color: #64748b;
        margin-left: 0.375rem;
      }

      .cv-document a {
        color: inherit;
        text-decoration: underline;
      }

      @media print {
        .cv-document {
          padding: 8mm 10mm;
        }
        .cv-document h2 {
          page-break-after: avoid;
          break-after: avoid;
        }
        .cv-document-article-header {
          page-break-inside: avoid;
          break-inside: avoid;
          page-break-after: avoid;
          break-after: avoid;
        }
        .cv-document li {
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
        parts.push('<div class="cv-document-article-header">')
        parts.push('<h3>' + esc(exp.organization) + '</h3>')
        parts.push('<time>' + fmtRange(exp.start, exp.end) + '</time>')
        parts.push('</div>')
        parts.push('<div class="cv-document-meta"><strong>' + esc(exp.title) + '</strong></div>')
        if (exp.summary) parts.push('<p>' + esc(exp.summary) + '</p>')
        if (exp.achievements.length > 0) {
          parts.push('<ul>')
          for (const a of exp.achievements) parts.push('<li>' + esc(a) + '</li>')
          parts.push('</ul>')
        }
        if (exp.technologies.length > 0) {
          parts.push('<div class="cv-chips">')
          for (const t of exp.technologies) parts.push('<span class="cv-chip">' + esc(t) + '</span>')
          parts.push('</div>')
        }
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.projects.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Projects</h2>')
      for (const proj of model.projects) {
        parts.push('<div class="cv-document-article">')
        parts.push('<div class="cv-document-article-header">')
        const name = proj.url ? '<a href="' + esc(proj.url) + '">' + esc(proj.name) + '</a>' : esc(proj.name)
        parts.push('<h3>' + name + '</h3>')
        if (proj.role) parts.push('<div class="cv-document-meta"><em>' + esc(proj.role) + '</em></div>')
        parts.push('</div>')
        parts.push('<p>' + esc(proj.description) + '</p>')
        if (proj.technologies.length > 0) {
          parts.push('<div class="cv-chips">')
          for (const t of proj.technologies) parts.push('<span class="cv-chip">' + esc(t) + '</span>')
          parts.push('</div>')
        }
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
        parts.push('<div class="cv-document-article-header">')
        parts.push('<h3>' + esc(edu.degree) + field + '</h3>')
        parts.push('<time>' + fmtRange(edu.start ?? '', edu.end) + '</time>')
        parts.push('</div>')
        parts.push('<div class="cv-document-meta">' + esc(edu.institution) + '</div>')
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.certifications.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Certifications</h2>')
      for (const cert of model.certifications) {
        parts.push('<div class="cv-cert-item">')
        const name = cert.url ? '<a href="' + esc(cert.url) + '" class="cv-cert-name">' + esc(cert.name) + '</a>' : '<span class="cv-cert-name">' + esc(cert.name) + '</span>'
        parts.push(name + '<span class="cv-cert-meta">• ' + esc(cert.issuer) + (cert.date ? ' (' + esc(cert.date) + ')' : '') + '</span>')
        parts.push('</div>')
      }
      parts.push('</section>')
    }

    if (model.expertise.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Core expertise</h2>')
      parts.push('<div class="cv-chips">')
      for (const area of model.expertise) parts.push('<span class="cv-chip">' + esc(area) + '</span>')
      parts.push('</div>')
      parts.push('</section>')
    }

    if (model.technologies.length > 0) {
      parts.push('<section>')
      parts.push('<h2>Primary technologies</h2>')
      parts.push('<div class="cv-chips">')
      for (const t of model.technologies) parts.push('<span class="cv-chip">' + esc(t) + '</span>')
      parts.push('</div>')
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
<title>${esc(model.identity.name)}</title>
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