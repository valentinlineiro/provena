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
- **Domain** (`packages/core`) — the canonical model: entity types in `types.ts` (Person, Experience, Project, Education, Publication, Certification, Recommendation, Capability, Evidence), `Identity` (aggregate root referencing entities by id) and `Profile` (`profile.ts`, holds the entity arrays `Identity` points into). Pure types, zero I/O, zero dependencies. This is the only layer that is never a plugin.
- **Projection** (`projections.ts`) — pure functions `Profile → Projection` (e.g. `toResumeProjection`, `toLinkedInProjection`) that select, filter, and reshape the canonical model for one consumer. Entity references are ids; projections resolve them via the `resolve()` helper.
- **Presentation** — a `Renderer<TProjection>` (interface in `renderer.ts`) is a pure function `Projection → string`, with no access to `Profile`. `@provena/markdown`'s `MarkdownResumeRenderer` is the only implementation.

Everything outside `@provena/core` is a plugin: it implements a core interface (`WorkspaceLoader` or `Renderer<T>`), has no access to domain internals beyond the public API, and should add zero cost when not installed.

### Extension points (see CONTRIBUTING.md)

- New aggregate type → touches the canonical model in `packages/core`, needs core review.
- New output format → implement `Renderer<T>` for an existing projection, as a new package.
- New platform (LinkedIn, JSON Resume) → new projection function + new renderer.
- New data source (SQLite, Notion, ...) → implement `WorkspaceLoader`, as a new package.

Guiding question for any change: does this strengthen the canonical model or expand the plugin ecosystem? If neither, it probably doesn't belong.

### Cross-references and validation

Entities reference each other by id (e.g. `Experience.capabilityIds`, `Capability.evidenceIds`), never by embedding. `validate.ts` checks referential integrity (duplicate ids, dangling references) over a full data bundle. `YamlWorkspaceLoader` runs it automatically after loading and throws on any violation.

## Package layout

```
packages/
  core/       domain types, Profile, projections, validation, Renderer/WorkspaceLoader interfaces
  yaml/       YamlWorkspaceLoader — reads a workspace dir (provena.yaml manifest + person/experience/projects/... .yaml), validates shape against schema.ts before returning a Profile
  markdown/   MarkdownResumeRenderer
  html/       HtmlResumeRenderer
  jsonresume/ JSON Resume projector + renderer
  cli/        provena CLI (render, validate, init) with workspace templates in templates/
examples/valen/   sample workspace consumed by `npm run demo` and the CLI
website/          VitePress docs site (separate npm project, own package.json)
```

Each package is `"type": "module"` with `main`/`exports` pointing straight at `src/*.ts` (no build step — consumed via `tsx`/ts-node style resolution, not compiled `dist`).

## Stability

`@provena/core` follows semver for its schema: major = breaking change to the domain model, minor = new optional field or aggregate type, patch = docs/validation only. Plugins (`yaml`, `markdown`, future packages) can evolve independently of core's version.
