# Provena Project Status

**Last Updated:** 2026-08-07  
**Software Release:** v0.7.1  
**Decision Protocol Version:** Protocol v1  
**Current Operational Knowledge Version:** 1  
**Architecture Freeze Reference:** [freeze-v0.7.0.md](architecture/freeze-v0.7.0.md)  
**Governance ADRs:** [ADR-001](architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md), [ADR-002](architecture/adr/ADR-002-neon-canonical-market-orchestration.md), [ADR-003](architecture/adr/ADR-003-knowledge-promotion-mechanism.md)

---

## 3-Tier System Maturity Model

| Dimension | Maturity Level | Primary Focus | Frozen / Variable |
|-----------|----------------|---------------|-------------------|
| **Architecture (Plataforma)** | ✅ **Alta / Congelada** | Estabilidad, esquemas relacionales, Worker orquestador, Keyset Bookmarks | **Congelado** (Mantenimiento únicamente; requiere ADR-003 para cualquier cambio) |
| **Conocimiento Operativo** | 🧪 **Baja (v1, 2 packs)** | Extracción K12 (`MarketPatternDefinitions`), aprendizaje empírico, promociones de versión | **Variable** (Frontera experimental independiente) |
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
Current Operational Knowledge Version: 1
```

- **Definition**: Represents the promoted operational knowledge — packs that have cleared a promotion eligibility gate. See [`operational-knowledge-v1.md`](architecture/operational-knowledge-v1.md) for the current composition, full per-pack lineage, and an explicit gap note about production not yet consuming exactly this set.
- **Rule**: Research and experimental knowledge artifacts (such as `K12-GTM-002`) do **not** increment this version until formally promoted into production operational knowledge.
- **v1 composition**: `DEFAULT_SOFTWARE_KNOWLEDGE` (promoted via the original isolated-benchmark gate, [`knowledge-promotion-contract.md`](architecture/knowledge-promotion-contract.md) §2/§3) and `FINTECH_PLATFORM_KNOWLEDGE` (promoted via the causal-contribution candidate promotion policy that superseded §3 after it was found structurally blind — see [`ADR-003`](architecture/adr/ADR-003-knowledge-promotion-mechanism.md)). Both promotions increment the same `Operational Knowledge Version 1`, not separate versions — a version increment is reserved for a change to the eligibility gate itself (contract or invariants), not for each additional pack promoted under an already-accepted gate.
- **Known limitation carried by this composition**: the causal-contribution policy's Misaligned Regression veto has never been tested against a real pack presenting both positive and negative signals simultaneously (remains `UNTESTED`, not validated — see [`causal-promotion-policy-complete-validation.md`](architecture/causal-promotion-policy-complete-validation.md) §1). `FINTECH_PLATFORM_KNOWLEDGE` itself has zero Misaligned Regression instances, so this does not cast doubt on its own verdict, but it is an open limit on the policy's general trustworthiness for any future promotion decided under this same mechanism.
