# Design Specification: Contribution-Level R6 & Scope Ranking

Date: 2026-08-03
Status: Approved

## 1. Executive Summary

This specification shifts R6 relevance evaluation in Provena from coarse experience text blocks to fine-grained `Contribution` entities and their structural relationships (`capabilities`, `technologies`, `scope`).

Key Architectural Principles:
1. **Formatting is strictly terminal.** R6 relevance, scope ranking, and budgeting are computed directly on structured `Contribution` objects before string formatting.
2. **Explicit Decision Context Vocabulary Authority.** `cvProjector` MUST NOT inject implicit relevance vocabulary (such as hardcoded leadership terms). Relevance vocabulary is taken from `DecisionContext.emphasize` when explicitly provided; otherwise, the existing `profile.preferences.interests` fallback applies.

---

## 2. Contribution Relevance & Semantic Classification

Given a `Contribution` entity $C$, resolved capabilities from `Profile.capabilities`, and target decision vocabulary stems $V$:

### Signal Sources
Relevance stem matching evaluates four distinct structured sources:
1. `C.summary`
2. `C.outcome.summary` (if present)
3. `C.technologies` (if present)
4. Linked `Capability.name`s resolved via `C.capabilityIds`

### Hits & Semantic Class
Let $H$ be the count of unique relevance group matches across all signal sources.

- **`Core`**: $H \ge 2$
- **`Supporting`**: $H = 1$
- **`Historical`**: $H = 0$

**Invariant 1**: If $H = 0$, the contribution is classified as `Historical` regardless of `Scope`. Scope NEVER creates or upgrades semantic relevance from 0 hits.

---

## 3. Structural Scope Ranking

Relevant contributions are ordered using a strict lexicographical tuple. Scope amplifies priority among semantically relevant items without overriding semantic classification.

$$\text{SortTuple}(C) = \left\langle \text{semanticClassRank}(C),\, H(C),\, \text{scopeLevelRank}(C),\, \text{roleRank}(C),\, \text{evidenceClassRank}(C),\, \text{canonicalIndex}(C) \right\rangle$$

### Ranks Definition

- **`semanticClassRank`**: $\text{Core} (2) > \text{Supporting} (1) > \text{Historical} (0)$
- **`scopeLevelRank`**:
  - `organization` $= 4$
  - `product` $= 3$
  - `multi-team` $= 2$
  - `team` $= 1$
  - `individual` $= 0$
  - `unspecified` $= -1$
- **`roleRank`**:
  - `initiator` $= 2$
  - `lead` $= 1$
  - `contributor` $= 0$
  - `unspecified` $= -1$
- **`evidenceClassRank`**: Preserved existing regex taxonomy (`Quantified` (5) > `Adopted` (4) > `Artifact` (3) > `Owned` (2) > `Generic` (1)).
- **`canonicalIndex`**: Preserves original profile array index (lower index wins ties).

**Invariant 2**: `Core + team` ($2, H, 1$) strictly outranks `Supporting + organization` ($1, H, 4$). Between two contributions with equal semantic class and equal $H$, `organization + initiator` outranks `team + contributor`.

---

## 4. Experience Contribution Derivation & Budgeting

Before applying visual budget caps:

$$\text{ExperienceContribution} = \max_{C \in \text{Experience.Contributions}} \left( \text{semanticClassRank}(C) \right)$$

- If an experience has linked `Contribution` records, its container contribution level (`Core`, `Supporting`, `Historical`) is derived from its highest-ranking candidate contribution.
- If an experience has **zero** linked `Contribution` records, it falls back to legacy string `experienceContribution()`.

Budget cap (`CONTRIBUTION_BUDGET[ExperienceContribution]`) limits the maximum number of winning `Contribution`s selected per experience.

---

## 5. Terminal Formatting

Only after classification, ranking, and budgeting are completed, winning `Contribution` objects are formatted into strings:

```typescript
const formattedBullet = contribution.outcome?.summary
  ? `${contribution.summary} (Outcome: ${contribution.outcome.summary})`
  : contribution.summary
```

---

## 6. Experimental Audit Validation

Upon implementation, the audit experiment script (`packages/core/test/audit-contributions-experiment.test.ts`) will be re-run across the four baseline Decision Contexts (Staff, Senior Backend, AI/Productivity, Research) to record and compare the new selection matrix against baseline `commit 4d30c21`.
