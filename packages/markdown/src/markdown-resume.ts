import type { Renderer, ResumeModel } from '@provena/core'

function fmtDate(d: string): string {
  const [y, m] = d.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return m ? `${months[parseInt(m) - 1] ?? ''} ${y}` : y ?? d
}

function fmtRange(start: string, end?: string): string {
  const e = end ?? 'Present'
  return `${fmtDate(start)} — ${fmtDate(e)}`
}

export class MarkdownResumeRenderer implements Renderer<ResumeModel> {
  render(model: ResumeModel): string {
    const lines: string[] = []

    lines.push(`# ${model.name}`, '')

    if (model.summary) {
      lines.push('## About', '', model.summary, '')
    }

    if (model.experiences.length > 0) {
      lines.push('## Experience', '')
      for (const exp of model.experiences) {
        lines.push(`### ${exp.organization}`)
        lines.push(`**${exp.title}** | ${fmtRange(exp.start, exp.end)}`, '')
        if (exp.summary) lines.push(exp.summary, '')
        for (const a of exp.achievements) lines.push(`- ${a}`)
        if (exp.technologies.length > 0) lines.push('', `*${exp.technologies.join(', ')}*`)
        lines.push('')
      }
    }

    if (model.projects.length > 0) {
      lines.push('## Projects', '')
      for (const proj of model.projects) {
        const title = proj.url ? `[${proj.name}](${proj.url})` : proj.name
        lines.push(`### ${title}`)
        if (proj.role) lines.push(`*${proj.role}*`, '')
        lines.push(proj.description, '')
        if (proj.technologies.length > 0) lines.push(`*${proj.technologies.join(', ')}*`, '')
      }
    }

    if (model.education.length > 0) {
      lines.push('## Education', '')
      for (const edu of model.education) {
        const field = edu.field ? ` in ${edu.field}` : ''
        lines.push(`### ${edu.degree}${field}`)
        lines.push(`${edu.institution} | ${fmtRange(edu.start ?? '', edu.end)}`, '')
      }
    }

    if (model.publications.length > 0) {
      lines.push('## Publications', '')
      for (const pub of model.publications) {
        const authors = pub.authors.join(', ')
        const title = pub.url ? `[${pub.title}](${pub.url})` : pub.title
        lines.push(`- ${authors}. ${title}.`)
        if (pub.venue) lines[lines.length - 1] += ` ${pub.venue}.`
        if (pub.date) lines[lines.length - 1] += ` ${pub.date}.`
        lines.push('')
      }
    }

    if (model.certifications.length > 0) {
      lines.push('## Certifications', '')
      for (const cert of model.certifications) {
        const name = cert.url ? `[${cert.name}](${cert.url})` : cert.name
        lines.push(`- ${name} — ${cert.issuer}`)
        if (cert.date) lines[lines.length - 1] += ` (${cert.date})`
        lines.push('')
      }
    }

    if (model.capabilities.length > 0) {
      lines.push('## Skills', '')
      for (const cap of model.capabilities) {
        const evidence = cap.evidenceCount > 0 ? ` (${cap.evidenceCount} pieces of evidence)` : ''
        lines.push(`- **${cap.name}**${evidence}`)
        if (cap.description) lines.push(`  ${cap.description}`)
      }
      lines.push('')
    }

    return lines.join('\n')
  }
}
