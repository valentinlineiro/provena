import { YamlWorkspaceLoader } from '@provena/yaml'
import { toResumeProjection } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'

const loader = new YamlWorkspaceLoader()
const profile = await loader.load('examples/valen')
const projection = toResumeProjection(profile)
const renderer = new MarkdownResumeRenderer()
console.log(renderer.render(projection))
