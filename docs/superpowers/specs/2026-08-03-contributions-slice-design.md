# Design Specification: Contribution-Driven Professional Trajectory Slice

Date: 2026-08-03
Status: Approved

## 1. Executive Summary

Provena is evolving its core profile model from coarse-grained career containers (`Persona -> Experience -> Skills`) to fine-grained, outcome-oriented professional trajectory units:

```text
Persona -> Trajectory -> Contributions -> Outcomes -> Evidence -> Capabilities
```

This specification defines the first vertical slice: **`Contribution + Outcome + Scope + Evidence`**.

`Contribution` is introduced as a first-class, top-level canonical entity that references an `Experience`. It captures concrete professional achievements with explicit outcomes, organizational scope, linked capabilities, technologies, and evidence.

---

## 2. Core Data Model & Types

The following types are added to `@provena/core` (`packages/core/src/types.ts`):

```typescript
export type ScopeLevel =
  | 'individual'
  | 'team'
  | 'multi-team'
  | 'product'
  | 'organization'

export type ContributionRole =
  | 'initiator'
  | 'lead'
  | 'contributor'

export interface Scope {
  readonly level: ScopeLevel
  readonly affectedTeams?: number
  readonly role?: ContributionRole
}

export interface Outcome {
  readonly summary: string
}

export interface Contribution {
  readonly id: string
  readonly experienceRef: string // Mandatory in V1
  readonly summary: string
  readonly period?: {
    readonly start: string
    readonly end?: string
  }
  readonly outcome?: Outcome
  readonly scope?: Scope
  readonly capabilityIds: readonly string[]
  readonly technologies?: readonly string[]
  readonly evidenceIds: readonly string[]
}
```

### Profile Integration

In `@provena/core` (`packages/core/src/profile.ts` and `types.ts`):

```typescript
export interface Identity {
  // ... existing fields
  readonly contributionIds: readonly string[]
}

export interface Profile {
  // ... existing fields
  readonly contributions: readonly Contribution[]
}
```

---

## 3. Workspace Serialization & Referential Integrity

### Canonical Storage

Each profile workspace contains a top-level collection file:

```text
profiles/<identity>/contributions.yaml
```

Example (`profiles/valentin/contributions.yaml`):

```yaml
- id: summa-clean-architecture
  experienceRef: summa-networks
  summary: >
    Designed a Clean Architecture proposal for the HSS backend.
  outcome:
    summary: >
      Adopted as the architectural foundation of the SMSC product.
  scope:
    level: product
    role: initiator
  capabilityIds:
    - software-architecture
  technologies:
    - java
    - spring
  evidenceIds: []
```

### Referential Integrity Constraints

`YamlWorkspaceLoader` (`packages/yaml`) and validator (`packages/core/src/validate.ts`) enforce:

1. `Contribution.id` MUST be globally unique across contributions.
2. `Contribution.experienceRef` MUST reference an existing `Experience.id`.
3. Every entry in `Contribution.capabilityIds` MUST reference an existing `Capability.id`.
4. Every entry in `Contribution.evidenceIds` MUST reference an existing `Evidence.id`.
5. If `Scope.affectedTeams` is specified, it MUST be a positive integer (`> 0`).

---

## 4. Hybrid Migration & Compatibility Strategy

To ensure zero regressions and incremental adoption:

- `Experience.achievements` is designated as a **legacy fallback representation**.
- **Core Invariant**: A professional fact MUST NOT be canonically maintained in both `Experience.achievements` and `Contribution`.

### Projector Selection Logic (`CVProjector`)

When projecting a targeted CV:

1. If an `Experience` has linked `Contribution`s in `Profile`:
   - Filter/rank `Contribution`s based on target role capabilities, scope, and relevance.
   - Render selected `Contribution` summaries and outcomes as experience bullet points.
2. If an `Experience` has **zero** `Contribution`s:
   - Fall back to projecting legacy `Experience.achievements`.
3. `Experience` baseline continuity (company header, title, dates) is always preserved regardless of whether contributions are selected.

---

## 5. Non-Goals (Out of Scope for V1 Slice)

- Generalizing `Contribution` to reference entities other than `Experience` (e.g. standalone projects or open-source initiatives).
- Removing `Experience.achievements` completely.
- Migrating all legacy experiences in `profiles/valentin` at once.
- Fine-grained provenance attribution models (`asserted`, `documented`, `observed`, `derived`).
- Automatic LLM extraction of `Contribution`s from prose.

---

## 6. Testing Strategy

1. **Serialization**: `contributions.yaml` parses correctly into `Contribution[]`.
2. **Referential Integrity**: Invalid `experienceRef`, non-existent `capabilityIds`, or invalid `scope.affectedTeams` fail validation cleanly.
3. **Projector Logic**:
   - `Contribution`s are selected based on decision context relevance & scope.
   - `Experience` without `Contribution`s falls back to legacy `achievements`.
4. **End-to-End Smoke Test**: Verify projection pipeline with `profiles/valentin`.
