# Prepare CV — design

**Date:** 2026-07-31
**Status:** Approved design
**Version:** 0.5.0

## Objective

Turn Provena from an assessment tool into an action tool: prepare a
targeted CV inside the web app, starting from the canonical `Profile`
and the same domain capabilities the Career Compass uses.

The core loop closes: **Profile → Decision Context → CV Projection →
Renderer**, with the web acting as the orchestrator and the browser as
pure UI.

## Current state

The web (`@provena/web`) is a self-contained Worker that embeds
`timeline.ts` — a reduced model (hitos as counters, capabilities as
names, no achievement texts, no projects/education). The CLI has the full
pipeline (`Profile → Projector → Model → Renderer`) for
markdown/jsonresume/html/linkedin/recruiter.

Two representations of the same reality exist (timeline + profile), and
the web has no way to render a real CV.

## Design

### The pipeline

```
Profile
   │
   ├── profileToTimeline()     → Home (Identity Timeline)
   ├── computeCareerCompass()  → Career Compass (assessment)
   ├── cvProjector()           → Prepare CV (projection)
   └── recruiterProjector()    → Recruiter Brief
```

All projections sit at the same level. None depends on another. They
share **primitives**, not results:

```
Profile
   │
────────┼────────
   │
deriveStrengths()
deriveEvidenceCount()
findEvidenceGaps()
```

`Profile` is immutable. No projection mutates it; each is a pure
`Profile → TModel` function. This is the canonical-projection contract
(I1–I6) already established in v0.3, now extended to the web.

### `@provena/core` additions

New module `core/src/career.ts` — shared primitives over `Profile`:

```ts
deriveStrengths(profile): Strength[]        // capability frequency
deriveEvidenceCount(profile): number        // total achievements
findEvidenceGaps(profile): Gap[]            // milestones per organization
profileToTimeline(profile): CareerTimeline  // hitos = achievements.length
```

`deriveEvidenceCount` returns a quantity, not the evidence itself — the
name makes the numeric result explicit.

New module `core/src/cv-projector.ts`:

```ts
// Shared intent: the goal the user is acting toward. Feeds both the
// Compass and the CV projector. Ephemeral by design.
export interface DecisionContext {
  targetRole?: string
  audience?: 'recruiter' | 'hiring-manager'
  emphasize?: readonly string[] // user override → front
  omit?: readonly string[]      // user override → presentation only
}

export interface CVContext extends DecisionContext {
  includeExperienceIds?: readonly string[] // selection: whitelist
  excludeExperienceIds?: readonly string[] // selection: blacklist
  generateSummary?: boolean                // opt-in to regenerate explicit summary
}

export interface ProjectionMetadata {
  generatedSummary: boolean
  selectedExperienceIds: string[]
  excludedExperienceIds: string[]
  emphasizedCapabilities: string[]
}

export interface CVProjection {
  model: ResumeModel
  metadata: ProjectionMetadata
}

export function cvProjector(profile: Profile, context?: CVContext): CVProjection
```

### Selection vs presentation

The projector separates **which experiences are in the CV** from **how
they are presented**:

```
Profile
   ↓
Experience selection    (include/exclude ids — explicit, never a side effect of omit)
   ↓
Capability emphasis     (emphasize/omit — presentation only)
   ↓
Summary generation      (Explicit → Auto → none)
   ↓
ResumeModel + ProjectionMetadata
```

**Experience selection** is a high-level decision with its own rule. It
is driven by `includeExperienceIds` (whitelist) and
`excludeExperienceIds` (blacklist). A technology list can never remove an
experience — otherwise four years of career could disappear because the
relevant technologies did not line up.

**Capability emphasis** is presentation: `emphasize` moves named
technologies to the front of `capabilities` and per-experience tech
lists; `omit` filters them out. Experiences always remain.

**Summary generation** follows strict priority:

1. Explicit `person.summary` wins, unless `generateSummary: true`.
2. If no explicit summary and `targetRole` present → auto-generate from
   `deriveStrengths` (sets `generatedSummary: true`).
3. If no `targetRole` → no summary (matches current behavior).

`audience` changes only the level of detail: `'recruiter'` omits the
projects section, `'hiring-manager'` includes it. Default (no `audience`)
includes projects, matching current behavior.

### Architectural rule

`cv-projector.ts` imports only `career.ts` primitives and types. It
never calls `computeCareerCompass`. The Compass and the CV projector
reach their own conclusions from the same `Profile` — if the Compass's
weighting changes, the CV does not change unless the primitive changes.
Both share facts, never opinions.

### Web integration

`@provena/web` gains dependencies on `@provena/core`,
`@provena/markdown`, `@provena/html`. Renderers import independently;
core stays presentation-agnostic.

- New `provena-web/src/profile.ts` embeds the full `Profile` (from
  `profiles/valentin`), replacing `timeline.ts`.
- `computeCareerCompass` is refactored to consume `Profile` directly via
  the `career.ts` primitives. `timeline.ts` disappears as a model; the
  Home renders `profileToTimeline(profile)`.
- Compass tests migrate to `Profile` fixtures. Home render stays
  byte-identical (covered by test).

New route `/cv` — "Prepare CV":

- **GET `/cv`** — page: `targetRole` input (datalist: Senior, Staff,
  Principal Software Engineer), `audience` selector, auto-summary toggle,
  experience checkboxes (selection), technology chips (emphasis, from
  Compass suggestions, pre-checked but editable), preview panel, export
  buttons.
- **POST `/api/cv/preview`** — body is the full `CVContext` JSON. The
  Worker runs `cvProjector(profile, context)` and returns `CVProjection`.
  A single object body keeps the API stable as `CVContext` grows
  (`summaryMode`, `template`, `language`, ...).
- **Export** — markdown via `MarkdownResumeRenderer`; PDF via
  `window.print()` on the HTML render (print CSS already in
  `HtmlResumeRenderer`). No new library.

Compass suggestions render as **suggested** emphasis, not applied: the
user decides. `ProjectionMetadata` feeds the transparency line ("Included
5 of 8 experiences. Summary generated automatically. 3 capabilities
emphasized.") without contaminating `ResumeModel`.

## Tests

`core/src/cv-projector.test.ts`:

- snapshot identical to `resumeProjector` with no context;
- `excludeExperienceIds` removes and reports in metadata;
- `includeExperienceIds` limits to the whitelist;
- `omit` filters a technology but keeps the experience;
- `emphasize` reorders;
- summary priority: explicit wins, auto under `targetRole`, none without
  context;
- I2 (profile unchanged after projection);
- **phase-order**: excluding an experience then applying `emphasize`
  never emphasizes a technology of an excluded experience (locks the
  Selection → Presentation → Summary pipeline).

`core/src/career.test.ts`:

- `profileToTimeline` maps achievements → hitos, capabilityIds → names;
- `deriveStrengths` / `deriveEvidenceCount` / `findEvidenceGaps` match
  the values currently produced by the Compass.

Web:

- compass tests migrate to `Profile` fixtures;
- Home render stays byte-identical via `profileToTimeline`.

## Scope

### In scope

- `career.ts` primitives + `cvProjector` + `CVContext` +
  `ProjectionMetadata` in core.
- `Profile` embed in web, `timeline.ts` removed, Compass refactored.
- `/cv` page + `/api/cv/preview` POST + markdown/print-PDF export.
- Compass-suggested emphasis chips (editable).
- Tests as listed.

### Out of scope (deferred)

- **Role-derived experience selection** — `targetRole → deriveEmphasis`
  automatic selection. The MVP keeps selection explicit
  (`include/excludeExperienceIds`); automatic derivation arrives when
  real profiles show stable patterns.
- **`summaryMode: 'concise' | 'technical' | 'leadership'`** — noted for
  API longevity; `generateSummary: boolean` suffices today.
- **Career Fit / constraints gating** — separate subdomain, own data,
  own experiment.
- **CLI `provena cv --role`** — the same `CVContext` can power it later;
  out of scope now.
- **Persistence of preferences** (`Career Preferences`) — the runtime
  context is ephemeral by design; persistence only after a repeated
  pattern is observed.

## Architectural invariants

| Id | Invariant |
|----|-----------|
| I1 | `Profile` is authoritative. |
| I2 | Projectors never mutate `Profile`. |
| I3 | Renderers never mutate representations. |
| I4 | Representations are deterministic. |
| I7 | Selection is explicit or derived from the target role, never a side effect of presentation. |
| I8 | Compass and CV projector share primitives, never results. |
