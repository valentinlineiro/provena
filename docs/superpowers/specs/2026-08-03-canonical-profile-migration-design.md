# Design Spec: Canonical Profile Migration (`profiles/valentin` vs Synthetic Fixtures)

**Date:** 2026-08-03  
**Status:** Approved (Brainstorming Phase Complete)

---

## 1. Context & Motivation

Provena previously contained two parallel identity representations:
- `examples/valen`: Mock test data ("Acme Corp", "TypeScript", etc.) used in tests, CLI defaults, and documentation examples.
- `profiles/valentin`: The real canonical identity workspace (`person.yaml`, `experience.yaml`, `capabilities.yaml`, etc.).

Maintaining mock examples alongside real profiles creates drift and duplication. This design deprecates `examples/valen` completely and establishes a strict separation between **real canonical product data** and **test infrastructure**.

---

## 2. Data Separation Model & Rule

```text
Real product truth
profiles/valentin ─────► web / docs / integration / E2E

Test truth
synthetic fixtures ────► isolated unit tests
```

### The Explicit Testing Rule
> **Unit tests MUST NOT depend on `profiles/valentin`. Tests MAY use it only when validating canonical-profile integration or end-to-end behavior.**

- **`profiles/valentin`**: Canonical real product identity. Used for public demonstrations, website documentation, and E2E integration tests. Must NOT be mutated or distorted to satisfy unit test cases.
- **Synthetic Fixtures**: Minimal in-memory or temporary workspace builders created strictly within unit test suites.

---

## 3. Authority & Documentation Rules

```text
profiles/valentin
       │
       ├── reference ──► docs       ✓
       │
       └── projection ─► generated docs ✓

copy/paste ────────────► docs       AVOID
```

- Documentation pages (`website/index.md`, `website/quickstart.md`, `website/examples.md`) MUST reference `profiles/valentin` as the canonical source.
- Code blocks in documentation showing output MUST be derived from or verified against `profiles/valentin` projections, preventing manual copy-paste drift.
- CLI default fallback commands (e.g. `provena render`) MUST NOT privilege `profiles/valentin` in code logic; any workspace path supplied must be explicit or resolved via standard workspace loading APIs.

---

## 4. Invariants & CI Enforcement

CI enforces two critical invariants:
1. **Zero References**: 0 occurrences of `examples/valen` in the codebase or documentation.
2. **Unprivileged Canonical Loading**: `profiles/valentin` MUST be fully valid and loadable via standard public workspace loading APIs without special-casing in code.

---

## 5. Non-Goals / Deferred Scope

- Do NOT convert `profiles/valentin` into a universal unit test fixture.
- Do NOT create `examples/valentin` or rename `profiles/valentin`.
- Do NOT build a generic documentation generator package at this time.
- Do NOT alter canonical contents of `profiles/valentin` to fix unit tests.
- Do NOT make CLI commands implicitly depend on `profiles/valentin` without explicit user/path specification.
