# Architecture

Provena follows a four-layer architecture that separates concerns along clear boundaries.

## Layers

```
Persistence
     ↓
   Domain
     ↓
 Projection
     ↓
Presentation
```

### Persistence

Loading and storing the canonical identity.

Responsible for reading raw data from a source (filesystem, git, API) and producing a `Profile`. The domain model has no knowledge of how data is stored. Multiple loaders can coexist: YAML, JSON, SQLite, Notion — all produce the same `Profile` type.

Interface: `WorkspaceLoader`

### Domain

The canonical model of professional identity. Pure types with no I/O, no dependencies, no plugins. Contains:

- Entity types (Person, Experience, Project, Education, Publication, Certification, Recommendation, Capability, Evidence)
- Aggregate root (Identity, Profile)
- Cross-reference validation

The domain is the only layer that is never a plugin. Everything else can be replaced.

### Projection

A projection transforms a `Profile` into a context-optimized representation. Each projection selects, filters, and reshapes the canonical model for a specific purpose:

- A resume projection includes all experiences with full achievements.
- A LinkedIn projection includes the most recent 4 experiences and top 10 capabilities.
- A staff-engineer projection would highlight architectural leadership.

Projections are pure functions: `Profile → Projection`. The same Profile can produce many projections without modifying the original.

### Presentation

Renderers consume a projection and produce output. They have no access to `Profile`, no knowledge of the domain model, and no I/O. A renderer is a pure function: `Projection → string`.

The renderer interface is generic over projection types, allowing any renderer to work with any compatible projection.

```
Renderer<ResumeProjection> → Markdown
Renderer<ResumeProjection> → HTML
Renderer<ResumeProjection> → PDF
Renderer<LinkedInProjection> → LinkedIn-compatible text
```

## Relationship to a Compiler

The architecture mirrors a compiler pipeline:

| Compiler | Provena |
|----------|---------|
| Source code | Workspace (YAML files) |
| AST | Profile |
| IR | Projection |
| Code generation | Renderer |

This is not a forced analogy but a useful lens for decisions: when in doubt about where a responsibility belongs, ask whether it fits the domain model (AST), the transformation (IR), or the output generation (backend).

## Package Layout

```
packages/
  core/       Domain types, Profile, projections, validators, interfaces
  yaml/       YamlWorkspaceLoader (Persistence)
  markdown/   MarkdownResumeRenderer (Presentation)
  linkedin/   (future) LinkedIn renderer
  html/       (future) HTML renderer
  cli/        (future) CLI
```

## Core Contract

Core has no dependencies, no I/O, no plugins. It is the only package that is part of the platform rather than a plugin.

Core owns: domain model, validation, projection types, selector functions, renderer interface, workspace loader interface.

Core never owns: YAML parsing, file system access, CLI arguments, HTTP requests, template engines, AI integration.

## Plugin Philosophy

Everything except the domain model is a plugin. A plugin:

- Implements an interface defined in core
- Has no access to the domain model's internals beyond the public API
- Can be developed, tested, and published independently
- Adds zero cost when not installed

This keeps the core stable while allowing the ecosystem to grow without architectural drift.
