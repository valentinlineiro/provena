# K12-GTM-001 — Experimental Design (preregistered)

Status: DRAFT (not frozen). Freeze = commit this file AND `split.json`/`validate-split.mjs`
in a single commit, record the commit hash here, and only then open Discovery descriptions.

Family: GTM / Commercial Sales. Source universe: the 56 GTM titles in
`candidate-delta.json` (`observedExternalIds`).

## Experimental design (frozen, not negotiable after freeze)

- Split: `discovery` (37) / `virginHoldout` (19), stratified by title subfamily, ~2:1.
- Subfamily distribution:
  - AE / Enterprise Sales: 15 D / 8 H
  - SDR / Sales Development: 8 D / 4 H
  - CSM / Account Management: 6 D / 3 H
  - Partnerships / Partner Dev: 5 D / 2 H
  - Sales/GTM Leadership & Ops: 3 D / 2 H
- Invariants (enforced by `validate-split.mjs`): D∩H=∅, D∪H=56, |D|=37, |H|=19,
  14 controls unique and ∉ source, no ID classified twice.
- Controls: 14 negative hard examples from non-GTM families that share superficial
  GTM vocabulary (Manager/Lead/Strategy/Operations/Product/Enterprise).

## Pattern design (authorized AFTER freeze only)

- Allowed: declarative `MarketPatternDefinition`s only (see `market-knowledge.ts`),
  matched against **`raw.description`** — NOT title. Title vocabulary is only a
  subfamily-stratification cue; the recognizer fires on `extractMarketRequirements`
  output built from descriptions.
- Forbidden: rules keyed on `externalId`, company, Stripe-specific boilerplate;
  changes to parsers, ports, schemas, protocol, thresholds; any edit to K1–K6C.
- Matchers MUST be description-robust: they must match the concept as expressed in
  full JD prose, not regex literals lifted from titles.

## Metrics

All computed over `raw.description` recognition of a `MarketPatternDefinition`.

- RecoveryGain: (coverage on Discovery with delta) − (coverage on Discovery without delta).
- HoldoutTransfer: coverage gain measured on VirginHoldout (never shown during authoring).
- ControlContamination: number of Controls (of 14) matched by the delta.

## Promotion criteria (preregistered)

Promote ΔK_GTM iff ALL of:

1. RecoveryGain > 0
2. HoldoutTransfer > 0
3. ControlContamination = 0

Note: any strengthening of these (e.g. minimum RecoveryGain magnitude) must be
committed BEFORE measuring, not after.

## Freeze record

The commit that introduces `split.json` + `validate-split.mjs` + this spec IS the
experimental freeze. Its SHA is the freeze identity; it is recorded here in a
subsequent administrative commit (a commit cannot reference its own SHA).

- Freeze commit SHA: recorded in the next administrative commit
- Status: FROZEN
- Discovery inspection permitted: only after the freeze commit lands
- Sealed until ΔK is authored: VirginHoldout (19), Controls (14)

## Operational rule during induction

While authoring ΔK, no tool/report may print titles, descriptions, scores, or any
result touching VirginHoldout or Controls. Not "we promise not to look": the
workflow must make accidental observation structurally difficult. Discovery (37) is
the only dataset opened during induction.
