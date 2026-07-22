# How it works

Provena separates professional identity management into four layers:

```
Persistence
     ↓
   Domain
     ↓
 Projection
     ↓
Presentation
```

## Persistence

Loading and storing the canonical identity. YAML is the default format, but any source can be adapted — JSON, SQLite, Notion, git.

**Interface:** `WorkspaceLoader`

## Domain

The canonical model of professional identity. Pure types with no I/O, no dependencies, no plugins. Contains entities like Person, Experience, Project, Capability, and Evidence.

The domain is the only layer that is never a plugin. Everything else can be replaced.

## Projection

A projection transforms the canonical profile into a context-optimized representation. Each projection selects, filters, and reshapes for a specific purpose:

- **Resume** — full experiences, all achievements, evidence-backed skills.
- **LinkedIn** — recent 4 experiences, top 10 capabilities, featured projects.
- **Future** — staff engineer, research, conference bio.

**Selectors** are pure functions: `Profile → Projection`

## Presentation

Renderers consume a projection and produce output. They have no access to the domain model. A renderer is a pure function: `Projection → string`

**Interface:** `Renderer<TProjection>`

## Pipeline

```
YAML files → Profile → ResumeProjection → Markdown
                      → LinkedInProjection → (future)
```
