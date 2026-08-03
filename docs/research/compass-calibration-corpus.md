# Compass Calibration Corpus (Research Design)

Date: 2026-08-03
Status: Design — no code changes yet. The next cycle is usage, not building.

## Problem

Compass needs calibration, and `careerHint` may need building. Both require a
dataset. The tempting source — scraping LinkedIn profiles — is the wrong one,
twice over:

1. **Policy**: LinkedIn's User Agreement and API terms prohibit scraping,
   crawlers, and automated copying of profiles; approved APIs restrict use of
   content obtained outside them. An official LinkedIn integration is a *later
   distribution/import mechanism*, not a research one.
2. **Signal**: The thing to learn is not what professional profiles look like.
   It is **where Provena's interpretation diverges from the professional's own
   understanding of their career**. Scraped profiles give profiles, not that
   divergence.

## The dataset is divergence, not profiles

The useful signal is the difference between **what Provena inferred** and
**what a human says is wrong or missing**:

```
Participant
  → exports their LinkedIn data
  → imports it into Provena
  → Profile
  → Compass assessment
  → participant corrects / enriches it
  → Profile + assessment + corrections
```

A structured correction record:

```yaml
profile:
  target_role: Staff Software Engineer
  experiences: [...]
  capabilities: [...]

compass:
  readiness: ready
  strengths:
    - Java
    - Spring Boot
  evidence_gaps:
    - VINCLE

feedback:
  readiness:
    expected: ready
    accepted: true

  strengths:
    missing:
      - Software Architecture
      - Developer Productivity

  evidence_gap:
    useful: false
    reason: "Old experience, no longer relevant"
```

## Provena collects it itself

An experimental in-product path:

```
Import your LinkedIn
  → See your Story
  → Compass
  → "Is this accurate?"   Yes / Not quite
                              ↓
                         correction
```

Anonymized research record stored **only with explicit opt-in**:

```
profile features
+ Compass output
+ human correction
```

Names, emails, URLs, company names never enter the corpus.

## Scale

| Sample | What emerges |
|--------|--------------|
| ~10    | Qualitative calibration |
| 30–50  | Patterns start appearing |
| 100+   | Rules can be evaluated quantitatively |

Immediate experiment: **10 real professionals × their own LinkedIn export ×
Compass × structured correction.**

## Why this beats scraping

```
scraped LinkedIn     →  nothing   → ground truth?   no
participant export   →  Provena inference → human judgment → ground-truth signal
```

It directly tests the v0.5.0 hypothesis: **does Compass correctly understand a
professional from the evidence they actually have?**