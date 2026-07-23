# Architecture

Provena separates the canonical domain model from data sources, projectors, and renderers.

```
Workspace (YAML files)
        │
        ▼
   Profile  (canonical model)
        │
        ├─── Projector<ResumeModel> ────► MarkdownRenderer ───► resume.md
        │
        └─── Projector<JsonResumeModel> ──► JsonResumeRenderer ──► resume.json
```

Each layer is a pure function. No layer has access to layers above it.

## Identity Model

The identity model is the source of truth. It represents stable professional
facts — experience, capabilities, achievements, education, evidence. It does
not contain presentation decisions: no formatting, no character limits, no
platform conventions. Those belong to projectors and renderers.

## Package layout

```
packages/
  core/        Domain types, Profile, Projector<T> / Renderer<T> interfaces, validation
  yaml/        YAML workspace loader (implements WorkspaceLoader)
  markdown/    Markdown renderer (implements Renderer<ResumeModel>)
  jsonresume/  JSON Resume projector + renderer (implements Projector<JsonResumeModel> + Renderer<JsonResumeModel>)
  cli/         CLI (render, validate, --format, --stdout, --help)
```

Core owns the domain model and the *contracts* a projector or renderer must
satisfy — `Projector<TModel>`, `Renderer<TModel>`, `WorkspaceLoader`. It
also ships the first-party projectors (`resumeProjector`) as a convenience.

## Key interfaces

```typescript
interface Projector<TModel> {
  project(profile: Profile): TModel
}

interface Renderer<TModel> {
  render(model: TModel): string
}

interface WorkspaceLoader {
  load(path: string): Promise<Profile>
}
```

```
Profile → Projector<TModel> → TModel → Renderer<TModel> → string
```

The projector does the semantic work — deciding what belongs in this context
and what doesn't. The renderer only represents what the projector already
decided; it has no domain knowledge and cannot select or omit facts on its own.

> **Authority flows inward. Formatting flows outward.**
>
> The canonical model owns meaning. Outputs only express it.

## Architectural invariants

| Id | Invariant | Status |
|----|-----------|--------|
| I1 | Identity is authoritative. | ✅ Tested |
| I2 | Projectors never mutate Identity. | ✅ Tested |
| I3 | Renderers never mutate representations. | ✅ Tested |
| I4 | Representations are deterministic. | ✅ Tested |
| I5 | Different representations preserve the same meaning. | ✅ Tested |
| I6 | One representation may have multiple artifacts. | 🚧 Deferred |

## Plugin philosophy

The domain model is the stable core. Everything else is replaceable. A plugin
implements an interface defined in core and has no access to the domain model
beyond the public API.

## Extending

- **New output format** → implement `Renderer<TModel>` for an existing model
- **New platform** (LinkedIn, ...) → `Projector<TModel>` + `Renderer<TModel>`
- **New data source** → implement `WorkspaceLoader`
- **New aggregate type** → core review

## Core documents

| Document | Purpose |
|----------|---------|
| [`docs/architecture.md`](https://github.com/valentinlineiro/provena/blob/main/docs/architecture.md) | Detailed architectural breakdown, plugin philosophy |
| [`docs/philosophy.md`](https://github.com/valentinlineiro/provena/blob/main/docs/philosophy.md) | Why Provena exists and what it stands for |
| [`docs/stability.md`](https://github.com/valentinlineiro/provena/blob/main/docs/stability.md) | What is stable, what can change, and the versioning contract |
| [`CONTRIBUTING.md`](https://github.com/valentinlineiro/provena/blob/main/CONTRIBUTING.md) | How to extend without breaking the architecture |
