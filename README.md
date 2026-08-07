# Provena

Connect your career to the market once. Provena continuously observes thousands of opportunities, evaluates them against your professional identity, and only interrupts you when something deserves your attention.

> **"Helping to look less."** — Preserve human attention for decisions that matter.

```bash
git clone https://github.com/valentinlineiro/provena.git
cd provena
npm install && npm test && npm run build
npm run dev
```

---

## Core Thesis

> **Professional identity is an immutable history of evidence. Communication is a projection optimized for a decision.**

Provena decouples professional identity from static CV formats and integrates continuous market observation to minimize human attention in job search.

- **Capture once**: Plain, referentially verified YAML workspaces (`Profile`).
- **Continuous market observer**: Autonomous board ingestion (Greenhouse, Ashby, Lever), deduplication, Neon PostgreSQL market memory, and Cloudflare Worker cron sync.
- **Deterministic evaluation**: Traceable APPLY / CONSIDER / SKIP verdicts against your canonical identity.
- **Attention Inbox**: Context-filtered market opportunities organized by semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`).
- **Sources management**: Explicit feed configuration — Inbox strictly consumes evaluated market facts.

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

## Subsystem Status (`v0.7.1`)

| Subsystem | Status | Description |
|-----------|--------|-------------|
| **Identity Domain** | ✅ **Stable** | Profile aggregate, referential integrity, YAML workspace loader/writer |
| **Decision Protocol** | ✅ **Stable** | Protocol v1 deterministic evaluation, OE-1/2/3 policies, traceable evidence |
| **Shared Market (O2)** | ✅ **Stable** | Greenhouse/Ashby/Lever board sync, posting deduplication, Neon PostgreSQL + Cloudflare Cron |
| **Sources Management** | ✅ **Stable** | Continuous observation adapters, feed configuration (`/sources`) |
| **Attention Inbox** | ✅ **Stable** | Semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`), cursor pagination |
| **K12 Knowledge Acquisition** | 🧪 **Experimental** | Market requirement pattern extraction (`MarketPatternDefinitions`) |
| **Attention Validation** | 📋 **Planned** | Empirical measurement of observation time reduction (*Helping to look less*) |

For full details, see [Live Project Status](docs/project-status.md), [ADR-001 Governance](docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md), and [Architecture Freeze Record](docs/architecture/freeze-v0.7.0.md).
