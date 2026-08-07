# Getting Started

## Try Provena in 5 Minutes

You don't need to search job boards manually.

Define your professional identity once, connect the market sources you care about, and let Provena continuously evaluate every opportunity against your profile.

In less than five minutes, you will have your own **Attention Inbox**.

---

## 1. Build your professional identity

Start by creating (or importing) your canonical professional identity.

Your identity becomes the single source of truth used for every evaluation.

```text
Professional Identity  ──►  Canonical Model
```

Unlike a résumé or a LinkedIn profile, your identity is not a document. It is structured knowledge about your professional experience, capabilities, and evidence.

---

## 2. Connect market sources

Choose the job boards and market streams you want Provena to observe:

- Stripe (`stripe` on Greenhouse)
- OpenAI (`openai` on Greenhouse)
- Anthropic (`anthropic` on Ashby)
- Linear (`linear` on Lever)

Once connected, Provena continuously synchronizes new opportunities.

```text
Sources  ──►  Market Catalog
```

No manual searching required.

---

## 3. Review your Attention Inbox

Every observed opportunity is evaluated deterministically against your identity.

The Inbox only surfaces opportunities that deserve your attention into semantic tabs:

```text
Needs Attention      (High confidence & high professional/personal fit)

Worth Considering    (Moderate fit worth reviewing)

Unresolved          (Newly ingested postings awaiting evaluation)

Decided             (Items marked Interested, Applied, or Dismissed)
```

Everything else stays in the market catalog.

---

## 4. Understand why

Every recommendation is explainable and falsifiable. For every opportunity, you can inspect:

- **Professional Fit**: Coverage of technical capabilities and evidence requirements.
- **Personal Fit**: Alignment with work preferences and constraints.
- **Confidence**: Data sufficiency score.
- **Supporting Evidence**: Direct links back to canonical profile facts.

No opaque AI ranking. No black-box scoring.

---

## What Just Happened?

```text
Professional Identity
        │
        ▼
Market Sources
        │
        ▼
Continuous Observation
        │
        ▼
Deterministic Assessment
        │
        ▼
Attention Inbox
        │
        ▼
Helping to look less
```

Instead of searching repeatedly, Provena continuously watches the market and only interrupts you when something deserves your attention.

---

## Optional: Use the CLI

The CLI is available for developers who prefer local, file-based workflows.

Typical uses include:

- **Validating a workspace**:
  ```bash
  provena validate .
  ```

- **Rendering identity projections**:
  ```bash
  provena render . --format markdown
  ```

- **Exporting JSON Resume**:
  ```bash
  provena render . --format jsonresume
  ```

The CLI manages your canonical identity workspace. The web application manages continuous market observation and your Attention Inbox.

---

## Next Steps

- Learn [Why Provena](/why) exists.
- Explore the [Architecture](/architecture).
- View the [Problem](/problem) and [Concept](/concept).
- Check the research [Roadmap](/roadmap).
