# Provena

Maintain your professional identity once. Generate multiple representations from a canonical model.

```
examples/valen/    →  YamlWorkspaceLoader  →  Profile  →  ResumeProjection  →  MarkdownResumeRenderer  →  README.md
                           ↓
                      LinkedInProjection  →  (future renderer)
```

## Quick start

```bash
npm install
npx tsx packages/demo/src/load-and-render.ts
```

## Architecture

`docs/architecture.md` — four layers: Persistence, Domain, Projection, Presentation.

## Packages

| Package | Role |
|---------|------|
| `@provena/core` | Domain model, validation, projections, renderer interface |
| `@provena/yaml` | Workspace loader for YAML profiles |
| `@provena/markdown` | Markdown resume renderer |

## Project structure

A Provena workspace is a directory with one file per aggregate:

```
my-profile/
  provenav2.yaml       # manifest
  person.yaml           # Person
  experience.yaml       # Experience[]
  projects.yaml         # Project[]
  education.yaml        # Education[]
  publications.yaml     # Publication[]
  certifications.yaml   # Certification[]
  recommendations.yaml  # Recommendation[]
  capabilities.yaml     # Capability[]
  evidence.yaml         # Evidence[]
```

## Philosophy

- **Identity is knowledge.** Documents are projections.
- **Facts over formatting.** Canonical data contains no presentation concerns.
- **Evidence over claims.** Capabilities reference evidence.
- **Renderers never modify identity.** They only transform.
