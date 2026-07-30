import type { Renderer, RecruiterBriefModel } from '@provena/core'

export class RecruiterBriefRenderer implements Renderer<RecruiterBriefModel> {
  render(model: RecruiterBriefModel): string {
    const lines: string[] = []

    lines.push(`# ${model.name}`, '')

    if (model.title) lines.push(`**${model.title}**`, '')
    if (model.location) lines.push(`${model.location}`, '')
    lines.push('')

    if (model.summary) {
      lines.push('## About', '', model.summary, '')
    }

    if (model.interests && model.interests.length > 0) {
      lines.push('## Focus areas', '', ...model.interests.map((i) => `- ${i}`), '')
    }

    if (model.topTechnologies.length > 0) {
      lines.push('## Core technologies', '', model.topTechnologies.join(', '), '')
    }

    if (model.roles && model.roles.length > 0) {
      lines.push('## Looking for', '', ...model.roles.map((r) => `- ${r}`), '')
      if (model.remote) {
        lines.push('', `Remote: **${model.remote}**`, '')
      }
      if (model.compensation?.minimum) {
        lines.push(`Min. compensation: ${model.compensation.currency ?? '€'}${model.compensation.minimum}`, '')
      }
    }

    if (model.avoid && model.avoid.length > 0) {
      lines.push('## Not looking for', '', ...model.avoid.map((a) => `- ${a}`))
      lines.push('')
    }

    if (model.experiences.length > 0) {
      lines.push('## Recent experience', '')
      for (const exp of model.experiences) {
        lines.push(`### ${exp.organization}`)
        lines.push(`**${exp.title}**`, '')
        if (exp.technologies.length > 0) {
          lines.push(`*${exp.technologies.join(', ')}*`, '')
        }
      }
    }

    return lines.join('\n')
  }
}
