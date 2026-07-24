import type { Renderer } from '@provena/core'
import type { LinkedInModel } from './linkedin-projector.js'

const HEADLINE_LIMIT = 220
const ABOUT_LIMIT = 2600
const EXPERIENCE_DESCRIPTION_LIMIT = 2000

function truncate(text: string, limit: number): string {
  return text.length > limit ? text.slice(0, limit - 1) + '…' : text
}

function fmtRange(start: string, end?: string): string {
  return `${start} – ${end ?? 'Present'}`
}

export const linkedInRenderer: Renderer<LinkedInModel> = {
  render(model: LinkedInModel): string {
    const lines: string[] = []

    lines.push('## Headline', truncate(model.headline, HEADLINE_LIMIT))

    if (model.about) {
      lines.push('## About', truncate(model.about, ABOUT_LIMIT))
    }

    if (model.experiences.length > 0) {
      lines.push('## Experience')
      for (const exp of model.experiences) {
        lines.push(`### ${exp.title}, ${exp.organization}`)
        lines.push(fmtRange(exp.start, exp.end))
        if (exp.description) lines.push(truncate(exp.description, EXPERIENCE_DESCRIPTION_LIMIT))
        if (exp.technologies.length > 0) lines.push(exp.technologies.join(', '))
      }
    }

    if (model.featuredProjects.length > 0) {
      lines.push('## Featured')
      for (const proj of model.featuredProjects) {
        const name = proj.url ? `${proj.name} (${proj.url})` : proj.name
        lines.push(`### ${name}`, proj.description)
      }
    }

    if (model.topCapabilities.length > 0) {
      lines.push('## Skills')
      lines.push(model.topCapabilities.map((c) => c.name).join(', '))
    }

    return lines.join('\n\n') + '\n'
  },
}
