# Opportunity Evaluation — design

**Date:** 2026-08-04
**Status:** Approved design
**Version:** 0.6.0 (planned)

## Objective

The interaction unit of this product line is the web. Validate whether
Provena can look at a real job offer and help answer *"should I apply?"* —
using only what it already knows.

The vertical slice: **paste a job description → APPLY / CONSIDER / SKIP →
reasons traced to the canonical profile → hand the decision context to the
CV projection.**

This is the **Self** decision context already defined in
`docs/decision-model.md`:

> **Self — Decision:** Should I apply for this opportunity?
> **Needs:** alignment, missing evidence, reusable material.

No scraping, no job search, no application automation, no CLI
infrastructure. URL ingestion is deferred until pasting a JD proves the
capability.

## Current state

- `Preferences` (opportunity criteria: roles, work.remote, compensation,
  avoid, interests) already exists in the canonical model
  (`packages/core/src/types.ts`) and is loaded from `profiles/valentin/preferences.yaml`.
  **No model work needed for criteria.**
- `Capability` exists but has no `signals`. This is the only model change.
- `cvProjector(profile, context)` exists in core. The handoff target is
  the existing `/cv` web page.
- The web bundles the canonical profile as generated `profile.ts` — the
  evaluator has direct access to capability → contribution → evidence.

## Design

### The pipeline

```
pasted JD
   │
   ├── criterion extractors   → CriteriaCheck[]  (satisfied | violated | unknown)
   └── signal matcher         → SignalMatch[]    (demonstrated | no-evidence)
                              + not-evaluated text
   │
   └── evaluation policy
             │
             ▼
   APPLY / CONSIDER / SKIP
             │
             ▼
         DecisionContext
             │
             ▼
         cvProjector
```

`evaluateOpportunity(jd: string, profile: Profile): OpportunityEvaluation`
is the public pure frontier of the domain: prose + canonical truth in,
a traceable evaluation out. Internally it decomposes into extractors,
matcher, coverage, and policy.

### 1. Model change (minimal, minor semver)

```yaml
capabilities:
  - id: technical-leadership
    name: Technical Leadership
    signals:
      - technical leadership
      - technical direction
      - drive technical decisions
      - mentor engineers
```

- `signals?: readonly string[]` added to `Capability`
  (`packages/core/src/types.ts`). New optional field → semver minor.
- YAML schema + loader accept it. `Preferences` unchanged.
- Seed: signals for the capabilities that have contributions in the
  canonical profile.

### 2. Criterion extractors

Small deterministic extractors, one per criterion, each checked against
`Preferences`:

- **compensation** — salary ranges in the JD (`€70,000–€90,000`,
  `80k`, `70.000-90.000€`) vs `compensation.minimum`.
- **workMode** — `remote` / `hybrid` / `on-site`, `3 days per week in
  Madrid` vs `work.remote`.
- **roles** — role keywords in the JD vs `roles`.
- **avoid** — `avoid` patterns present in the JD.

A criterion that the extractor cannot detect yields `unknown`, never
`violated`. A violated criterion requires positive evidence of violation
from the JD text.

### 3. Signal matcher

- JD text is normalized; capability `signals` are matched as phrases.
- Each match resolves to a canonical capability → contributions →
  evidence.
- `SignalMatch.status`:
  - `demonstrated` — the capability is recognized AND the profile has
    evidence for it.
  - `no-evidence` — the capability is recognized but the profile has no
    evidence for it.
- Unrecognized JD text is classified `not-evaluated`. It never enters the
  coverage denominator.

### 4. Evaluation policy

The policy operates only over the universe Provena recognized:

```text
coverage =
  demonstrated /
  (demonstrated + no-evidence)

interpretation coverage =
  recognized /
  (recognized + not-evaluated)
```

where `recognized` counts signal matches and `not-evaluated` counts JD
text the matcher could not map to any signal.

Verdict (thresholds are deliberate calibration hypotheses, set by
dogfooding with real offers, not by design):

```text
any criterion violated
→ SKIP

demonstrated coverage >= threshold1
+ interpretation coverage >= threshold2
→ APPLY

otherwise
→ CONSIDER
```

- `interpretation coverage >= threshold2` guards against concluding
  `APPLY` from 2/2 matches on a long, mostly-unrecognized JD.
- `UNKNOWN` exists only at the signal level; the verdict is always
  three-way.
- Confidence is reported alongside the verdict.

### 5. Web surface

- New route `/evaluate`: paste JD → `POST /api/evaluate` → verdict card.
- Result shows an auditable trace:

```
JD: "Own architectural decisions for backend systems"
  ↓ matched signal: "architectural decisions"
  ↓ capability: software-architecture
  ↓ your evidence: summa-clean-architecture
```

- Blocks: **Criteria** (✓/✗/?), **Can demonstrate** (✓ + trace),
  **Gaps** (no-evidence), **Not evaluated** (? — honest about what the
  model cannot read).
- Handoff: on `APPLY`, "Prepare application" → `/cv` with a
  `DecisionContext` derived from the evaluation.

### 6. Invariants

> **I-OE-1 — Absence of recognition MUST NOT be interpreted as absence of evidence.**
> Unrecognized JD text is `not-evaluated`, never a gap.

> **I-OE-2 — Claims trace to canonical evidence.**
> Opportunity evaluation MUST NOT introduce claims about the profile that
> cannot be traced to canonical evidence. Provena never invents support.

> **I-OE-3 — Violation requires positive evidence.**
> A violated criterion requires positive evidence of violation from the JD
> text; failure to extract a criterion yields `unknown`, never `violated`.

## Scope guardrails

- No KV. No scraping. No URL fetching. No vocabulary-learning mechanism.
  The profile stays the single source of truth; the web only uses it.
- Real offers that fail show exactly which signal was missing → added to
  YAML by hand. If after ~10 offers the pattern is "always missing
  something", that is the evidence for building canonical editing — not
  built now.
- Thresholds, missing signals, and extractor quality are answered by
  dogfooding, not more design.

## Success criteria

- A real offer pasted produces APPLY / CONSIDER / SKIP with reasons
  traced to canonical evidence.
- A violated criterion (e.g. compensation below minimum, mandatory
  on-site) produces SKIP.
- Unrecognized JD text is honestly marked `not-evaluated`, never counted
  as evidence or as a fabricated gap.
- `Prepare application` produces a CV projection for that offer using the
  evaluation's decision context.
