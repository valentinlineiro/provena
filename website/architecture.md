# Architecture

Provena separates the canonical domain model from data sources, projections, and renderers.

```
                 Identity Model
                      │
                      ▼
              Projection Engine
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
    Resume        LinkedIn       AI Agent
    Renderer      Renderer        Query
```

The implementation below follows this model directly.

## Package layout

```
packages/
  core/       Domain types, Profile, projection contracts, interfaces
  yaml/       YAML workspace loader
  markdown/   Markdown renderer
```

Core owns the domain model and the *contracts* a projection or renderer must satisfy — `Renderer<TProjection>`, `WorkspaceLoader`. It also ships the first-party projections (`toResumeProjection`, `toLinkedInProjection`) as a convenience, but a projection is not required to live in core: any package can write a `Profile → Projection` function against the public API.

## Key interfaces

```typescript
interface WorkspaceLoader {
  load(path: string): Promise<Profile>
}

interface Renderer<TProjection> {
  render(projection: TProjection): string
}
```

```
Identity → Projection → Renderer → Output
```

The projection does the semantic work — deciding what belongs in this context and what doesn't. The renderer only represents what the projection already decided; it has no domain knowledge and cannot select or omit facts on its own.

## Design invariants

- The identity model is never optimized for a specific output.
- Projections are derived, never authoritative — they can be recomputed from the identity at any time.
- Renderers have no domain knowledge.
- New formats do not require changes to core.

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
