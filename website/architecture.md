# Architecture

Provena follows a four-layer architecture with clear boundaries between knowledge, transformation, and presentation.

## Package layout

```
packages/
  core/       Domain types, Profile, projections, interfaces
  yaml/       YAML workspace loader
  markdown/   Markdown renderer
```

## Key interfaces

```typescript
interface WorkspaceLoader {
  load(path: string): Promise<Profile>
}

interface Renderer<TProjection> {
  render(projection: TProjection): string
}
```

## Plugin philosophy

Everything except the domain model is a plugin. A plugin implements an interface defined in core and has no access to the domain model beyond the public API.

## Extending

- **New output format** → implement `Renderer<TProjection>`
- **New platform** (LinkedIn, JSON Resume) → projection + renderer
- **New data source** → implement `WorkspaceLoader`
- **New aggregate type** → core review

## Core documents

| Document | Purpose |
|----------|---------|
| [`docs/architecture.md`](https://github.com/valentinlineiro/provena/blob/main/docs/architecture.md) | Detailed architectural breakdown, compiler analogy, plugin philosophy |
| [`docs/philosophy.md`](https://github.com/valentinlineiro/provena/blob/main/docs/philosophy.md) | Why Provena exists and what it stands for |
| [`docs/stability.md`](https://github.com/valentinlineiro/provena/blob/main/docs/stability.md) | What is stable, what can change, and the versioning contract |
| [`CONTRIBUTING.md`](https://github.com/valentinlineiro/provena/blob/main/CONTRIBUTING.md) | How to extend without breaking the architecture |
