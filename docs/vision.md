# Provena — Product Vision

## Purpose

Provena exists to eliminate the manual reconstruction of professional identity.

The friction is not writing. The friction is rebuilding — every time you change jobs, update a CV, talk to a recruiter, or prepare a presentation, you reconstruct the same knowledge from memory and reshape it for a new context.

Provena preserves, structures, and adapts professional knowledge so that it never needs to be reconstructed again. Projections (CV, LinkedIn, portfolios) are not the product. They are ways to reuse that knowledge without repeating the work.

## Product Principles

> Every feature must eliminate a real friction that has already happened.

Ideas do not enter the roadmap.

Events do.

Every new capability must be traceable to a concrete situation where the current workflow failed.

### Dogfooding precedes validation

> Dogfooding precedes validation. Validation precedes generalization.

First I use it. Then I verify it works. Only then do I ask if it serves others.

This prevents building for an imaginary user. The product evolves by solving real frictions in the creator's own workflow. External validation only happens after the tool is habit-forming for its first user.

### Ubiquity without complexity

Professional knowledge must be capturable, queryable, and curatable from any device without introducing infrastructure that increases the system's own friction. The solution to one friction must not create ten new ones.

This principle emerged from DF-001: the need to capture achievement away from the computer. The correct solution could take many forms (CLI, chat bot, web app, email) — the principle constrains the design, not the implementation.

## Product Vision

Professional knowledge naturally decays over time.

Projects finish.

Achievements are forgotten.

Trade-offs disappear.

Metrics become estimates.

Opportunities arrive unexpectedly.

When that happens, professionals spend hours reconstructing their own history from memory, Git, Jira, performance reviews, emails and old CVs.

Provena exists so that reconstruction is no longer necessary.

## Long-term Vision

```
Daily work
      ↓
Capture
      ↓
Professional memory
      ↓
Canonical profile
      ↓
Context-specific projections
```

The canonical profile is not the destination.

It is the infrastructure that allows every projection to exist.

The real product is preserving professional memory while it is still fresh.

## Product Objectives

### Objective 1

Never reconstruct a professional history from memory again.

**Success looks like:** When a recruiter asks for a CV, the profile already exists. The response is generating a projection, not rebuilding years of work.

### Objective 2

Reduce the cost of recording professional achievements.

Capturing an achievement should require significantly less effort than reconstructing it months later. The ideal workflow integrates naturally into everyday work instead of becoming an administrative task.

### Objective 3

Maintain one source of truth.

Professional information should only be updated once. Every other representation is generated from that source.

### Objective 4

Generate professional artifacts on demand.

CV, LinkedIn, portfolio, future formats — these are outputs, not the product itself.

## Roadmap Phases

### Phase 0 — Foundation

Build a stable canonical model.

**Status:** Complete.

### Phase 1 — Eliminate reconstruction

**Primary question:** Can I respond to a professional opportunity without rebuilding my history?

### Phase 2 — Continuous capture

**Primary question:** Can I record meaningful professional information at the moment it happens?

This phase validates whether capture becomes a natural habit.

### Phase 3 — Structured knowledge

Transform captured information into structured professional knowledge. The model becomes richer because work has already been captured, not because users filled forms.

### Phase 4 — Intelligent projections

Generate different professional representations for different contexts without duplicating information.

### Phase 5 — Automation

Only after manual workflows become habitual. Automation should amplify an already successful workflow. It should never compensate for a workflow people do not use.

## Decision Framework

Every proposed feature must answer four questions:

1. **What real event triggered this?**
2. **What friction occurred?**
3. **What is the smallest intervention that removes this friction?**
4. **How will success be measured?**

If success cannot be measured, the feature is not ready.

## Explicit Non-Goals

Until evidence suggests otherwise, Provena will not optimize for:

- More output formats without demand.
- Additional domain abstractions without a concrete use case.
- Automation that replaces an unvalidated manual workflow.
- Artificial intelligence added only because it is technically possible.
- Interfaces built before the underlying workflow proves valuable.

## Success Definition

Provena succeeds when professional opportunities no longer begin with reconstruction.

Instead, they begin with projection.

The professional history already exists. The only remaining task is deciding how to present it.

## Working Motto

> Preserve the work when it happens.
> Project it when it is needed.
> Never rebuild it again.

## Design Principle

Every Provena feature must eliminate a repetitive reconstruction of professional knowledge. If a proposal does not remove a reconstruction that happens recurrently, it does not belong in the product core.

This principle emerged from observing the common pattern across all dogfooding frictions: capture (reconstructing forgotten work), formalization (reconstructing narrative from facts), and communication (reconstructing career context for each interlocutor).

### Evaluating projections

A projection is not valuable because it is a new format. It is valuable because it eliminates a repetitive conversation. Ask: "What repetitive conversation does this artifact remove?" If a recruiter brief eliminates 15 minutes of introductory Q&A, it is more valuable than a new CV template. If a hiring brief lets a technical manager filter before the first call, it eliminates a filtering conversation that would otherwise happen every time.

## Domain observations

Observations about how professional knowledge behaves. These are not features — they are discoveries that inform future design. They must be validated by repeated dogfooding before becoming the basis for implementation.

### Professional knowledge is not born structured

There is an intermediate state between a lived event and the canonical profile. A fact exists as memory before it becomes a structured entry. The current model does not represent this state explicitly — it assumes knowledge lands directly in the profile.

This emerged from the first dogfooding cycle (2026-07-30): the best profile data came from conversational reconstruction, not from forms. The model treated capture and curation as one step; the dogfooding revealed they are two distinct phases with different cognitive costs.

**Implication for future design:** if repeated observation confirms the gap between event and profile, the model may need a lightweight intermediate entity that preserves memory without requiring immediate structure. Not building yet — observing whether DF-001 confirms this pattern.

### Professional knowledge lives in relationships

The value is not in storing facts — it is in preserving how they connect. A migration demonstrates architecture. An achievement happens within an experience. A technology appears across multiple contexts. A capability is backed by specific evidence.

When relationships exist, a projection becomes a query over connected knowledge rather than a template with fields. This explains why forms fail during capture and conversation succeeds — forms request isolated attributes, while conversation surfaces relationships of cause, context, impact, and evolution.

**Implication for future design:** the serialization format (today YAML) is not part of the value proposition. The value is in the connected model. Any valid representation should be derivable from the graph of relationships, not from hand-maintained fields.

### Professional knowledge includes decision criteria

The model currently represents what you have done. It does not represent what you are looking for — the conditions that make an opportunity worth pursuing. This is a distinct class of professional knowledge that determines match quality, not just presentation quality.

**Two loops emerged from dogfooding:**
1. **Knowledge loop**: capture, organize, and maintain trajectory (avoids reconstructing the past).
2. **Alignment loop**: communicate trajectory and criteria so that resulting interactions are higher quality (avoids wasting time on futures that were never going to fit).

Both serve the same principle: reduce unnecessary work around professional career management. Not building yet — observing whether the alignment loop appears as a recurrent friction.

### Projections are organized by decision, not by format

The original model:

```
Profile → Projection → Renderer
```

Assumes projections are format variants (CV, LinkedIn, HTML, Markdown). This treats them as templates — the same information, different layout.

Dogfooding revealed that what actually changes across consumers is not the format but **what decision they are trying to make**. A recruiter deciding whether to contact needs different information than a hiring manager deciding whether to interview. The format is secondary.

The corrected model:

```
Profile → Decision → Projection → Renderer
```

Every consumer of professional knowledge is answering a question:

| Consumer | Decision |
|----------|----------|
| Recruiter | Should I contact this person? |
| Hiring manager | Can they solve our problems? |
| Conference | Are they the right person to speak on this topic? |
| Future self | Did this opportunity fit? |

A projection is a view optimized for a specific decision. The decision determines what facts are relevant, what is emphasized, and what is omitted. The renderer is just the final format layer.

**Architectural implication:** The domain does not need separate projection types per audience (RecruiterProjection, StaffProjection, ConferenceProjection). It needs a decision model that selects and prioritizes profile data based on the decision being made.

**Durability insight:** Decisions are more stable than channels. LinkedIn may not exist in 5 years, but the need for a recruiter to decide whether to contact will. Designing around decisions makes the model more durable than designing around current channels.
