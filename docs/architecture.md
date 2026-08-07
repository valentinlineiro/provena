# Architecture

Provena follows a multi-tier pipeline that separates canonical identity, decision evaluation, shared market observation, and attention presentation along clear boundaries.

---

## The System Pipeline

```text
Identity
   │
   ▼
Decision Protocol (Protocol v1)
   │
   ▼
Shared Market Architecture (O2)
   │
   ▼
Attention Inbox
```

### 1. Identity Layer
The single canonical source of professional truth. Loading raw data from storage (YAML workspaces, JSON, imports) into the immutable `Profile` aggregate root. It has zero knowledge of projections, rendering formats, or external market boards.

### 2. Decision Layer (Protocol v1)
Evaluates candidate identity against decision contexts or job opportunities. Pure, deterministic evaluation (`evaluateOpportunity(jd, profile)`) producing traceable `OpportunityEvaluation` verdicts (APPLY / CONSIDER / SKIP) without LLM hallucinations.

### 3. Shared Market Architecture (O2)
Autonomous, continuous market observation layer. Ingests public market posting boards (e.g. Greenhouse), deduplicates postings via `makePostingDedupeKey`, and maintains global market posting records in Neon PostgreSQL synchronized via Cloudflare Workers & Cron triggers.

### 4. Attention Layer
Presents context-filtered, high-relevance opportunities to the user. Evaluates professional fit, personal preference alignment, and candidate coverage to eliminate market noise and minimize time spent searching.

---

## Three System Loops

Provena coordinates three distinct feedback loops across identity and market:

1. **Observation Loop (O2 — Stable)**:
   Autonomous ingestion → Deduplication → Shared Market Memory → Continuous sync.
2. **Knowledge Acquisition Loop (K12 — Experimental)**:
   Market requirement cluster mining → `MarketPatternDefinitions` → GTM splits & pattern recognition audit.
3. **Attention Reduction Loop (Planned)**:
   Evaluation feedback → Preference refinement → Measurable reduction of job-seeking search friction.

---

## Package Layout & Core Contract

```text
packages/
  core/             Domain models, Profile aggregate, Protocol v1 decision evaluator, interfaces
  yaml/             YamlWorkspaceLoader & Writer (Persistence)
  markdown/         MarkdownResumeRenderer (Presentation)
  html/             HtmlResumeRenderer (Presentation)
  cli/              Provena Command Line Interface
  linkedin-import/  LinkedIn archive zip loader into Profile domain
  market-postgres/  PostgreSQL Repositories for Shared Market Memory (O2)
  provena-web/      Web application & Cloudflare Worker (App Shell, Compass, Inbox, Cron Sync)
```

### Core Contract Invariants

- **Core Ownership**: Domain model, referential validation, projection interfaces, Protocol v1 evaluation engine, workspace loader interface.
- **Core Exclusions**: Core never owns database connection pools, file system I/O, CLI argument parsing, HTTP frameworks, or AI models.
- **I8 — Independent Primitives**: Projectors consume shared domain primitives (`career.ts`), never each other's outputs.
- **I9 — Pure Renderer**: Presentation renderers receive pre-editorialised projections and perform zero selection, ranking, or filtering logic.

---

## Relationship to a Compiler Pipeline

```text
Compiler Phase      Provena Component
──────────────      ─────────────────
Source Code    ──►  Workspace (YAML files)
AST            ──►  Profile aggregate
IR             ──►  CvProjection / OpportunityEvaluation
Backend / Code ──►  Markdown / HTML Renderers / Attention Inbox UI
```

---

## Governance & Versioning Hierarchy

Refer to [ADR-001](file:///home/valentin/code/provena/docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md) and [freeze-v0.7.0.md](file:///home/valentin/code/provena/docs/architecture/freeze-v0.7.0.md) for official component classification:

- **Monorepo Package Version (`v0.7.0`)**: Release version of software packages, web app, CLI, and database schemas.
- **Decision Protocol Version (`Protocol v1`)**: Canonical evaluation invariants and contract.
- **Operational Knowledge Version (`0`)**: Promoted production operational knowledge version.
