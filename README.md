# Provena

**Stop searching. Provena continuously watches the job market and only interrupts you when an opportunity deserves your attention.**

> **Traditional job platforms optimize for engagement. Provena optimizes for preserved attention.**

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

1. **Build your identity**: Plain, referentially verified YAML workspaces (`Profile`).
2. **Connect market sources**: Autonomous board ingestion (Greenhouse, Ashby, Lever), deduplication, and PostgreSQL market memory.
3. **Deterministic evaluation**: Traceable APPLY / CONSIDER / SKIP verdicts evaluated deterministically against your canonical identity.
4. **Review only what matters**: Attention Inbox organized into semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`).

---

## System Architecture

```text
Identity Domain
      │
      ▼
Continuous Market Observation (Sources & Market Catalog)
      │
      ▼
Decision Engine (Protocol v1 & Deterministic Assessment)
      │
      ▼
Attention Inbox UI (Product)
      │
      ▼
Helping to look less
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
| **Shared Market (O2)** | ✅ **Stable** | Greenhouse/Ashby/Lever board sync, posting deduplication, PostgreSQL + Cloudflare Cron |
| **Sources Management** | ✅ **Stable** | Continuous observation adapters, feed configuration (`/sources`) |
| **Attention Inbox** | ✅ **Stable** | Semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`), cursor pagination |
| **K12 Knowledge Acquisition** | 🔬 **Research** | Market requirement pattern extraction & clustering (`MarketPatternDefinitions`) |
| **Attention Validation** | 🔬 **Research** | Empirical measurement of observation time reduction (*Helping to look less*) |

For full details, see [Live Project Status](docs/project-status.md), [ADR-001 Governance](docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md), and [Architecture Freeze Record](docs/architecture/freeze-v0.7.0.md).
