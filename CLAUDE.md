# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Provena is a canonical domain model for professional identity: a single `Profile` derived from a YAML workspace, projected into purpose-specific shapes (resume, LinkedIn, ...), and rendered to output formats (Markdown, ...). See README.md for the pitch and `docs/architecture.md` / `docs/philosophy.md` / `docs/stability.md` for the full rationale — read those before making architectural changes.

## Commands

```bash
npm install            # instalar (npm workspaces, packages/*)
npm run typecheck      # tsc --noEmit en todos los paquetes
npm test               # node --import tsx --test packages/*/src/*.test.ts
npm run demo           # carga examples/valen y renderiza a stdout
```

typecheck + test son los dos pasos de verificación. No hay linter configurado todavía.

## Architecture

Four-layer pipeline, each layer only knows about the one below it:

```
Persistence (WorkspaceLoader) → Domain (Profile) → Projection (pure fn) → Presentation (Renderer)
```

- **Persistence** — reads a workspace (dir of YAML files) into a `Profile`. Implements `WorkspaceLoader` from core. `@provena/yaml`'s `YamlWorkspaceLoader` is the only implementation.
- **Domain** (`packages/core`) — the canonical model: entity types in `types.ts` (Person, Experience, Project, Education, Publication, Certification, Recommendation, Capability, Evidence), `Identity` (aggregate root referencing entities by id) and `Profile` (`profile.ts`, holds the entity arrays `Identity` points into). Also defines the `Projector<T>`, `Renderer<T>`, and `WorkspaceLoader` interfaces, plus the resume projection (`resumeProjector`) as the one built-in example. Pure types, zero I/O, zero dependencies. This is the only layer that is never a plugin.
- **Projection** — a `Projector<TModel>` (`project(profile: Profile): TModel`) that selects, filters, and reshapes the canonical model for one consumer. Each new platform gets its own `Projector` implementation in its own package (`@provena/jsonresume`'s `jsonResumeProjector`, `@provena/linkedin`'s `linkedInProjector`); only the resume projection lives in core.
- **Presentation** — a `Renderer<TModel>` (interface in `renderer.ts`) is a pure function `TModel → string`, with no access to `Profile`. `@provena/markdown`'s `MarkdownResumeRenderer`, `@provena/html`'s `HtmlResumeRenderer`, `@provena/jsonresume`'s `jsonResumeRenderer`, and `@provena/linkedin`'s `linkedInRenderer` each implement it.

Everything outside `@provena/core` is a plugin: it implements a core interface (`WorkspaceLoader`, `Projector<T>`, or `Renderer<T>`), has no access to domain internals beyond the public API, and should add zero cost when not installed.

### Extension points (see CONTRIBUTING.md)

- New aggregate type → touches the canonical model in `packages/core`, needs core review.
- New output format → implement `Renderer<T>` for an existing projection, as a new package.
- New platform (e.g. LinkedIn, JSON Resume) → new package with its own `Projector<T>` + `Renderer<T>`.
- New data source (SQLite, Notion, ...) → implement `WorkspaceLoader`, as a new package.

Guiding question for any change: does this strengthen the canonical model or expand the plugin ecosystem? If neither, it probably doesn't belong.

### Cross-references and validation

Entities reference each other by id (e.g. `Experience.capabilityIds`, `Capability.evidenceIds`), never by embedding. `validate.ts` checks referential integrity (duplicate ids, dangling references) over a full data bundle. `YamlWorkspaceLoader` runs it automatically after loading and throws on any violation.

## Package layout

```
packages/
  core/       domain types, Profile, resumeProjector, validation, Projector/Renderer/WorkspaceLoader interfaces
  yaml/       YamlWorkspaceLoader — reads a workspace dir (provena.yaml manifest + person/experience/projects/... .yaml), validates shape against schema.ts before returning a Profile
  markdown/   MarkdownResumeRenderer
  html/       HtmlResumeRenderer
  jsonresume/ JSON Resume projector + renderer
  linkedin/   LinkedIn projector + renderer (headline/about/experience text sized to platform limits)
  cli/        provena CLI (render, validate, init) with workspace templates in templates/
examples/valen/   sample workspace consumed by `npm run demo` and the CLI
website/          VitePress docs site (separate npm project, own package.json)
```

Each package is `"type": "module"` with `main`/`exports` pointing straight at `src/*.ts` (no build step — consumed via `tsx`/ts-node style resolution, not compiled `dist`).

## Stability

`@provena/core` follows semver for its schema: major = breaking change to the domain model, minor = new optional field or aggregate type, patch = docs/validation only. Plugins (`yaml`, `markdown`, future packages) can evolve independently of core's version.
