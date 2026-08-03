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

### Existing Evidence Reuse

`Evidence` is an **existing first-class entity** in `@provena/core` (`packages/core/src/types.ts`):

```typescript
export interface Evidence {
  readonly id: string
  readonly type: EvidenceSource
  readonly description: string
  readonly url?: string
  readonly date?: string
  readonly provenance?: Provenance
}
```

`Contribution.evidenceIds` references items in `Profile.evidence` (loaded from `profiles/<id>/evidence.yaml`).

### Profile & Identity Integration

To preserve structural symmetry across top-level collections in Provena (`experienceIds`, `projectIds`, `capabilityIds`, etc.), `Identity` and `Profile` are updated:

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

## 4. Atomic Migration Strategy per Experience

To avoid partial migration ambiguity and maintain canonical clarity:

- **Experience Boundary Migration**: Migration from legacy `achievements[]` to `Contribution` records is **atomic at the `Experience` level**.
- When an `Experience` has one or more linked `Contribution` records in `contributions.yaml`, its legacy `achievements[]` array in `experience.yaml` MUST be cleared/migrated so that zero duplicate facts exist.
- Experiences that have not yet been migrated keep their legacy `achievements[]` array and operate under fallback logic.
- **Core Invariant**: A professional fact MUST NOT be canonically maintained in both `Experience.achievements` and `Contribution`.

---

## 5. Separation of Decision Context & CV Projection

The selection pipeline separates candidate filtering from CV presentation:

```text
Profile (Contributions + Experiences)
       ↓
Decision Context (R4/R6 evaluate and rank candidate Contributions by target role/scope)
       ↓
Selected Contributions
       ↓
CVProjector (Formats selected contributions & fits within CV budget)
       ↓
CVProjection -> Renderer
```

1. **Decision Context**: Evaluates `Contribution` relevance using `capabilityIds`, `scope.level`, `scope.role`, and `technologies`.
2. **CVProjector**: Formats selected `Contribution`s into experience bullet points (combining `summary` + `outcome.summary`). For unmigrated experiences, legacy `achievements` are formatted.

---

## 6. Non-Goals (Out of Scope for V1 Slice)

- Generalizing `Contribution` to reference entities other than `Experience` (e.g. standalone projects or open-source initiatives).
- Removing `Experience.achievements` completely across all profile files.
- Fine-grained provenance attribution models (`asserted`, `documented`, `observed`, `derived`).
- Automatic LLM extraction of `Contribution`s from prose.

---

## 7. Testing Strategy

1. **Serialization**: `contributions.yaml` parses correctly into `Contribution[]`.
2. **Referential Integrity**: Invalid `experienceRef`, non-existent `capabilityIds`, non-existent `evidenceIds`, or invalid `scope.affectedTeams` fail validation cleanly.
3. **Decision Context & Projector**:
   - `Contribution`s are selected based on decision context relevance & scope.
   - Unmigrated `Experience` (zero contributions) falls back to legacy `achievements`.
4. **End-to-End Smoke Test**: Verify full pipeline with `profiles/valentin`.
