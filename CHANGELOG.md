# Changelog

All notable changes to Provena are documented here.

## v0.6.0 — Evaluate, then prepare (2026-08-04)

**From a story you maintain to a decision you can justify.** Provena looks at
a real job offer and answers "should I apply?" using only what it already
knows — with reasons traced to the canonical profile.

- Opportunity Evaluation `/evaluate`: paste a job description → APPLY /
  CONSIDER / SKIP, deterministic (no LLM), reasons traced to the canonical
  profile; coverage / interpretation / confidence per offer
- Capability `signals`: semantic vocabulary per capability; seeded across the
  5 persona-relevant capabilities
- Handoff: APPLY → "Prepare application" → `/cv` pre-filled from the decision
  context (`role`, `emphasize`)
- Canonical profile: contributions carry `capabilityIds` so evaluation reads
  real evidence; contributions count as experience milestones
- Invariants I-OE-1/2/3 (no recognition ≠ no evidence; claims trace; absent
  criteria are unknown, never violated); three-way verdict always returned

[Full release notes](docs/releases/v0.6.0.md)

## v0.5.0 — Use it, then interpret it (2026-08-03)

**From a capture form to a decision surface.** The web becomes the place
where a career story is visibly maintained and interpreted, not stored.

- Story `/`: Identity Timeline — observation-first home, English-first,
  dogfooding events in KV
- Career Compass `/`: deterministic (no LLM), narrative
  Assessment → Evidence → Improvement, `insufficient evidence` vs negative
- Prepare `/cv`: web CV prep over a decision context, `cvProjector`,
  Career Snapshot, Core vs Primary skills, CV Readiness
- Navigation: shared `siteNav`, Story | Prepare (Career reserved);
  menu changes section, buttons perform actions
- Preview auto-updates; `Your CV` is passive; mobile nav spacing

[Full release notes](docs/releases/v0.5.0.md)

## v0.4.0 — Adoption (2026-07-23)

**From architecture to adoption.** A developer can go from `git clone` to
`provena render my-profile` in under five minutes.

- CLI v2: `render --format`, `validate`, `--stdout`, `--help`
- README rewritten: Quick Start first, Golden Path
- Website: Quick Start page, Status table, updated architecture
- `npm run build` added (typecheck)

[Full release notes](docs/releases/v0.4.0.md)

## v0.3.0 — Projection proof (2026-07-23)

**Contracts and falsifiability.** The architecture becomes verifiable through
executable invariants.

- `Projector<TModel>` interface (pure `Profile → TModel`)
- `ResumeModel` replaces `ResumeProjection`
- `@provena/jsonresume` package (projector + renderer)
- Tests for I1-I5 (identity immutability, determinism, meaning preservation)
- I6 deferred (needs second `Renderer<ResumeModel>`)

## v0.2.0 — Trust layer (2026-07-22)

**Validation and basic invariants.** The model executes with guardrails.

- YAML workspace loader with referential integrity checks
- CLI (`provena render <workspace>`)
- First invariant tests (projection purity, identity unchanged)
- Validation rejects dangling references and duplicate IDs

## v0.1.0 — Concept (2026-07-21)

**Initial model.** The canonical identity model exists as types.

- Domain types: Identity, Person, Experience, Project, Capability, Evidence
- Profile aggregate
- Markdown renderer
- README with thesis and example
- Website with problem, concept, and architecture pages
