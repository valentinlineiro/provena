# LinkedIn Import Design

Import LinkedIn data export into a Provena workspace.

## Philosophy

- The workspace is the source of truth. Import enriches, never replaces.
- LinkedIn is an external representation of professional identity, not part of the canonical domain model.
- Imports are additive, deterministic, conservative, and idempotent.
- Importer is lossy by design. Editorial knowledge (achievements, evidence links, capabilityIds, ordering) stays editorial.

## Package structure

```
@provena/core   ← Importer interface, provenance types
    ↑
@provena/yaml   ← YamlWorkspaceWriter, migration runner
    ↑
@provena/linkedin-import   (new, separate from output-only @provena/linkedin)
    ↑
@provena/cli    ← `provena import linkedin` command
```

Dependencies flow one direction. LinkedIn never knows about YAML. YAML never knows about LinkedIn. They communicate only through Profile.

## Importer interface (`@provena/core`)

```ts
export interface Importer<TContext = void> {
  read(location: string, ctx?: TContext): Promise<Partial<Profile>>
}
```

- `location` is a file path (ZIP for LinkedIn)
- `TContext` is a generic for source-specific options (void for v1)
- Returns Partial<Profile> because import cannot produce: editorial links, ordering, IDs from another workspace, manually curated evidence, provenance annotations, future extensions

### Importer invariants

An importer must be deterministic. Given the same input, it must produce the same canonical data (except for generated IDs and importedAt timestamps). No external API calls, geocoding, data completion, or other non-deterministic transformations.

### Exceptions

`read()` may throw for:
- Invalid or unreadable archive (not a ZIP, corrupt)
- Malformed source data (bad CSV, unexpected schema)
- Unsupported export version

Implementors should document source-specific errors beyond these.

## Provenance metadata

Every imported entity carries source metadata:

```ts
interface Provenance {
  source: "linkedin" | "manual"
  importedAt?: string   // ISO timestamp, set when source != "manual"
}
```

Each imported entity receives a stable import fingerprint derived from its source data (e.g., SHA256 of normalized CSV row). During re-import, entities are matched by fingerprint first: if the same fingerprint exists in the workspace, it's the same entity. If no fingerprint match (manual entities, legacy workspaces), heuristic matching is used.

Added to entity types via an optional `provenance` field.

## LinkedIn parser (`@provena/linkedin-import`)

- Reads LinkedIn export ZIP in memory (no temp files)
- Only ZIP accepted for v1 (no directory input)
- Required: Profile.csv
- Optional (missing = skip gracefully): Positions.csv, Education.csv, Skills.csv, Projects.csv, Certifications.csv, Publications.csv, Recommendations_Received.csv
- IDs generated via `crypto.randomUUID()` (Node built-in)

### Field mapping

| LinkedIn | Provena | Notes |
|----------|---------|-------|
| Profile.csv → name, email, title, summary | Person | |
| Positions.csv → organization, title, start, end, description | Experience | description → summary; no achievements/technologies (LinkedIn doesn't export these per-position) |
| Education.csv → institution, degree, field, start, end | Education | |
| Skills.csv → name | Capability | name only, evidenceIds = [], no evidence links |
| Projects.csv → name, description, url | Project | |
| Certifications.csv → name, issuer, date, url | Certification | |
| Publications.csv → title, authors, date, url, doi | Publication | |
| Recommendations_Received.csv → author, relationship, text | Recommendation | |

No capabilityIds or evidenceIds are populated. Those relationships belong to Provena's canonical model, not LinkedIn.

## Merge/no-clobber logic (`@provena/yaml`)

### Flow

```
LinkedIn ZIP → LinkedInImporter.read() → Partial<Profile>
                                              ↓
                    YamlWorkspaceLoader.load() → existing Profile (migrated in memory)
                                              ↓
                    Merge(imported, existing) → Profile
                                              ↓
                    YamlWorkspaceWriter.write() → YAML files
```

### Merge rules

Matching is encapsulated per entity type:

```ts
interface Matcher<T> {
  match(imported: T, existing: T[]): T | undefined
}
```

A `Matcher` implements the two-stage strategy: fingerprint first, heuristic fallback. Each entity type gets its own `Matcher` instance with type-specific keys.

For each entity type: match by heuristic key. Match found → skip (existing wins). No match → append imported entity.

**Matching keys:**
- Experience: `organization + title + startDate` (normalized: trimmed, Unicode-normalized, case-insensitive, collapsed whitespace)
- Education: `institution + degree + start`
- Project: `name`
- Publication: `title`
- Certification: `name + issuer`
- Recommendation: `author + SHA256(normalizedText)`
- Capability: `normalizedName`

**Two-stage matching:**
1. If provenance says entity came from LinkedIn, compare against import fingerprint.
2. Otherwise fall back to heuristic matching.

**Person:** never overwrite if person.yaml exists.

**Identity ID reference arrays:** new entities appended to reference list. Existing references unchanged.

### Fresh import

`provena import linkedin export.zip --fresh <workspace>` — requires empty or nonexistent workspace. Creates workspace from scratch with imported data. No --force flag that silently overwrites edits.

## Migration runner (`@provena/yaml`)

### Version type

```ts
type SchemaVersion = number
```

Migrations are an ordered array:

```ts
type Migration = {
  from: SchemaVersion
  to: SchemaVersion
  migrate: (data: Partial<Profile>) => Partial<Profile>
}

const migrations: Migration[] = [
  // migration1to2, migration2to3, ...
]
```

### Flow

```
provena.yaml → read version (= 1)
                    ↓
      any migrations from 1 → current?
                    ↓ yes
      run chain sequentially in memory
                    ↓
      return upgraded profile + flag
```

### Key decisions

- `load()` migrates in memory, never writes. Returns upgraded profile + migration-needed flag.
- CLI layer decides when to persist (after render, validate, or import).
- Registry starts empty. `provena.yaml` defaults to `version: 1` on init.
- Transactional: read everything → migrate in memory → validate → write every file → atomically if possible. No half-upgraded workspaces.
- Migration runs on `Partial<Profile>` to handle incomplete data during import flows.

## CLI command (`@provena/cli`)

```bash
provena import linkedin <export.zip> [--workspace <path>] [--fresh] [--help]
```

| Flag | Description |
|------|-------------|
| `--workspace <path>` | Target workspace path (default: `.`) |
| `--fresh` | Create new workspace (requires empty/nonexistent path) |

### Behavior

1. Read ZIP → `Partial<Profile>` with provenance
2. If workspace missing/empty → create workspace, write all entities
3. If workspace exists → load + migrate existing, merge, write merged result
4. Success message lists written files

### Error handling

- Not a ZIP → error, exit 1
- Missing required CSV (Profile.csv) → error with details
- Optional CSV missing → skipped, noted in output
- Workspace path invalid → error + usage
- Validation failure before write → nothing written, error reported

### Transactional guarantee

```
ZIP → Parse → Map → Merge → Validate → Write
```

No write happens until validation succeeds.

---

## Design decisions summary

| Decision | Choice |
|----------|--------|
| Import interface location | `@provena/core` |
| Method name | `read()` (avoids JS reserved word `import`) |
| Return type | `Partial<Profile>` |
| Provenance | `{ source, importedAt }` on every entity |
| LinkedIn package | `@provena/linkedin-import` (separate from output) |
| Input format | ZIP only (v1) |
| Entity matching | Heuristic keys + provenance fingerprint |
| Person merge | Never overwrite |
| Experience key | `organization + title + startDate` |
| Education key | `institution + degree + start` |
| Recommendation key | `author + SHA256(normalizedText)` |
| Migration version | `number` (not SemVer) |
| Migration trigger | Automatic on load, write deferred to CLI |
| Fresh import | `--fresh` flag, requires empty workspace |
