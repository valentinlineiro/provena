# Use Cases

Provena provides a continuous attention platform built around four core capabilities.

---

## 1. Continuous Market Observation

Connect your market sources once (`/sources`). Provena continuously watches new opportunities in the background across Greenhouse, Ashby, Lever, and public job boards.

```text
Identity  ──►  Market Sources  ──►  Continuous Observation  ──►  Shared Market Catalog
```

- **No more repeated searching**: Stop checking job boards daily.
- **Deduplicated market memory**: Postings are assigned cryptographic deduplication keys so you never evaluate the same role twice.
- **Background sync**: Automated Cloudflare Worker cron jobs observe market streams continuously without human intervention.

---

## 2. Attention Inbox & Deterministic Assessment

Every observed opportunity is evaluated deterministically against your canonical identity before reaching you.

```text
Professional Fit
Personal Fit
Recognition Coverage
        │
        ▼
Needs Attention  ·  Worth Considering  ·  Unresolved  ·  Decided
```

- **Review only what matters**: Your Attention Inbox (`/opportunities`) filters out market noise automatically into semantic tabs.
- **Falsifiable evaluations**: Inspect exact capability matches, evidence coverage, and confidence scores for every recommendation.
- **Decision recording**: Mark positions as `Interested`, `Applied`, or `Dismissed` to update your attention state immutably.

---

## 3. Career Knowledge & Timeline

Your professional identity evolves as structured knowledge, serving every market evaluation and career decision.

```text
Facts & Evidence  ──►  Canonical Profile  ──►  Career Compass & Market Readiness
```

- **Capture once**: Log achievements, milestones, and evidence as they happen (`/`).
- **Referential integrity**: Capabilities explicitly reference real work evidence — claims are backed by proof, never unverified buzzwords.
- **Career Compass**: Continuously check your positioning and identify evidence gaps before targeting new roles.

---

## 4. Identity Projections

Generate consistent professional documents from the same canonical identity source.

```text
Canonical Identity Model
        │
        ├──► Web & PDF CV (`/cv` or `resume.html`)
        ├──► Markdown Resume (`resume.md`)
        ├──► JSON Resume (`resume.json`)
        └──► LinkedIn Profile Brief (`resume.markdown`)
```

- **Single source of truth**: Update an achievement once. Every projection reflects it instantly without formatting drift.
- **Web & CLI support**: Render projections directly in the web application or locally via `provena render`.

---

## Scenario Summary

```text
Continuous Market Observation
─────────────────────────────
Connect once. Provena observes market feeds, deduplicates postings, and maintains your catalog.

        ↓

Attention Inbox & Assessment
────────────────────────────
Every posting is evaluated deterministically. Only postings that deserve attention interrupt you.

        ↓

Career Knowledge
────────────────
Your professional identity evolves as a single canonical model, supporting every evaluation.

        ↓

Identity Projections
────────────────────
Generate résumés, LinkedIn briefs, or JSON Resume exports from the same canonical facts.
```

---

## Core Value Proposition

> **Traditional job platforms optimize for engagement.**
>
> **Provena optimizes for preserved attention.**
>
> **Helping to look less.**
