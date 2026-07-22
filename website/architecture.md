# Architecture

Provena follows a four-layer architecture with clear boundaries between knowledge, transformation, and presentation.

## Core documents

These files live in the repository and define the project's design:

| Document | Purpose |
|----------|---------|
| [`docs/architecture.md`](https://github.com/valentinlineiro/provena/blob/main/docs/architecture.md) | Detailed architectural breakdown, compiler analogy, plugin philosophy |
| [`docs/philosophy.md`](https://github.com/valentinlineiro/provena/blob/main/docs/philosophy.md) | Why Provena exists and what it stands for |
| [`docs/stability.md`](https://github.com/valentinlineiro/provena/blob/main/docs/stability.md) | What is stable, what can change, and the versioning contract |
| [`CONTRIBUTING.md`](https://github.com/valentinlineiro/provena/blob/main/CONTRIBUTING.md) | How to extend Provena without breaking the architecture |

## Package layout

```
packages/
  core/       Domain types, Profile, projections, validators, interfaces
  yaml/       YamlWorkspaceLoader (Persistence)
  markdown/   MarkdownResumeRenderer (Presentation)
```

## Plugin philosophy

Everything except the domain model is a plugin. A plugin:

- Implements an interface defined in core
- Has no access to the domain model beyond the public API
- Can be developed, tested, and published independently
- Adds zero cost when not installed

## Extending

- **New output format** → implement `Renderer<TProjection>` for an existing projection
- **New platform** (LinkedIn, JSON Resume) → write a projection + renderer
- **New data source** (SQLite, Notion) → implement `WorkspaceLoader`
- **New aggregate type** → core review (touches the canonical model)
