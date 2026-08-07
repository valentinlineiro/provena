# Product Roadmap

Every phase and epic exists because of a real friction event. Each phase reduces observable professional decision friction.

---

## Strategic Phase Continuum

```text
Phase 1: Canonical Professional Identity
        ✓ Completed

Phase 2: Decision-aware Projection
        ✓ Completed

Phase 3: Shared Market Architecture (O2)
        ✓ Completed

Phase 4: Market Knowledge Acquisition (K12)
        🧪 Experimental

Phase 5: Attention Validation
        📋 Planned

Phase 6: Helping to look less
        🔭 Vision
```

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
**Solution**: Continuous market observation system ingesting public job boards (Greenhouse), deduplicating postings, storing global market memory in Neon PostgreSQL, and running background Cloudflare Workers cron syncs.

### Phase 4 — Market Knowledge Acquisition (K12) (🧪 Experimental)
**Friction**: Requirement terms in job postings are noisy, unstructured, and rapidly shifting across companies.  
**Solution**: Empirical requirement pattern extraction (`MarketPatternDefinitions`), GTM split experiments (K12-GTM-001/002), and domain-specific knowledge acquisition models.

### Phase 5 — Attention Validation (📋 Planned)
**Friction**: Engineers waste hours skimming hundreds of irrelevant job postings every week.  
**Solution**: Empirical measurement and optimization of candidate attention reduction, filtering out non-matching opportunities before human review.

### Phase 6 — Helping to look less (🔭 Vision)
**Friction**: Job search is a reactive, continuous chore.  
**Solution**: Passive, autonomous alignment between candidate career trajectories and high-signal market opportunities.

---

## Friction Backlog & Epics

| Epic / Card | Objective | Status |
|-------------|-----------|--------|
| **CARD-000** | Decision Model definition (`Profile → Decision → Projection`) | ✅ Validated |
| **CARD-001** | Recruiter Brief projection (`provena render recruiter`) | ✅ Validated |
| **CARD-002A** | Local capture CLI (`provena add`) | ✅ Validated |
| **CARD-002B** | Continuous web UI + Automated Worker deploy | ✅ Deployed |
| **CARD-002C** | Identity Timeline View | ✅ Deployed |
| **CARD-002D** | Career Compass L1 (Positioning, Coverage, Next Step) | ✅ Implemented |
| **O2-EPIC** | Shared Market Architecture & Autonomous Cron Sync | ✅ Deployed |
| **K12-EPIC** | Market Requirement Cluster Learning | 🧪 Experimental |
