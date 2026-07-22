import type { Renderer, ResumeProjection } from '@provena/core'

function fmtDate(d: string): string {
  const [y, m] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m ? `${months[parseInt(m) - 1] ?? ''} ${y}` : y ?? d
}

function fmtRange(start: string, end?: string): string {
  const e = end ?? 'Present'
  return `${fmtDate(start)} — ${fmtDate(e)}`
}

export class MarkdownResumeRenderer implements Renderer<ResumeProjection> {
  render(projection: ResumeProjection): string {
    const lines: string[] = []

    lines.push(`# ${projection.name}`, '')

    if (projection.summary) {
      lines.push('## About', '', projection.summary, '')
    }

    if (projection.experiences.length > 0) {
      lines.push('## Experience', '')
      for (const exp of projection.experiences) {
        lines.push(`### ${exp.organization}`)
        lines.push(`**${exp.title}** | ${fmtRange(exp.start, exp.end)}`, '')
        if (exp.summary) lines.push(exp.summary, '')
        for (const a of exp.achievements) lines.push(`- ${a}`)
        if (exp.technologies.length > 0) lines.push('', `*${exp.technologies.join(', ')}*`)
        lines.push('')
      }
    }

    if (projection.projects.length > 0) {
      lines.push('## Projects', '')
      for (const proj of projection.projects) {
        const title = proj.url ? `[${proj.name}](${proj.url})` : proj.name
        lines.push(`### ${title}`)
        if (proj.role) lines.push(`*${proj.role}*`, '')
        lines.push(proj.description, '')
        if (proj.technologies.length > 0) lines.push(`*${proj.technologies.join(', ')}*`, '')
      }
    }

    if (projection.education.length > 0) {
      lines.push('## Education', '')
      for (const edu of projection.education) {
        const field = edu.field ? ` in ${edu.field}` : ''
        lines.push(`### ${edu.degree}${field}`)
        lines.push(`${edu.institution} | ${fmtRange(edu.start ?? '', edu.end)}`, '')
      }
    }

    if (projection.publications.length > 0) {
      lines.push('## Publications', '')
      for (const pub of projection.publications) {
        const authors = pub.authors.join(', ')
        const title = pub.url ? `[${pub.title}](${pub.url})` : pub.title
        lines.push(`- ${authors}. ${title}.`)
        if (pub.venue) lines[lines.length - 1] += ` ${pub.venue}.`
        if (pub.date) lines[lines.length - 1] += ` ${pub.date}.`
        lines.push('')
      }
    }

    if (projection.certifications.length > 0) {
      lines.push('## Certifications', '')
      for (const cert of projection.certifications) {
        const name = cert.url ? `[${cert.name}](${cert.url})` : cert.name
        lines.push(`- ${name} — ${cert.issuer}`)
        if (cert.date) lines[lines.length - 1] += ` (${cert.date})`
        lines.push('')
      }
    }

    if (projection.capabilities.length > 0) {
      lines.push('## Skills', '')
      for (const cap of projection.capabilities) {
        const evidence = cap.evidenceCount > 0 ? ` (${cap.evidenceCount} pieces of evidence)` : ''
        lines.push(`- **${cap.name}**${evidence}`)
        if (cap.description) lines.push(`  ${cap.description}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}
