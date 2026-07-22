# Provena

A canonical domain model for professional identity.

Most professionals maintain multiple versions of the same information — LinkedIn, résumés, personal websites, conference bios. Provena replaces duplication with a single canonical model.

```
YAML Workspace
      │
      ▼
    Profile
      │
      ├── ResumeProjection ─────► Markdown
      └── LinkedInProjection ───► (future)
```

## Quick start

Generate a Markdown résumé from the example workspace:

```bash
npm install
npx tsx packages/demo/src/load-and-render.ts
```

↓

```
# Valentín Liñeiro Barea

## About

Engineer focused on distributed systems, developer tooling, and knowledge representation.

## Experience

### Acme Corp
**Senior Software Engineer** | Mar 2022 — Present
...
```

## How it works

```
Workspace (Persistence)
        │
        ▼
   Profile (Domain)
        │
        ▼
 Projection
        │
        ▼
  Renderer
```

Four layers: **Persistence**, **Domain**, **Projection**, **Presentation**. See `docs/architecture.md`.

## Packages

| Package | Role |
|---------|------|
| `@provena/core` | Canonical domain model, validation, and projections |
| `@provena/yaml` | YAML workspace loader |
| `@provena/markdown` | Markdown renderer |

Additional renderers and workspace loaders can be implemented as independent plugins.

## Project structure

A workspace is a directory with one YAML file per aggregate:

```
my-profile/
  provena.yaml       # manifest
  person.yaml           # Person
  experience.yaml       # Experience[]
  projects.yaml         # Project[]
  capabilities.yaml     # Capability[]
  education.yaml        # Education[]
  publications.yaml     # Publication[]
  certifications.yaml   # Certification[]
  recommendations.yaml  # Recommendation[]
  evidence.yaml         # Evidence[]
```

## Status

Provena is in active development.

- ✅ Canonical domain model
- ✅ YAML workspace loader
- ✅ Markdown renderer
- 🚧 LinkedIn renderer
- 🚧 JSON Resume renderer

## Philosophy

> Identity is knowledge. Documents are projections.
>
> Facts over formatting. Evidence over claims.
>
> The domain model is canonical. Everything else is replaceable.
