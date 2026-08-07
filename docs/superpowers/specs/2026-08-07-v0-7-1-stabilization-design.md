# Spec: v0.7.1 Product Stabilization & UI Architectural Alignment

- **Date:** 2026-08-07
- **Target Release:** v0.7.1
- **Status:** Approved / In Execution

---

## 1. Vision & Core Mental Model Shift

Provena is **not** a job board or an application generator ("CV inteligente"). 

Provena is a **continuous market observation system** that reduces the human attention needed to discover and evaluate relevant career opportunities.

### Conceptual Paradigm
```
           Sources (Greenhouse, Ashby, Lever...)
                             │
                             ▼
                Market (Neon PostgreSQL / KV)
                             │
                             ▼
               Decision Engine (Deterministic)
                             │
                             ▼
             Attention Inbox (Needs / Worth / Unresolved)
                             │
                             ▼
                  Helping to look less
```

The UI must faithfully mirror the three frozen architectural domains:
1. **Sources (`/sources`)**: Configuring, monitoring, and triggering continuous market observation. (The Inbox never creates market facts; it strictly consumes them).
2. **Market (`/opportunities`)**: Canonical observed facts stored in PostgreSQL/KV.
3. **Attention Inbox**: Semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`) designed to minimize human cognitive load.

---

## 2. Detailed Execution Phases

### Phase 1. Attention Inbox Hardening (`/opportunities`)
- **End-to-End Audit**: Verify `/opportunities` workflow end-to-end under all user decision states (`interested`, `dismissed`, `applied`).
- **Cursor / Bookmark Pagination**: Harden base64url cursor pagination and infinite scroll to prevent duplicate listings or missing items across tabs.
- **Tab Counters**: Ensure precise live counts for `Needs Attention`, `Worth Considering`, `Unresolved`, and `Decided`.
- **Market State Transitions**: Validate delta ingestion and transition handling for postings marked `ARCHIVED` when offers disappear from upstream sources.
- **Test Suite Expansion**: Add automated tests covering cursor bounds, decision persistence, and tab filtering.

### Phase 2. UI Alignment & Sources Management
- **Replace Manual Job Creation**: Eliminate manual offer creation from the Inbox UI. Market facts originate exclusively from observed Sources.
- **Sources Management Page (`/sources`)**:
  - View configured sources (e.g., Stripe Greenhouse, OpenAI Greenhouse, Anthropic Ashby, Linear Lever).
  - Status indicators: Active/Disabled, Last Sync, Next Sync, Jobs Observed count.
  - Interactive actions: "Sync Now" (trigger manual sync), Toggle active, Edit/Add source configuration.
- **Market Observation Dashboard Widget**:
  - **Observed Stats**: Active Sources count, Observed Companies, Active Jobs count, New Jobs Today.
  - **Attention Stats**: Needs Attention, Worth Considering, Unresolved.
- **Navigation Alignment**:
  - Update `siteNav` to reflect current architecture: `Story` | `Prepare` | `Sources` | `Inbox` | `Settings`.

### Phase 3. Platform Hardening & Fallbacks
- **No-Database Fallback**: Ensure 100% functional degradation when `DATABASE_URL` is absent (seamless KV or clean in-memory fallback without crashes).
- **Error States & Observability**: Clear empty state messages, retries on transient connection errors, loader indicators, and responsive layout polish across mobile and desktop viewports.

### Phase 4. Landing Page & Documentation Alignment
- **Landing Narrative Rewrite (`website/index.md`)**:
  - **Hero Headline**:
    > Connect your career to the market once. Provena continuously observes thousands of opportunities, evaluates them against your professional identity, and only interrupts you when something deserves your attention.
  - **4 Pillars**:
    1. *Build your professional identity* (Canonical model).
    2. *Provena continuously watches the market* (Automated observation).
    3. *Every opportunity is evaluated deterministically* (Falsifiable policies).
    4. *You only review what matters* (Attention reduction).
  - **Architecture Section**: Simple pipeline diagram (Greenhouse/Ashby → Neon PostgreSQL → Protocol v1 → Attention Policy → Inbox).
  - **Project Status Section**:
    - *Production-Ready*: Canonical Identity, Decision Protocol, Shared Market, Continuous Sync, Attention Inbox.
    - *Experimental*: Market Knowledge Learning, Attention Validation.
  - **Philosophy**: *"Helping to look less. Preserve human attention for decisions that matter."*
- **Repository Alignment**:
  - Audit and synchronize [`README.md`](../../../README.md), [`CONTRIBUTING.md`](../../../CONTRIBUTING.md), [`docs/roadmap.md`](../../roadmap.md), and [`docs/project-status.md`](../../project-status.md).

---

## 3. Post-v0.7.1 Release Roadmap

1. **v0.7.1 — Stabilization & Product Alignment**
   - Zero known bugs, hardening edge cases, UI aligned with observation architecture, refreshed landing and docs.
2. **v0.8.0 — K12 (Knowledge Promotion)**
   - Re-engage U2 dataset; pursue first operational knowledge version promotion.
3. **v0.9.0 — Attention Validation**
   - Measure Attention Precision & Missed Opportunity Rate; validate the "Helping to look less" hypothesis with empirical telemetry.
4. **v1.0.0 — Verified Continuous Attention Platform**
   - Operational Knowledge Version = 1, fully verified continuous market observation, backed by experimental proof.
