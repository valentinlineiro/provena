import type { Profile } from './profile.js'

export interface WorkspaceLoader {
  load(path: string): Promise<Profile>
}
