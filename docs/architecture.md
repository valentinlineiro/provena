# Architecture Specification

Provena is a continuous market observation platform built on top of a canonical professional identity model and deterministic decision engine.

---

## High-Level Architecture

```text
                  Professional Identity
                           │
                           ▼
                Canonical Identity Model
                           │
         ┌─────────────────┴─────────────────┐
         ▼                                   ▼
 Continuous Market Observation        Identity Projections
         │                                   │
         ▼                                   ├── Resume (.md / .html)
 Deterministic Assessment                    ├── LinkedIn (.markdown)
         │                                   └── Recruiter Brief
         ▼
   Attention Inbox (Product)
```

---

## Subsystem Pipeline & Data Flow

```text
   Sources (Greenhouse, Ashby, Lever)
                  │
                  ▼  (Continuous Sync via Cloudflare Worker Cron)
       Market Catalog (PostgreSQL / KV Fallback)
                  │
                  ▼
   Decision Engine (Protocol v1 Evaluation)
                  │
                  ▼
       Deterministic Assessment (Fit + Coverage + Confidence)
                  │
                  ▼
    Attention Inbox (/opportunities Semantic Tabs & Keyset Pagination)
                  │
                  ▼
       Helping to look less (Preserved Human Attention)
```

### 1. Identity Domain (`packages/core`, `packages/yaml`, `packages/linkedin-import`)
The single canonical source of truth about a professional's experience, capabilities, achievements, and evidence. Defined as plain, referentially sound YAML workspaces (`Profile`, `Person`, `Experience`, `Capability`, `Evidence`). The identity layer has zero runtime dependency on market boards or database connections.

### 2. Continuous Market Observation (`packages/core/opportunity-source`, `packages/market-postgres`, `packages/provena-web`)
Autonomous observation adapters poll public ATS job boards (Greenhouse, Ashby, Lever). Postings are deduplicated using cryptographic keys (`makePostingDedupeKey`) and stored as raw canonical market facts in PostgreSQL/KV.

### 3. Decision Engine & Deterministic Assessment (`Protocol v1`, `evaluateOpportunity`)
Evaluates market postings deterministically against the candidate's canonical identity. Evaluates:
- **Professional Fit**: Capability match and evidence coverage.
- **Personal Fit**: Preference alignment (location, role level, work style).
- **Recognition Coverage**: Vocabulary sufficiency.
Produces auditable verdicts (`APPLY`, `CONSIDER`, `SKIP`) without LLM hallucinations.

### 4. Attention Inbox (`/opportunities` & `/sources`)
Presents context-filtered opportunities sorted by semantic attention tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`). Uses Base64URL cursor pagination to allow smooth, stateless exploration of market opportunities.

### 5. Identity Projection System (`packages/markdown`, `packages/html`, `packages/jsonresume`)
For local or presentation workflows, pure projection functions (`Profile → Projection → Renderer`) derive external document views (Resume Markdown, HTML, JSON Resume, LinkedIn) without mutating the underlying identity model.

---

## Monorepo Package Map

```text
packages/
  core/             Domain models, Profile aggregate, Protocol v1 decision evaluator, ATS sources
  yaml/             YamlWorkspaceLoader & Writer (Workspace Persistence)
  linkedin-import/  LinkedIn archive zip importer into Profile domain
  market-postgres/  PostgreSQL Repositories for Shared Market Memory (O2)
  provena-web/      Web Application & Cloudflare Worker (App Shell, Sources, Attention Inbox, Cron Sync)
  markdown/         MarkdownResumeRenderer (Presentation)
  html/             HtmlResumeRenderer (Presentation)
  jsonresume/       JSON Resume projector + renderer
  cli/              Provena Command Line Interface (Workspace validation & local projection helper)
```

---

## Architectural Invariants

| Id | Invariant | Description |
|---|---|---|
| **I1** | **Identity is Canonical** | Identity owns meaning; all projections and evaluations derive from it. |
| **I2** | **Market Observations are Immutable** | Observed job postings are stored as unmutated canonical market facts. |
| **I3** | **Evaluations are Deterministic** | Assessments are auditable, falsifiable, and repeatable without LLM state. |
| **I4** | **Sources Never Mutate Identity** | Connecting or syncing job boards strictly feeds the Market Catalog; Inbox never creates market facts. |
| **I5** | **Attention is Derived** | Semantic tabs (`Needs Attention`, `Worth Considering`) are derived from policy scores. |
| **I6** | **Decisions are Auditable** | User decisions (`interested`, `dismissed`, `applied`) persist immutably alongside evaluations. |
| **I7** | **Identity and Market are Decoupled** | The identity aggregate has zero runtime dependency on market boards or database connections. |

---

## Governance & Versioning Hierarchy

- **Monorepo Package Version (`v0.7.1`)**: Release version of software packages, web app, CLI, and database schemas.
- **Decision Protocol Version (`Protocol v1`)**: Canonical evaluation invariants and contract.
- **Operational Knowledge Version (`0`)**: Promoted production operational knowledge version.
- **ADR Governance**: Refer to [ADR-001](architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md) and [Architecture Freeze Record](architecture/freeze-v0.7.0.md).
