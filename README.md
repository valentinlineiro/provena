# Provena

Professional identity as a canonical domain model.

Maintain your career data once. Generate any representation from a single source of truth.

```
YAML workspace → Profile → ResumeProjection → Markdown
                         → LinkedInProjection → (future)
```

## Quick start

```bash
npm install
npx tsx packages/demo/src/load-and-render.ts
```

Outputs a complete Markdown resume from the example profile at `examples/valen/`.

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
| `@provena/core` | Domain model, validation, projections, renderer interface |
| `@provena/yaml` | Workspace loader for YAML profiles |
| `@provena/markdown` | Markdown resume renderer |

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
- **Renderers never modify identity.** They only transform.
