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

## Explicitly out of scope (for now)

This document defines the Decision Context — _what decision the consumer wants to make._

It does not define the Decision Model — _how we select information to support that decision._

Specifically out of scope:
- priorities
- weights
- AI
- automatic selection
- ranking
- scoring

Those belong to a later card.

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
