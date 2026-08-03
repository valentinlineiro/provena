import { describe, it, expect } from 'vitest'
import { YamlWorkspaceLoader } from '@provena/yaml'
import { cvProjector as projectCV } from '../src/cv-projector.js'
import { join } from 'node:path'

describe('Valentin Profile End-to-End Contributions', () => {
  it('loads real workspace and projects contributions for Summa Networks', async () => {
    const loader = new YamlWorkspaceLoader()
    const valentinPath = join(__dirname, '../../../profiles/valentin')
    const { profile } = await loader.load(valentinPath)

    expect(profile.contributions.length).toBeGreaterThan(0)
    const cv = projectCV(profile)
    const summa = cv.experiences.find(e => e.organization === 'Summa Networks')
    expect(summa).toBeDefined()
    expect(summa?.achievements.some(a => a.includes('Clean Architecture'))).toBe(true)
  })
})
