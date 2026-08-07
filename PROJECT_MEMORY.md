# Project Memory — Provena

This document records the architectural decisions, design shifts, and foundational principles that define Provena. It explains how the project evolved from a personal profile compiler into a continuous market observer and attention filtering system.

---

## 1. Core Thesis

> **Professional identity is an immutable history of evidence. Communication is a projection optimized for a decision.**

Traditional CVs force candidates to manually rebuild their story for every channel and opportunity. Provena decouples identity from presentation:
- **Identity**: Plain, referentially validated data structure stored in version-controlled workspaces.
- **Decision Context**: The specific choice a reader must make (e.g. recruiter screening, staff engineer evaluation, job opportunity fit).
- **Projection**: Pure, deterministic transformation of identity filtered and formatted for that decision context.

---

## 2. Key Evolutionary Milestones

### Milestone 1 — The Canonical Identity Model & Compiler Pipeline
- Established a four-layer architecture (`Persistence → Domain → Projection → Presentation`).
- Introducedreferentially verified YAML workspaces (`person`, `experiences`, `capabilities`, `contributions`, `evidence`).
- Proved identity immutability: projection functions never mutate the aggregate profile (`Profile → TModel`).

### Milestone 2 — Decision-Aware Projections & Protocol v1
- Shifted focus from format templates to decision surfaces.
- Implemented `evaluateOpportunity(jd, profile)` delivering deterministic APPLY / CONSIDER / SKIP verdicts based on candidate preferences and capability signals.
- Established Invariants **I-OE-1** (no recognition ≠ no evidence), **I-OE-2** (every claim traces to canonical capability evidence), and **I-OE-3** (absent criteria yield unknown, never violated).

### Milestone 3 — Shared Market Architecture (O2)
- Recognized that identity evaluation requires an active, continuous understanding of the market.
- Built **O2**: Shared Market Architecture featuring automated job board ingestion (Greenhouse), posting deduplication keys, Neon PostgreSQL persistence, and autonomous Cloudflare Worker Cron synchronization.

### Milestone 4 — Attention Filtering & Inbox
- Shifted the user experience from manual job searching to an **Attention Inbox**.
- Built deterministic ranking policies (`DefaultOpportunityRankingPolicy`) that order market opportunities into actionable tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`).

---

## 3. Current Architecture & Research Governance (v0.7.0)

As established in [ADR-001](docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md):

- **Software Monorepo (`v0.7.0`)**: Production-ready core engine, CLI, PostgreSQL market storage, Cloudflare Workers API, and web application.
- **Decision Protocol (`Protocol v1`)**: Stable evaluation protocol.
- **Operational Knowledge Version (`0`)**: Production operational knowledge version.
- **Research Program (`K12`)**: Active experiments on market requirement pattern extraction (`MarketPatternDefinitions`) conducted in isolated experimental modules (`experiments/k12-learning/`).
