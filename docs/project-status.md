# Provena Project Status

**Last Updated:** 2026-08-07  
**Software Release:** v0.7.1  
**Decision Protocol Version:** Protocol v1  
**Current Operational Knowledge Version:** 0  
**Architecture Freeze Reference:** [freeze-v0.7.0.md](architecture/freeze-v0.7.0.md)  
**Governance ADRs:** [ADR-001](architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md), [ADR-002](architecture/adr/ADR-002-neon-canonical-market-orchestration.md)

---

## 3-Tier System Maturity Model

| Dimension | Maturity Level | Primary Focus | Frozen / Variable |
|-----------|----------------|---------------|-------------------|
| **Architecture (Plataforma)** | ✅ **Alta / Congelada** | Estabilidad, esquemas relacionales, Worker orquestador, Keyset Bookmarks | **Congelado** (Mantenimiento únicamente; requiere ADR-003 para cualquier cambio) |
| **Conocimiento Operativo** | 🧪 **Baja (v0)** | Extracción K12 (`MarketPatternDefinitions`), aprendizaje empírico, promociones de versión | **Variable** (Frontera experimental independiente) |
| **Validación de Producto** | 📋 **Inicial** | Attention Validation (Fase 5), reducción de tiempo de atención ("Help to look less"), Outcome Learning | **Variable** (Validación de hipótesis de valor) |

---

## Subsystem Maturity Detail

| Subsystem / Area | Maturity Status | Monorepo Location | Primary Responsibility |
|------------------|-----------------|-------------------|------------------------|
| **Canonical Professional Identity** | ✅ **Stable** | [`packages/core`](../packages/core), [`packages/yaml`](../packages/yaml) | Single source of professional truth, YAML loaders, referential integrity |
| **Decision Protocol (Protocol v1)** | ✅ **Stable** | [`packages/core`](../packages/core) | Deterministic evaluation `evaluateOpportunity(jd, profile)` (APPLY / CONSIDER / SKIP), traceable evidence |
| **Shared Market Architecture (O2)** | ✅ **Stable** | [`packages/market-postgres`](../packages/market-postgres), [`packages/provena-web`](../packages/provena-web) | Board sync (Greenhouse/Ashby/Lever), deduplication, PostgreSQL canonical store + Cloudflare Cron sync |
| **Sources Management & Inbox** | ✅ **Stable** | [`packages/provena-web`](../packages/provena-web) | Continuous market feed adapters (`/sources`), semantic tabs (`/opportunities`), Base64URL cursor reading bookmarks |
| **Continuous Synchronization** | ✅ **Stable** | [`packages/provena-web`](../packages/provena-web) | Pure Worker Orchestrator + Cron + PostgreSQL pipeline |
| **Market Knowledge Acquisition (K12)** | 🔬 **Research** | [`experiments/k12-learning/`](../experiments/k12-learning) | Market requirement pattern extraction (`MarketPatternDefinitions`), GTM splits, empirical learning |
| **Attention Validation** | 🔬 **Research** | [`docs/research/`](research) | Empirical measurement of observation time reduction (*Helping to look less*) |
| **Outcome Learning** | 🔭 **Vision** | [`docs/research/`](research) | Feedback loop from actual hiring outcomes |

---

## Operational Knowledge Versioning

```text
Current Operational Knowledge Version: 0
```

- **Definition**: Represents the promoted operational knowledge consumed by the decision engine in production.
- **Rule**: Research and experimental knowledge artifacts (such as `K12-GTM-002`) do **not** increment this version until formally promoted into production operational knowledge.
