---
contract:
  name: Provena
  promise: "Helping to look less."
  thesis: "Traditional job platforms optimize for engagement. Provena optimizes for preserved attention."
  north_star: "Preserved human attention per correct decision"

canonical_terms:
  - "Canonical Identity"
  - "Continuous Market Observation"
  - "Deterministic Assessment"
  - "Attention Inbox"
  - "Sources"

capabilities:
  - id: identity
    name: "Canonical Identity"
    status: stable
    required_in: ["website/index.md", "website/problem.md", "website/concept.md", "website/architecture.md", "website/use-cases.md"]
  - id: observation
    name: "Continuous Market Observation"
    status: stable
    required_in: ["website/index.md", "website/problem.md", "website/concept.md", "website/architecture.md", "website/use-cases.md"]
  - id: assessment
    name: "Deterministic Assessment"
    status: stable
    required_in: ["website/index.md", "website/problem.md", "website/concept.md", "website/architecture.md", "website/use-cases.md"]
  - id: inbox
    name: "Attention Inbox"
    status: stable
    required_in: ["website/index.md", "website/problem.md", "website/concept.md", "website/architecture.md", "website/use-cases.md"]

architecture_routes:
  - path: "/sources"
    label: "Sources Management"
    package: "packages/provena-web"
  - path: "/opportunities"
    label: "Attention Inbox"
    package: "packages/provena-web"

packages:
  - "packages/core"
  - "packages/yaml"
  - "packages/market-postgres"
  - "packages/provena-web"
  - "packages/cli"

adrs:
  - "docs/architecture/adr/ADR-001-v0.7.0-architectural-reconciliation.md"
  - "docs/architecture/adr/ADR-002-neon-canonical-market-orchestration.md"
---

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

## 4. Documentation Contract Harness (Level 1–Level 4)

| Level | Check Scope | Validation Rule |
| --- | --- | --- |
| **Level 1** | **Narrative Invariants (D1–D6)** | Asserts core message presence across landing, README, and docs. |
| **Level 2** | **Capability Coverage** | Asserts 100% matrix coverage for all canonical capabilities across all core doc pages. |
| **Level 3** | **Architecture Consistency** | Verifies monorepo packages, web routes, and ADR files exist on disk. |
| **Level 4** | **Terminology Fidelity & Drift Detection** | Enforces canonical term usage and detects unauthorized terminology drift. |

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
