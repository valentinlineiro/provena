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

A complete Markdown resume from the example profile at `examples/valen/`.

## How it works

```
Workspace (YAML files)
     ↓
   Profile — canonical domain model
     ↓
 Projection — context-optimized view
     ↓
 Renderer — pure output generation
```

Four layers: **Persistence**, **Domain**, **Projection**, **Presentation**. See `docs/architecture.md`.

## Packages

| Package | Role |
|---------|------|
| `@provena/core` | Canonical domain model, validation, and projections |
| `@provena/yaml` | YAML workspace loader |
| `@provena/markdown` | Markdown renderer |

## Project structure

A workspace is a directory with one YAML file per aggregate:

```
my-profile/
  provenav2.yaml       # manifest
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

## Philosophy

- **Identity is knowledge.** Documents are projections.
- **Facts over formatting.** Canonical data contains no presentation concerns.
- **Evidence over claims.** Capabilities reference evidence.
- **Renderers never modify the domain model. They only render projections.**
