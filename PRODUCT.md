# Provena Product Contract

> **The Canonical Single Source of Truth for Product Definition, Narrative, and Architecture**

---

## 1. Core Identity & North Star

| Dimension | Definition |
| --- | --- |
| **Product Name** | Provena |
| **Category** | Continuous Market Observation & Attention Preservation Platform |
| **North Star Metric** | Preserved human attention per correct decision |
| **Product Promise** | *"Helping to look less."* |
| **Core Thesis** | **Traditional job platforms optimize for engagement. Provena optimizes for preserved attention.** |

---

## 2. Canonical Pipeline Sequence

Every public page, documentation view, and architectural specification must express this exact 4-pillar sequence:

```text
Professional Identity  ──►  Market Sources  ──►  Continuous Observation  ──►  Deterministic Assessment  ──►  Attention Inbox
```

1. **Build your identity**: Canonical, referentially sound representation of career facts, evidence, and capabilities in plain YAML.
2. **Connect market sources**: Continuous observation adapters monitoring job feeds (Greenhouse, Ashby, Lever) in the background.
3. **Deterministic evaluation**: Falsifiable decision engine evaluating professional fit, personal fit, and coverage without LLM state.
4. **Review only what matters**: Attention Inbox filtering market noise into semantic tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`).

---

## 3. Product Subsystem Classification

```text
                   Professional Identity
                            │
                            ▼
                 Canonical Identity Model
                            │
          ┌─────────────────┴─────────────────┐
          ▼                                   ▼
  Continuous Market Observation        Identity Projections
          │                                   │
          ▼                                   ├── Resume (.md / .html)
  Deterministic Assessment                    ├── LinkedIn (.markdown)
          │                                   └── Recruiter Brief
          ▼
    Attention Inbox (Product)
```

- **Domain O1 (Canonical Identity)**: Plain YAML workspaces, referential integrity validation, pure immutable profile model.
- **Domain O2 (Market Observation & Sources)**: Continuous board adapters (`/sources`), cryptographic deduplication (`makePostingDedupeKey`), PostgreSQL market catalog.
- **Domain O3 (Decision Engine & Attention)**: Protocol v1 deterministic evaluator (`APPLY`, `CONSIDER`, `SKIP`), Attention Inbox (`/opportunities`) with Base64URL cursor reading bookmarks.

---

## 4. Narrative Invariants (D1–D6 Contract)

| Invariant | Scope | Rule / Assertion |
| --- | --- | --- |
| **D1** | **Hero & Value Proposition** | Home, README, and Why must state *"Helping to look less"* and contrast attention preservation against engagement traps. |
| **D2** | **Canonical Sequence** | Problem, Concept, Architecture, and Getting Started must follow the sequence `Identity -> Sources -> Observation -> Assessment -> Inbox`. |
| **D3** | **Architecture Fidelity** | `architecture.md` must reflect the dual-branch system (Identity Projections + Continuous Market Assessment). |
| **D4** | **Scenario Alignment** | `use-cases.md` must group scenarios by system capability (Observation -> Assessment -> Knowledge -> Projections), not legacy persona buckets. |
| **D5** | **Roadmap Stage Continuum** | `roadmap.md` must express the stage continuum (Foundation -> Platform v0.7.1 -> Research Validation -> Future v1.0.0). |
| **D6** | **Web-First Onboarding** | `quickstart.md` (Getting Started) must activate the web product first, placing CLI as an optional secondary local helper. |

---

## 5. Projections of this Contract

All user-facing views are derived projections of this contract:

- **`README.md`**: Public GitHub overview projection
- **`website/index.md`**: Marketing landing projection
- **`website/why.md`**: Philosophy & positioning projection
- **`website/quickstart.md`**: Web-first onboarding projection
- **`website/problem.md`**: Friction & root cause projection
- **`website/concept.md`**: Conceptual model projection
- **`website/architecture.md`**: Architectural specification projection
- **`website/use-cases.md`**: Capability scenarios projection
- **`website/roadmap.md`**: Research continuum projection
