# Provena

A canonical domain model for professional identity.

Most professionals maintain multiple versions of the same information — LinkedIn, résumés, personal websites, conference bios. They are not different identities. They are different projections of the same one, and treating them as separate documents is why they drift.

> Authority flows inward. Formatting flows outward.
> The canonical model owns meaning. Outputs only express it.

```
YAML Workspace
      │
      ▼
    Profile
      │
      ├── ResumeProjection ─────► Markdown
      └── LinkedInProjection ───► (future)
```

Read the thesis: [Problem](https://valentinlineiro.github.io/provena/problem) · [Concept](https://valentinlineiro.github.io/provena/concept) · [Examples](https://valentinlineiro.github.io/provena/examples) · [Architecture](https://valentinlineiro.github.io/provena/architecture)

## Quick start

Generate a Markdown résumé from the example workspace:

```bash
npm install
npm run provena -- render examples/valen
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
| `@provena/cli` | `provena render <workspace>` |

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
- ✅ YAML workspace loader — rejects invalid workspaces at load time
- ✅ Markdown renderer
- ✅ CLI (`provena render`)
- ✅ Tests for domain invariants (referential integrity, projection purity)
- 🚧 LinkedIn renderer
- 🚧 JSON Resume renderer

## Philosophy

> Identity is knowledge. Documents are projections.
>
> Facts over formatting. Evidence over claims.
>
> The domain model is canonical. Everything else is replaceable.
