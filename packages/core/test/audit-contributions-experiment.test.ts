import { describe, it } from 'vitest'
import { YamlWorkspaceLoader } from '@provena/yaml'
import { cvProjector, type CVContext } from '../src/cv-projector.js'
import { join } from 'node:path'
import { writeFileSync } from 'node:fs'

describe('R4/R6 Contribution Projection Audit Experiment', () => {
  it('runs audit across 4 decision contexts and generates audit report', async () => {
    const loader = new YamlWorkspaceLoader()
    const valentinPath = join(__dirname, '../../../profiles/valentin')
    const { profile } = await loader.load(valentinPath)

    const contexts: { label: string; id: string; context: CVContext }[] = [
      {
        label: 'Context A (Staff Software Engineer)',
        id: 'staff-engineer',
        context: {
          targetRole: 'Staff Software Engineer',
          emphasize: ['architecture', 'developer productivity', 'AI', 'leadership', 'systems'],
        },
      },
      {
        label: 'Context B (Senior Backend Engineer)',
        id: 'senior-backend',
        context: {
          targetRole: 'Senior Software Engineer',
          emphasize: ['Java', 'Spring', 'distributed systems', 'microservices', 'Kafka', 'backend'],
        },
      },
      {
        label: 'Context C (AI-Assisted Engineering / Productivity)',
        id: 'ai-productivity',
        context: {
          targetRole: 'Lead Productivity Engineer',
          emphasize: ['AI-assisted engineering', 'developer productivity', 'team velocity', 'tooling'],
        },
      },
      {
        label: 'Context D (Software Quality / Research)',
        id: 'quality-research',
        context: {
          targetRole: 'Software Quality Researcher',
          emphasize: ['formal methods', 'mutation testing', 'verification', 'testing', 'research'],
        },
      },
    ]

    const reportLines: string[] = [
      '# Empirical Audit Report: Contribution Projections across Decision Contexts',
      '',
      `Date: ${new Date().toISOString().split('T')[0]}`,
      'Profile: `profiles/valentin`',
      '',
      '## Overview of Evaluated Decision Contexts',
      '',
    ]

    for (const { label, context } of contexts) {
      reportLines.push(`- **${label}**: Emphasize \`[${context.emphasize?.join(', ')}]\``)
    }

    reportLines.push('', '---', '')

    for (const { label, context } of contexts) {
      const projection = cvProjector(profile, context)
      reportLines.push(`### ${label}`, '')
      reportLines.push(`Headline: *"${projection.headline}"*`, '')
      reportLines.push(`**Experiences projected:**`, '')

      for (const exp of projection.experiences) {
        reportLines.push(`- **${exp.organization}** (${exp.title}) — *Contribution Level: ${exp.contribution}*`)
        for (const bullet of exp.achievements) {
          reportLines.push(`  - ${bullet}`)
        }
      }

      reportLines.push('', '**Projects projected / omitted:**', '')
      for (const proj of projection.projects) {
        reportLines.push(`- [Included] **${proj.name}** — *Contribution: ${proj.contribution}*`)
      }
      for (const om of projection.projectionMetadata.omittedProjects) {
        reportLines.push(`- [Omitted] **${om.name}** — *Contribution: ${om.contribution}*`)
      }

      reportLines.push('', '---', '')
    }

    // Contribution Breakdown per Context
    reportLines.push('## Matrix: Contribution Relevance & Selection per Context', '')
    reportLines.push('| Contribution ID | Scope | Context A (Staff) | Context B (Backend) | Context C (AI/Prod) | Context D (Research) |')
    reportLines.push('| --- | --- | --- | --- | --- | --- |')

    for (const contrib of profile.contributions) {
      const row: string[] = [contrib.id, `${contrib.scope?.level ?? 'N/A'} (${contrib.scope?.role ?? ''})`]

      for (const { context } of contexts) {
        const proj = cvProjector(profile, context)
        const summaExp = proj.experiences.find((e) => e.organization === 'Summa Networks')
        const isSelected = summaExp?.achievements.some((a) => a.includes(contrib.summary.trim().slice(0, 25)))
        row.push(isSelected ? '✅ Selected' : '❌ Omitted')
      }

      reportLines.push(`| ${row.join(' | ')} |`)
    }

    reportLines.push('', '---', '')
    reportLines.push('## Diagnostic Observations & Trace Analysis', '')

    const outputPath = join(__dirname, '../../../docs/research/2026-08-03-contribution-projection-audit.md')
    writeFileSync(outputPath, reportLines.join('\n'), 'utf-8')
    console.log(`Audit report generated at ${outputPath}`)
  })
})
