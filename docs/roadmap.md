# Product Roadmap & Strategic Programs

Every phase and epic exists because of a real friction event. Each phase reduces observable professional decision friction.

---

## The Core Metric & Purpose

> **Provena is a System for Attention Preservation.**  
> Unlike traditional job portals that optimize for click-through rate (CTR), dwell time, and application volume, Provena optimizes for **Attention Preserved Per Correct Decision** ("Helping to look less").

---

## 3 Parallel Execution Programs

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ PROGRAM A: Platform Engineering (Stable / Frozen)                          │
│ Objective: System stability, Neon canonical store, keyset reading bookmarks.│
│ Status: ADR-001 & ADR-002 Accepted. Maintenance mode only.                │
├─────────────────────────────────────────────────────────────────────────────┤
│ PROGRAM B: Knowledge Acquisition (Research / Experimental)                 │
│ Objective: Empirical pattern discovery (K12-U2/U3) & requirement extraction.│
│ Status: Active experiments in experiments/k12-learning/                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ PROGRAM C: Product Science & Attention Evidence (Product Science)          │
│ Objective: Prove Attention Precision & Missed Opportunity Reduction.        │
│ Target Milestone: Operational Knowledge Version 0 -> 1 Promotion.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Strategic Phase Continuum

```text
Phase 1: Canonical Professional Identity
        ✓ Completed

Phase 2: Decision-aware Projection
        ✓ Completed

Phase 3: Shared Market Architecture (O2) & Neon Canonical Store
        ✓ Completed

Phase 4: Market Knowledge Acquisition (K12)
        🧪 Experimental

Phase 5: Attention Validation & Product Science
        📋 Planned

Phase 6: Helping to look less (Symbolic Milestone: Operational Knowledge Version 1)
        🔭 Vision
```

---

## Symbolic Milestone: First Operational Knowledge Promotion

```text
Operational Knowledge Version: 0 ──► 1
```

- **Definition**: The milestone when the first experimental K12 pattern model satisfies empirical validation criteria and is formally promoted into production operational knowledge.
- **Significance**: Marks the transition of Provena from foundational infrastructure construction to an evolving, self-accumulating operational market intelligence platform.

---

## Phase Details

### Phase 1 — Canonical Professional Identity (✓ Completed)
**Friction**: Professional memory is scattered across CVs, PDFs, and LinkedIn. Every update requires manual reconstruction.  
**Solution**: Single source of truth in plain YAML workspaces (`Profile`, `Person`, `Experience`, `Capability`, `Evidence`) with referential integrity validation.

### Phase 2 — Decision-aware Projection (✓ Completed)
**Friction**: A single static CV cannot serve different professional decisions or contexts.  
**Solution**: Pure, deterministic projection functions (`Profile → Projection → Renderer`) and Protocol v1 opportunity evaluation (`evaluateOpportunity(jd, profile)`) producing traceable APPLY / CONSIDER / SKIP verdicts.

### Phase 3 — Shared Market Architecture (O2) (✓ Completed)
**Friction**: Job opportunities are evaluated manually and in isolation; market memory is lost across job searches.  
**Solution**: Continuous market observation system ingesting public job boards (Greenhouse), deduplicating postings, storing global market memory in Neon PostgreSQL, serving keyset reading bookmarks, and running background Cloudflare Workers cron syncs.

### Phase 4 — Market Knowledge Acquisition (K12) (🧪 Experimental)
**Friction**: Requirement terms in job postings are noisy, unstructured, and rapidly shifting across companies.  
**Solution**: Empirical requirement pattern extraction (`MarketPatternDefinitions`), GTM split experiments (K12-GTM-001/002), and domain-specific knowledge acquisition models.

### Phase 5 — Attention Validation (📋 Planned)
**Friction**: Engineers waste hours skimming hundreds of irrelevant job postings every week.  
**Solution**: Empirical measurement and optimization of candidate attention reduction, measuring Attention Precision and Missed Opportunity Rate before human review.

### Phase 6 — Helping to look less (🔭 Vision)
**Friction**: Job search is a reactive, continuous chore.  
**Solution**: Passive, autonomous alignment between candidate career trajectories and high-signal market opportunities.
