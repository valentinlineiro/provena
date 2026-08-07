# Provena

Your professional identity as a canonical source of truth and continuous market observer.

```bash
git clone https://github.com/valentinlineiro/provena.git
cd provena
npm install && npm test && npm run build
npm run dev
```

---

## Core Thesis

> **Professional identity is an immutable history of evidence. Communication is a projection optimized for a decision.**

Provena decouples professional identity from static CV formats and integrates continuous market observation to minimize job search friction.

- **Capture once**: Never reconstruct professional history from memory.
- **One source of truth**: Plain, referentially verified YAML workspaces (`Profile`).
- **Decision-aware projections**: Deterministic evaluation (`evaluateOpportunity(jd, profile)`) producing traceable APPLY / CONSIDER / SKIP verdicts.
- **Continuous market observer (O2)**: Autonomous board ingestion, deduplication, Neon PostgreSQL market memory, and background Cloudflare Worker sync.
- **Attention Inbox**: Context-filtered market opportunities organized by relevance.

---

## System Architecture

```text
Identity Layer
      │
      ▼
Decision Protocol (Protocol v1)
      │
      ▼
Shared Market Architecture (O2)
      │
      ▼
Attention Inbox UI
```

---

## Quick Start (Developer & Local Execution)

```bash
# 1. Run full test suite & monorepo build
npm test
npm run build

# 2. Render canonical profile demo via CLI
npm run demo

# 3. Start local web application & worker dev server
npm run --prefix packages/provena-web dev
```

---

## CLI Reference

| Command | What it does |
|---------|-------------|
| `provena render <dir>` | Generates resume.md (default), use `--format` for others |
| `provena demo` | Shows an example profile rendered immediately |
| `provena validate <dir>` | Checks for missing references or duplicate IDs |
| `provena import linkedin <file.zip>` | Imports LinkedIn data export into canonical workspace |

---

## Subsystem Status (`v0.7.0`)

| Subsystem | Status | Description |
|-----------|--------|-------------|
| **Identity Domain** | ✅ **Stable** | Profile aggregate, referential integrity, YAML workspace loader/writer |
| **Decision Protocol** | ✅ **Stable** | Protocol v1 deterministic evaluation, traceable evidence |
| **Shared Market (O2)** | ✅ **Stable** | Greenhouse board sync, posting deduplication, Neon PostgreSQL + Cloudflare Cron |
| **Attention Inbox** | ✅ **Stable** | Semantic tabs (`Needs Attention`, `Worth Considering`), cursor pagination |
| **K12 Knowledge Acquisition** | 🧪 **Experimental** | Market requirement pattern extraction (`MarketPatternDefinitions`) |
| **Attention Validation** | 📋 **Planned** | Empirical measurement of observation time reduction |

For full details, see [Live Project Status](docs/project-status.md), [ADR-001 Governance](docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md), and [Architecture Freeze Record](docs/architecture/freeze-v0.7.0.md).
