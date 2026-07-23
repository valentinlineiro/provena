# Provena

A canonical domain model for professional identity.

Your professional information is scattered. Your résumé. Your LinkedIn. Your
website. Each copy diverges. Provena stores your professional identity once
and derives everything else.

> Authority flows inward. Formatting flows outward.
> The canonical model owns meaning. Outputs only express it.

## Quick start

```bash
git clone https://github.com/valenlb/provena.git
cd provena
npm install
```

Create a minimal workspace:

```bash
mkdir my-profile

cat > my-profile/person.yaml << 'EOF'
name: "Your Name"
email: "you@example.com"
title: "Software Engineer"
summary: "A short professional summary."
urls:
  github: "https://github.com/you"
EOF

cat > my-profile/provena.yaml << 'EOF'
version: "1.0"
EOF
```

Render it:

```bash
provena render my-profile
cat my-profile/resume.md

provena render my-profile --format jsonresume
cat my-profile/resume.json
```

Validate it:

```bash
provena validate my-profile
```

Total time: under five minutes.

## Golden Path

A clean checkout SHALL satisfy this sequence without any manual intervention:

```bash
git clone https://github.com/valenlb/provena.git
cd provena
npm install
provena render examples/valen
provena render examples/valen --format jsonresume
provena validate examples/valen
```

Each command SHALL return the correct exit code and produce the expected
artifact with no prior editing.

## How it works

```
Workspace (YAML files)
        │
        ▼
   Profile  (canonical model)
        │
        ├─── Projector<ResumeModel> ────► MarkdownRenderer ───► resume.md
        │
        └─── Projector<JsonResumeModel> ──► JsonResumeRenderer ──► resume.json
```

Four layers: **Persistence** loads a workspace into a **Profile** (the
canonical domain model). A **Projector** transforms the Profile into a
representation (ResumeModel, JsonResumeModel). A **Renderer** serializes that
representation into an artifact (Markdown, JSON).

Each layer is a pure function with no access to layers above it. Plugins
implement core interfaces and add zero cost when not installed.

## Packages

| Package | Role | API Status |
|---------|------|------------|
| `@provena/core` | Canonical domain model, validation, contracts | Stable |
| `@provena/yaml` | YAML workspace loader | Stable |
| `@provena/markdown` | Markdown renderer | Stable |
| `@provena/jsonresume` | JSON Resume projector + renderer | Stable |
| `@provena/cli` | CLI (`provena render`, `provena validate`) | Stable |

## Public API

Stable exports from `@provena/core`:

| Export | Kind | Role |
|--------|------|------|
| `Identity` | type | Domain aggregate — references entities by ID |
| `Profile` | type | Canonical model — holds all entity arrays |
| `Projector<TModel>` | interface | Contract: `Profile → TModel` |
| `Renderer<TModel>` | interface | Contract: `TModel → string` |
| `WorkspaceLoader` | interface | Contract: `path → Promise<Profile>` |
| `validate()` | function | Check referential integrity |
| `resumeProjector` | object | `Projector<ResumeModel>` |
| `ResumeModel` | type | Resume representation |

## Workspace structure

```
my-profile/
  provena.yaml       # manifest (version: "1.0")
  person.yaml           # Person (name, email, title, summary, urls)
  experience.yaml       # Experience[]
  projects.yaml         # Project[]
  capabilities.yaml     # Capability[]
  education.yaml        # Education[]
  publications.yaml     # Publication[]
  certifications.yaml   # Certification[]
  recommendations.yaml  # Recommendation[]
  evidence.yaml         # Evidence[]
```

All entity references are by ID (e.g. `Experience.capabilityIds`). The
validator checks for dangling references and duplicate IDs at load time.

## Status

- ✅ Canonical domain model
- ✅ YAML workspace loader with validation
- ✅ Markdown renderer
- ✅ JSON Resume renderer
- ✅ CLI (`render`, `validate`, `--format`, `--stdout`, `--help`)
- ✅ Tests for architectural invariants (I1-I5)
- 🚧 I6 — multiple renderers for one representation (needs a second `Renderer<ResumeModel>`)

## Philosophy

> Facts over formatting. Evidence over claims.
> The domain model is canonical. Everything else is replaceable.
