export type SchemaVersion = number

export const LATEST_VERSION: SchemaVersion = 1

export interface Migration {
  readonly from: SchemaVersion
  readonly to: SchemaVersion
  readonly migrate: (data: Record<string, unknown>) => Record<string, unknown>
}

export function applyMigrations(
  current: SchemaVersion,
  data: Record<string, unknown>,
  migrations: Migration[],
): { data: Record<string, unknown>; migrated: boolean; version: SchemaVersion } {
  let version = typeof current === 'number' && !Number.isNaN(current) ? current : 1
  let result = data
  let migrated = false

  for (const m of migrations) {
    if (m.from === version) {
      result = m.migrate(result)
      version = m.to
      migrated = true
    }
  }

  return { data: result, migrated, version }
}
