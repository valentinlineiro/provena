import type { Renderer } from '@provena/core'
import type { JsonResumeModel } from './json-resume-projector.js'

export const jsonResumeRenderer: Renderer<JsonResumeModel> = {
  render(model: JsonResumeModel): string {
    return JSON.stringify(model, null, 2)
  },
}
