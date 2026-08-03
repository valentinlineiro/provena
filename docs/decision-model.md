# Decision Model

## Motivation

A professional profile is not consumed in isolation.

Every interaction with a profile exists because someone needs to make a decision.

Traditional CVs and professional profiles optimise for completeness.

Provena optimises for decision support.

The canonical profile remains immutable.

Different decisions require different subsets of that knowledge.

---

## Core Principle

Profile contains facts.

Decision defines intent.

Projection communicates only the knowledge required for that intent.

```
Profile
    ↓
Decision Context
    ↓
Projection
    ↓
Renderer
```

**Decisions do not belong to the user. They belong to the consumer of the information.** The canonical profile describes who you are. The decision context describes what the consumer needs to know. Identity never adapts — the lens through which it is observed changes.

---

## Decision Contexts

### Recruiter

**Decision:** Should I contact this professional?

**Needs:**
- seniority
- focus
- opportunity criteria
- strongest evidence
- constraints

**Avoid:**
- exhaustive chronological detail

---

### Hiring Manager

**Decision:** Can this person solve our problems?

**Needs:**
- evidence
- impact
- architecture
- ownership
- leadership

---

### Conference

**Decision:** Is this person a credible speaker?

**Needs:**
- expertise
- publications
- talks
- projects

---

### Self

**Decision:** Should I apply for this opportunity?

**Needs:**
- alignment
- missing evidence
- reusable material

---

## CV Projection Policy

The CV is the first projection with a concrete selection policy. It is concrete
politics that operate during Projection — never in the renderer, never on the
Profile.

> **P0 — A CV is evidence selected for a purpose, not a representation of the whole profile.**

This sentence defines almost every rule below.

### Relevance determines space

The space given to an experience follows its relevance to the target, not how
much content exists in the Profile. Initial heuristic (deterministic, no formal
scoring):

```text
relevance =
  targetAlignment
  × evidenceStrength
  × recency

high   → 3–4 bullets
medium → 2–3 bullets
low    → 1–2 bullets
```

### Evidence over claim

When two items express approximately the same capability, keep the one with
the most concrete evidence:

```text
measured outcome
> externally validated outcome
> shipped/adopted artifact
> owned responsibility
> demonstrated capability
> generic claim
```

### No semantic repetition

An idea appears once, unless repeating it adds distinct evidence. This removes
the redundancy of `summary → highlights → experience → bullet → skills` all
saying the same thing.

### Recency and relevance govern detail

Recent experiences get more space by default, but an older highly relevant
experience may override the default. Relevance beats recency, not the reverse.

### Select before compress

Do not summarise twenty items to make them fit. First select the relevant
items, deduplicate, then compress:

```text
candidate evidence → rank → select → dedupe → compress
```

### Explicit global budget

A projection carries an explicit budget. The budget forces selection — that is
a feature. The Profile holds the whole history; the CV does not have all of it.

```yaml
cv:
  maxPages: 2
  maxExperienceBullets: 15
  maxBulletsPerExperience: 4
  maxCoreExpertise: 5
  maxTechnologies: 8
  maxCertifications: 6
```

### What stays out of scope

The CV policy bounds how much is shown; it does not yet define a general
Decision Model. Generalised, cross-projection ranking/scoring and any AI-based
selection remain future work.

---

## Architectural consequence

Current code organises projections by format:

```
renderRecruiter(profile)
renderCV(profile)
renderLinkedIn(profile)
```

The decision model reorganises them by context:

```
render(profile, decisionContext)
```

This decouples the domain from any specific projection. If a new consumer appears in the future (internal promotion system, academic application, a platform that doesn't exist yet), there is no need to create a new profile type. The only question to answer is: _What decision is this consumer trying to make?_
