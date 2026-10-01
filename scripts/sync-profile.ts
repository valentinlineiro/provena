// Regenerates packages/provena-web/src/profile.ts from the canonical
// profiles/valentin workspace. The Worker embeds the profile (no filesystem
// access at runtime), so this must run whenever the workspace changes.
// Run: npm run profile:sync
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { YamlWorkspaceLoader } from '../packages/yaml/src/yaml-workspace-loader.ts'

const workspace = fileURLToPath(new URL('../profiles/valentin', import.meta.url))
const target = fileURLToPath(new URL('../packages/provena-web/src/profile.ts', import.meta.url))

async function main() {
  const { profile } = await new YamlWorkspaceLoader().load(workspace)
  const updatedAt = new Date().toISOString().slice(0, 10)

  const body =
    '// Generated from profiles/valentin by `npm run profile:sync` — do not edit by hand.\n' +
    "import type { Profile } from '@provena/core'\n" +
    `export const updatedAt = '${updatedAt}'\n` +
    'export default ' + JSON.stringify(profile, null, 2) + ' satisfies Profile\n'

  await writeFile(target, body)
  console.log(`profile.ts synced from ${workspace} (updatedAt ${updatedAt})`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
