# Design Spec: Declarative Landing Projections (`landingProjector`)

**Date:** 2026-08-03  
**Status:** Approved (Brainstorming Phase Complete)

---

## 1. Context & Motivation

Provena follows a canonical principle: **a rich canonical state is projected into bounded, context-relevant representations** (e.g. CV projections selecting signal based on budget). 

Currently, the landing page (`provena.dev`) is a manually updated representation that risks drifting from actual product capabilities. Adding a feature should not automatically change the landing page, nor should removing or altering a feature leave stale marketing claims behind.

This design introduces **`landingProjector`**: a system where canonical product capabilities and release facts are verified against codebase evidence, selected by an editorial policy, projected into a structured model, and rendered to `provena.dev`.

---

## 2. Core Architecture

```text
  product/capabilities/*.yaml (Claims)
                │
                ├── Evidence (CLI commands, exports, tests)
                ▼
       EvidenceResolvers (Repository Authority)
                │
                ▼
        VerifiedCapability[] (Established Facts)
                │
                ├── Release State
                ▼
          ProductState (Derived & Inmutable)
                │
                ├── product/landing.yaml (Editorial Policy)
                ▼
         landingProjector (Pure Function)
                │
                ▼
           LandingModel (Structured Model)
                │
                ▼
         landingRenderer (Presentation Layer)
                │
                ▼
           provena.dev
```

---

## 3. Model & Epistemology (Authority Chain)

The system enforces a strict chain of authority to establish product facts:

```text
Capability Manifest = claim
Repository          = evidence authority
EvidenceResolver    = verification mechanism
ProductState        = derived established facts
```

- **Capability Manifest (`product/capabilities/*.yaml`)**: Declares a capability claim, lifecycle status, maturity, and referenced evidences. It has **no authority to self-justify**.
- **Repository**: Contains the actual executable code, tests, schemas, and surfaces. It is the **sole authority for evidence**.
- **EvidenceResolver**: Inspects the repository to verify if claims are backed by actual implementation facts.
- **ProductState**: Constructed exclusively from capabilities whose evidences successfully resolve. It cannot be hand-edited; it is a **derived value**.

---

## 4. Capability Lifecycle & Presentation Rules

### Lifecycle Dimensions

Capabilities separate operational status from promise of stability:

```ts
type CapabilityStatus =
  | "in-development"
  | "available"
  | "deprecated"
  | "removed";

type CapabilityMaturity =
  | "experimental"
  | "beta"
  | "stable";

type CapabilityLifecycle =
  | { status: "in-development" }
  | { status: "available" | "deprecated"; maturity: CapabilityMaturity }
  | { status: "removed" };
```

### Presentation Intent (`LandingPolicy`)

`product/landing.yaml` defines editorial selection and presentation intent:

```ts
type LandingPresentation =
  | "primary"
  | "secondary"
  | "preview";
```

- Absence of capability in `landing.yaml` implies `visible: false`.
- `presentation: primary` or `secondary` requires `status: available`.
- `presentation: preview` explicitly denotes a forward-looking feature (allows `status: in-development`).

---

## 5. Pure Interfaces & Renderer Isolation

The projector is a pure function with zero knowledge of HTML, JSX, VitePress, or file system IO:

```ts
type LandingProjector = (
  product: ProductState,
  policy: LandingPolicy,
) => LandingModel;

type LandingRenderer = (
  model: LandingModel,
) => string;
```

---

## 6. Three-Layer Invariants & CI Semantics

CI and tool execution enforce three distinct layers:

```text
L1 — PRODUCT TRUTH
──────────────────
Capability manifests valid syntax
All referenced evidence resolves against codebase
Lifecycle configuration is valid

        ↓

L2 — PROJECTION TRUTH
─────────────────────
Landing policy references existing capability IDs
Presentation intent matches capability lifecycle (e.g. no removed/in-dev as primary)
Projection execution is deterministic

        ↓

L3 — EDITORIAL CONVERGENCE
──────────────────────────
Current LandingModel vs Accepted LandingModel Snapshot
Semantic diff produced
```

### Snapshot Semantics
The snapshot (`website/landing-snapshot.json`) is an **editorial decision artifact**, not a technical golden file. 

- `provena landing review`: Displays semantic diff between verified product projection and accepted snapshot.
- `provena landing accept`: Human explicitly approves the new public representation of Provena, updating the snapshot.

---

## 7. Extraction Rule & Package Boundaries

To avoid premature abstraction:

- Implementation begins within `landing-projector` (or internal module).
- **Extraction Rule**: `landing-projector` MAY evolve into a shared `@provena/product` domain package ONLY when at least one additional product projection (e.g. `readmeProjector`, `docsOverviewProjector`) demonstrates concrete reuse of `ProductState` or validation semantics.

---

## 8. Non-Goals / Deferred Scope

The following items are explicitly out of scope for the initial implementation:

- Creating a `@provena/product` package upfront.
- Creating a generic `ProductProjection<TPolicy, TModel>` base class or interface.
- Automatic AST, JSDoc, or decorator code inspection/discovery.
- Automatic AI copy inference/generation.
- Generating `README.md` or documentation overviews.
- Formal multi-evidence sufficiency logic (a single valid evidence satisfies a capability for now).
- Automatic consumption or parsing of `PROJECT_MEMORY.md`.
