# K12-GTM-002 — Experimental Design (preregistered)

Status: DRAFT (not frozen). Freeze = commit this file AND
`u2-split-final.json`/`validate-u2-split.mjs` in a single commit, record the
commit hash here, and only then open Discovery descriptions.

Family: GTM / Commercial Sales. Source universe: the 28 pure GTM jobs reclassified
in `u2-universe-raw.json` (`pureNewGtm`). U1 GTM (56) + U1 controls (14) are
consumed provenance and are NOT reused as evidence here.

## Rationale (U1 lesson: transfer ≠ specificity)

U1 recovered real GTM signal (Recovery +0.099, HoldoutTransfer +0.093) yet failed
ControlContamination 3/14. Root cause: 4 matchers (`mentor`, `trusted advisor`,
`product adoption`, `go-to-market strategy`) expressed the signal at a
semantically generic level — they fire on non-GTM jobs whose language merely
overlaps business vocabulary. Therefore U2 requires every matcher to be
discriminative of GTM function, and the control set is built to catch
vocabulary-only matchers.

## Experimental design (frozen, not negotiable after freeze)

- Split: `discovery` (19) / `virginHoldout` (9), stratified by title subfamily,
  ~2:1, deterministic (seed 1337).
- Exception (single, frozen): the unique SDR role (8072764, Head of Sales
  Development, AMER) is forced to Discovery so the SDR subfamily is represented in
  Discovery; otherwise it would sit alone in holdout and Discovery U2 would not
  induce any SDR signal.
- Subfamily distribution (computed by `build-u2-split.mjs`):
  - AE / Enterprise Sales: 15 D / 7 H
  - Partnerships / Partner Dev: 1 D / 1 H
  - SDR / Sales Development: 1 D / 0 H
  - Sales/GTM Leadership & Ops: 2 D / 1 H
- Invariants (enforced by `validate-u2-split.mjs`): D∩H=∅, D∪H=pureNewGtm (28),
  |D|=19, |H|=9, 14 controls unique and ∉ positive GTM set, no ID twice.
- Controls (14): 11 GTM-frontier roles (Sales Engineer/Presales, Technical Partner
  Manager, GTM Accelerate, GTM Ops, Sales Enablement, Account Manager Privy,
  Program Manager GTM Planning) + 3 fresh hard-negatives explicitly chosen for
  GTM-vocabulary overlap while being non-GTM functions (GTM Recruiter 7942216,
  Engineering Manager Sales Systems 7525370, Strategy & Ops Lead Deal Pricing
  8044391).

## Pattern design (authorized AFTER freeze only)

- Allowed: declarative `MarketPatternDefinition`s only (see `market-knowledge.ts`),
  matched against **`raw.description`** — NOT title. Title vocabulary is only a
  subfamily-stratification cue; the recognizer fires on `extractMarketRequirements`
  output built from descriptions.
- Forbidden: rules keyed on `externalId`, company, Stripe-specific boilerplate;
  changes to parsers, ports, schemas, protocol, thresholds; any edit to K1–K6C.
- Discriminativity rule (U1 lesson): every matcher in ΔK_GTM² MUST be verifiable
  as discriminative of GTM function against the non-GTM population (freshNonGtm)
  BEFORE the delta is frozen — a matcher firing on ≥1 non-GTM job is inadmissible
  regardless of how well it covers Discovery.
- Matchers MUST be description-robust: they must match the concept as expressed in
  full JD prose, not regex literals lifted from titles.

## Metrics

All computed over `raw.description` recognition of a `MarketPatternDefinition`.

- RecoveryGain: (coverage on Discovery with delta) − (coverage on Discovery without delta).
- HoldoutTransfer: coverage gain measured on VirginHoldout (never shown during authoring).
- ControlContamination: number of Controls (of 14) matched by the delta.

## Promotion criteria (preregistered)

Promote ΔK_GTM² iff ALL of:

1. RecoveryGain > 0
2. HoldoutTransfer > 0
3. ControlContamination = 0
4. Discriminativity: every matcher fires on 0 non-GTM jobs in `freshNonGtm`
   (verified before freeze)

Note: any strengthening of these must be committed BEFORE measuring, not after.

## Freeze record

The commit that introduces `u2-split-final.json` + `validate-u2-split.mjs` +
this spec IS the experimental freeze. Its SHA is the freeze identity; it is
recorded here in a subsequent administrative commit (a commit cannot reference
its own SHA).

- Split freeze commit SHA: (pending)
- ΔK freeze commit SHA: (pending) — delta-gtm2.json
- Status: DRAFT — not frozen
- Discovery inspection permitted: only after the freeze commit lands
- Sealed until ΔK is authored: VirginHoldout (9), Controls (14)

## Operational rule during induction

While authoring ΔK, no tool/report may print titles, descriptions, scores, or any
result touching VirginHoldout or Controls. Not "we promise not to look": the
workflow must make accidental observation structurally difficult. Discovery (19) is
the only dataset opened during induction.
