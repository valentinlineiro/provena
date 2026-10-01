# Opportunity → Application

## Goal
The Inbox can represent the path Opportunity → Application without inventing a relation. Applying creates/links an `Application`; it never just flips a flag.

## Stage model
Stage is **derived**, never stored. Inputs: `{ assessed: boolean, decision, application? }`.

Precedence (first match wins):

| # | Condition | Stage |
|---|-----------|-------|
| 1 | application.status in `applied, interviewing, offer` | `applied` |
| 2 | application.status = `ready` | `decided` |
| 3 | application.status in `rejected, withdrawn, ghosted, closed` | `closed` |
| 4 | decision = `dismissed` | `dismissed` |
| 5 | decision = `interested` | `considered` |
| 6 | assessment exists | `evaluated` |
| 7 | otherwise | `new` |

`applied`/`decided`/`closed` derive from the Application; `dismissed`/`considered` from the decision.
`OpportunityUserDecision` becomes `new | seen | interested | dismissed` (`'applied'` removed).

## Core (`packages/core`)
- `deriveOpportunityStage(state)` — single owner of the table above.
- `decideToApply(state, input)` — resolves `assessment + decision + existing application` through `deriveOpportunityStage`; no other path creates an Application from an Opportunity.
  - stage `evaluated` | `considered` → returns new `Application{status:'ready', opportunityId}`.
  - stage `decided` | `applied` → returns the **existing** Application, creates nothing.
  - stage `closed` → throws conflict (an Application already exists for this opportunity; idempotence must not hide that).
  - stage `dismissed` | `new` → throws (not decidable).
- `markApplied(app)` — `transitionApplication(app,'applied')` + sets `appliedAt`; only valid from `ready`.
- `createApplication` gains optional `status` (default `applied`, unchanged).
- Invariant (domain rule): at most one Application per `opportunityId`. Storage guarantee: sequential only — the KV blob is read-modify-write, so concurrent decides can race. Accepted debt while single-user (`ponytail:` comment in `KvApplicationRepository.save`); fix with versioned CAS if that changes.
- `Application.appliedAt` is unset while `ready` and stamped by `markApplied`; no `decidedAt` until a need appears.
- `ApplicationRepository` gains `findByOpportunityId`.

## Persistence
- KV `applications` blob reused; no new store.
- Postgres decision repo rejects `'applied'`.
- **Backfill: measured 2026-10-01 — none required.** Neon `user_opportunity_decisions`: 0 rows; KV `applications` key absent. KV `opportunities_memory` holds 2 stale `applied` decisions (Stripe SA roles, `updatedAt` ~600ms apart, scripted-looking); production reads decisions from Postgres, so they are inert residue and left untouched.
- Original plan (superseded by the measurement above): **measure first.** Query prod for `user_decision='applied'`.
  - 0 rows → no migration.
  - N rows → one-off script, only after checking decision timestamp exists and no matching Application exists (re-run safe: skip when `findByOpportunityId` hits).

## Web (`packages/provena-web`)
- `POST /api/opportunities/decide` → `decideToApply`.
- `Mark applied` → existing `POST /api/applications/update` backed by `markApplied`.
- Inbox shows stage; `Decide to apply` for `evaluated|considered`, `Mark applied` only for `decided`. Old `✓ Apply` removed.

## Tests
- Core: `shouldXWhenY` per table row and per `decideToApply` branch (incl. idempotent return, `closed` conflict, dismissed rejection), `markApplied` from non-`ready` rejects.
- E2E (CI): seed → evaluated → considered → decided (Application `ready`) → applied (visible in `/applications`); negative: `Mark applied` absent before `decided`.

## Out of scope
`assessPreferences(PreferenceSet)` (next slice).
