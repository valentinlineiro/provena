# Provena Project Status

**Last Updated:** 2026-08-07  
**Software Release:** v0.7.0  
**Decision Protocol Version:** Protocol v1  
**Current Operational Knowledge Version:** 0  
**Architecture Freeze Reference:** [freeze-v0.7.0.md](file:///home/valentin/code/provena/docs/architecture/freeze-v0.7.0.md)  
**Governance ADR:** [ADR-001](file:///home/valentin/code/provena/docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md)

---

## Subsystem Maturity

| Subsystem / Area | Maturity Status | Monorepo Location | Primary Responsibility |
|------------------|-----------------|-------------------|------------------------|
| **Canonical Professional Identity** | ✅ **Stable** | [`packages/core`](file:///home/valentin/code/provena/packages/core), [`packages/yaml`](file:///home/valentin/code/provena/packages/yaml) | Single source of professional truth, YAML loaders, referential integrity |
| **Decision Protocol (Protocol v1)** | ✅ **Stable** | [`packages/core`](file:///home/valentin/code/provena/packages/core) | Deterministic evaluation `evaluateOpportunity(jd, profile)` (APPLY / CONSIDER / SKIP), traceable evidence |
| **Shared Market Architecture (O2)** | ✅ **Stable** | [`packages/market-postgres`](file:///home/valentin/code/provena/packages/market-postgres), [`packages/provena-web`](file:///home/valentin/code/provena/packages/provena-web) | Board sync (Greenhouse), deduplication, Neon PostgreSQL + Cloudflare Cron sync |
| **Attention Inbox** | ✅ **Stable** | [`packages/provena-web`](file:///home/valentin/code/provena/packages/provena-web) | Market opportunity inbox, candidate preference filtering, relevance ranking |
| **Continuous Synchronization** | ✅ **Stable** | [`packages/provena-web`](file:///home/valentin/code/provena/packages/provena-web) | Automated Worker + Cron + PostgreSQL + KV snapshot pipeline |
| **Market Knowledge Acquisition (K12)** | 🧪 **Experimental** | [`experiments/k12-learning/`](file:///home/valentin/code/provena/experiments/k12-learning), [`experiments/k12a/`](file:///home/valentin/code/provena/experiments/k12a) | Market requirement pattern extraction (`MarketPatternDefinitions`), GTM splits, empirical learning |
| **Attention Validation** | 📋 **Planned** | [`docs/research/`](file:///home/valentin/code/provena/docs/research) | Empirical measurement of observation time reduction |
| **Outcome Learning** | 🔭 **Vision** | [`docs/research/`](file:///home/valentin/code/provena/docs/research) | Feedback loop from actual hiring outcomes |

---

## Operational Knowledge Versioning

```
Current Operational Knowledge Version: 0
```

- **Definition**: Represents the promoted operational knowledge consumed by the decision engine in production.
- **Rule**: Research and experimental knowledge artifacts (such as `K12-GTM-002`) do **not** increment this version until formally promoted into production operational knowledge.
