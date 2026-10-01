import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import yaml from 'js-yaml'
import { parseApplication, type Application } from '@provena/core'

const FILENAME = 'applications.yaml'

export class YamlApplicationStore {
  async load(path: string): Promise<Application[]> {
    const content = await readFile(join(path, FILENAME), 'utf-8').then(
      (data) => yaml.load(data) as unknown,
      () => null,
    )
    if (!content) return []
    if (!Array.isArray(content)) throw new Error(`${FILENAME} must be a YAML array`)
    return content.map((item, i) => {
      try {
        return parseApplication(item)
      } catch (e) {
        throw new Error(`${FILENAME}[${i}]: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  async save(path: string, applications: readonly Application[]): Promise<void> {
    await writeFile(join(path, FILENAME), yaml.dump(applications.map((a) => ({ ...a }))), 'utf-8')
  }
}
