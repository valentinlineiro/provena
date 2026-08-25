# Product & Research Roadmap

Provena is developed in public. Each stage tests a specific hypothesis and advances the platform from foundational architecture to empirical attention validation.

---

## Strategic Stage Continuum

```text
Foundation (Completed)
──────────
✔ Canonical Identity Model
✔ Projection & Renderer Engine
✔ Invariants I1–I5 & Validation

Platform (Completed — v0.7.1)
────────
✔ Continuous Market Observation (Sources)
✔ Shared Market Catalog (PostgreSQL)
✔ Deterministic Decision Engine (Protocol v1)
✔ Attention Inbox & Keyset Bookmarks
✔ Architecture Freeze (ADR-001)

Validation & Product Science (Research)
──────────
◉ K12 Knowledge Acquisition (Operational Pattern Discovery)
◉ Attention Validation (Attention Precision & Missed Opportunity Rate)
◉ Outcome Learning Telemetry

Future & Milestone v1.0.0
──────
✔ First Operational Knowledge Version Promotion (Version = 1)
○ Verified Continuous Attention Platform
○ Public Beta & Stable Platform APIs
```

---

## Evolution of Hypotheses

| Version | Question / Hypothesis | Outcome |
| ------- | --------------------- | ------- |
| **v0.1** | Can professional identity be represented canonically in plain YAML? | ✅ Canonical Identity Model (`Profile`) |
| **v0.2** | Can that model be validated and projected deterministically? | ✅ Workspace Loader, Invariant Tests & CLI |
| **v0.3** | Can the architecture remain extensible across multiple projections? | ✅ Pure `Projector<T>` & `Renderer<T>` Interfaces |
| **v0.4** | Can identity be projected into HTML, Markdown, and JSON Resume? | ✅ Multi-format Rendering (`@provena/html`) |
| **v0.5** | Can identity drive automated decision contexts and positioning? | ✅ Story, Career Compass & Decision Context |
| **v0.6** | Can job opportunities be evaluated deterministically against identity? | ✅ Protocol v1 Evaluator (`evaluateOpportunity`) |
| **v0.7.0 / v0.7.1** | Can market observation be continuous and attention-focused? | ✅ Sources (`/sources`), Shared Market, Attention Inbox (`/opportunities`), Architecture Freeze |

---

## Current Research Focus

### 1. K12 — Operational Knowledge Acquisition
- **Question**: *Can Provena discover and extract operational requirement patterns across job boards automatically?*
- **Focus**: K12 pattern clustering (`MarketPatternDefinitions`), GTM split experiments, and discriminative requirement extraction.

### 2. Attention Validation & Telemetry
- **Question**: *Can Provena demonstrably reduce job search attention without missing relevant opportunities?*
- **Focus**: Measuring **Attention Precision** and **Missed Opportunity Rate**, proving the *"Helping to look less"* hypothesis with empirical metrics.

---

## Symbolic Milestone: First Operational Knowledge Promotion

```text
Operational Knowledge Version: 0  ──►  1
```

**Status: Achieved.** `Operational Knowledge Version` is `1`, currently composed of `DEFAULT_SOFTWARE_KNOWLEDGE` and `FINTECH_PLATFORM_KNOWLEDGE` — see [`project-status.md`](project-status.md) and [`architecture/operational-knowledge-v1.md`](architecture/operational-knowledge-v1.md) for the full composition and lineage.

- **Definition, as achieved — noted honestly against the original framing below**: the promoted packs are pre-existing domain knowledge packs cleared via a governance eligibility gate (first the original isolated-benchmark §3 gate, then a causal-contribution policy after that gate was found structurally blind — see [`architecture/adr/ADR-003-knowledge-promotion-mechanism.md`](architecture/adr/ADR-003-knowledge-promotion-mechanism.md)), not K12-discovered pattern models. The milestone below was originally framed around a K12 pattern model specifically; K12 knowledge acquisition (§1) has not yet produced a pack that has cleared this gate, so this line item is retained as written for historical accuracy, not edited to match what actually happened.
- **Significance**: Marks the transition of Provena from foundational software infrastructure to an evolving, self-accumulating operational market intelligence platform.

---

## Release Sequence

- **v0.7.1 — Stabilization & Product Alignment** (Current)
  - Zero known bugs, hardening Neon fallbacks, Sources management, Attention Inbox UI, refreshed landing & docs.
- **v0.8.0 — K12 (Knowledge Promotion)**
  - Re-engage U2 dataset, discriminative requirement extraction, first operational knowledge promotion.
- **v0.9.0 — Attention Validation**
  - Attention Precision & Missed Opportunity Rate telemetry.
- **v1.0.0 — Verified Continuous Attention Platform**
  - Operational Knowledge Version = 1, stable platform APIs, public beta.
