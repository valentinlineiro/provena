# Adoption Experiment v1

Pre-registered hypotheses and protocol for the first user-testing cycle.
No code changes until all 5 sessions are complete.

## Hypotheses

### H1 — Canonical model
Professionals will maintain a canonical identity model if the maintenance
cost is low enough.

**Success:** ≥3/5 return within 7 days unprompted, add information, and
regenerate at least one projection.

### H2 — Continuous capture
Professionals will capture achievements immediately after they occur if the
capture cost is near zero.

**Success:** ≥3/5 say they would use an immediate-capture mechanism in a
real scenario. The main objection is no longer "I'll do it later."

### H0 — Null hypothesis
The core problem is not the tool. People do not want to maintain any
professional record continuously.

## Protocol (30-40 min per session)

### A — Pain (no Provena yet)
- Where do you keep your achievements?
- What happened the last time you updated your CV?
- What information have you lost?

### B — Product
- Show `provena demo`. Observe reaction. Do not explain architecture.
- Let them run `provena init` with their own data.
- Observe without intervening.

### C — Capture scenario
After they see the model and outputs:

> "You just finished a major migration. Imagine this existed:
> `provena log 'Reduced cost 35% on X migration'`
> What would you do?"

Do not ask "Do you like it?" Ask "What would you do?" and wait through
the silence.

## Results matrix

| User | Pain | Completes init | Would return | Would use capture | Notes |
|------|------|---------------|-------------|-------------------|-------|
| 1    |      |               |             |                   |       |
| 2    |      |               |             |                   |       |
| 3    |      |               |             |                   |       |
| 4    |      |               |             |                   |       |
| 5    |      |               |             |                   |       |

## Decision scenarios

| H1 | H2 | Outcome |
|----|----|---------|
| Strong | Weak | Continue as canonical identity |
| Weak | Strong | Product starts at capture, identity is consequence |
| Strong | Strong | Capture feeds model naturally |
| Weak | Weak | Market hypothesis invalid — rethink before building more |

## Status

**Frozen.** No code changes until all 5 sessions are complete and the
matrix is filled.
