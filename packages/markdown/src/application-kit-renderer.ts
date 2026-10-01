import type { Renderer, ApplicationKitModel } from '@provena/core'

function field(lines: string[], label: string, value: string): void {
  lines.push(`## ${label}`, '', value ? '```\n' + value + '\n```' : '—', '')
}

export class ApplicationKitRenderer implements Renderer<ApplicationKitModel> {
  render(model: ApplicationKitModel): string {
    const lines: string[] = ['# Application Kit', '']
    field(lines, 'Full name', model.fullName)
    field(lines, 'Email', model.email)
    field(lines, 'Phone', model.phone)
    field(lines, 'Location', model.location)
    field(lines, 'LinkedIn', model.linkedinUrl)
    field(lines, 'GitHub', model.githubUrl)
    for (const [key, url] of Object.entries(model.otherUrls)) {
      field(lines, key, url)
    }
    field(lines, 'Current title', model.currentTitle)
    field(lines, 'Summary (short, ≤280)', model.shortSummary)
    field(lines, 'Summary (long)', model.longSummary)
    field(lines, 'Technologies', model.technologiesLine)
    field(lines, 'Experience', model.experienceLines.join('\n'))
    field(lines, 'Total years', String(model.totalYearsExperience))
    field(lines, 'Languages', model.languagesLine)
    field(lines, 'Work authorization', model.workAuthorizationLine)
    field(lines, 'Salary expectation', model.salaryLine)
    field(lines, 'Notice period', model.noticePeriod)
    field(lines, 'Remote preference', model.remotePreference)
    return lines.join('\n')
  }
}
