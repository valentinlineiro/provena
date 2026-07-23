import { YamlWorkspaceLoader } from '@provena/yaml'
import { resumeProjector } from '@provena/core'
import { MarkdownResumeRenderer } from '@provena/markdown'

const loader = new YamlWorkspaceLoader()
const profile = await loader.load('examples/valen')
const model = resumeProjector.project(profile)
const renderer = new MarkdownResumeRenderer()
console.log(renderer.render(model))
