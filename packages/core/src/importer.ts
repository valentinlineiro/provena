import type { Profile } from './profile.js'

export interface Importer<TContext = void> {
  /** Read external data from `location` and return a partial Profile.
   *
   * Must be deterministic: same input → same canonical data
   * (except for generated UUIDs and importedAt timestamps).
   *
   * May throw for: invalid archive, malformed source data,
   * unsupported export version. */
  read(location: string, ctx?: TContext): Promise<Partial<Profile>>
}
