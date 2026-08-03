# Product Decisions

Product decisions record the observations and reasoning behind Provena's direction. They are not technical ADRs — they capture why the product evolved as it did.

Each entry links to a real event (the trigger), the friction observed, and the decision taken.

---

## PD-001

**Date:** 2026-07-29

**Observation:** Recruiters repeatedly asked for an up-to-date CV. Each time, the response required hours of reconstructing recent work from Git, Jira, performance reviews, memory, and old CVs.

**Decision:** The product optimizes for eliminating reconstruction before adding new projections. Every feature must be traceable to a real friction event.

**Evidence:** Personal dogfooding — multiple occurrences over several years. Confirmed in conversation: the most expensive part is never writing the PDF, it is reconstructing what happened.

**Consequence:** The roadmap is reordered. Capture comes before automation. Projections are outputs, not the product. The canonical profile is infrastructure, not the goal.

---

## PD-002

**Date:** 2026-07-30

**Observation:** The first real profile render revealed 70+ skills rendered flat across all formats. Duplicates, unrelated items, and mixed-language skills diluted the signal. Each experience should be defined by a handful of capabilities, not a dump of every technology ever touched.

**Decision:** Each experience must highlight at most five capabilities that represent its essence. The model can store more, but projections select the most representative ones. This is an editorial rule, not a structural constraint — the `capabilityIds` field already supports it.

**Evidence:** Dogfooding — the first real profile render showed the full skill list was overwhelming. The LinkedIn projection (limited to top 10) was far more readable.

**Consequence:** No model change needed. The limit is enforced at projection time. This reinforces the principle that the model stores knowledge and projections tell a story.

---

## PD-003

**Date:** 2026-07-30

**Observation:** The LinkedIn import produced a usable skeleton but left corrupted dates, empty achievements, garbled education, broken publications, and 70+ flat skills. The canonical profile only became valid after walking through each experience conversationally and reconstructing the narrative from memory.

**Decision:** Imported data is a draft, not the profile. An import should produce an editable first version that users refine through conversation and iteration. The canonical profile is created during that refinement, not during the import itself.

**Evidence:** Dogfooding — the complete profile build from LinkedIn import through conversational reconstruction took one session. The import saved ~80% of data entry time but the remaining 20% (narrative, achievements, context) was where the profile became valuable.

**Consequence:** Importers don't need to be perfect. They need to minimize the starting friction. The product's value is in the refinement workflow, not in the import accuracy.

---

## PD-004

**Date:** 2026-07-30

**Observation:** The process for deciding what to build was too heavy — hypotheses, preregistrations, formal validation cycles, and experimental framing. This risks turning Provena into a research project rather than a product. The methodology itself was introducing friction into product design, contradicting the product's own goal of reducing work.

**Decision:** Replace the experimental methodology with a single friction-driven loop:

**Friction → Change → Result**

1. _I am annoyed that I have to do X._
2. _Can I reduce this with a small change?_
3. _Build it._
4. _Use it for a few days._
5. _Does it actually take less effort now?_

The single rule for iteration planning: each iteration must eliminate or significantly reduce a repetitive task that is still done manually.

The backlog is frictions, not features. Prioritization answers one question: _Does this reduce a friction I experience recurrently?_ If yes, go ahead. If "it would be nice...", probably not.

**Evidence:** During the first product cycle, zero features were built and the methodology consumed more prose than the product itself. The experimental framing produced elaborate planning but no reduction in user friction.

**Consequence:**

- Language changes: hypothesis → friction, experiment → change, validation → result.
- The roadmap is rebuilt as a list of frictions rather than features.
- Every iteration starts with a real friction and ends with a measurable reduction in manual work.
- The recruiter benefit is treated as a side effect of a better representation, not a design target. Optimizing for recruiters would lead to scope drift (CRM, messaging, pipelines).

---

## PD-005

**Date:** 2026-07-30

**Observation:** After building the canonical profile and the Recruiter Brief projection, the bottleneck is no longer about the model or the projections — it is about whether the user can sustain the profile over time. The current interaction model (open terminal, edit YAML, commit, render) requires context switching out of flow. The distance between "something happened" and "it is captured" is too large. The architecture was:

```
Profile → Decision Context → Projection → Renderer
```

But it is missing a prior layer:

```
User experience → Capture/Edit → Profile → Decision Context → Projection → Renderer
```

The model can be perfect, but if input is costly, knowledge never reaches the model.

**Decision:** Usability is not a feature. It is the condition for the product to exist. Before expanding the model or adding new projections, Provena must guarantee that maintaining existing information has sufficiently low friction.

**Evidence:** The Recruiter Brief vertical slice was built in one session. But for it to remain useful weeks from now, the profile must be kept alive. The capture friction (DF-001, DF-003) is the actual bottleneck. Dogfooding showed that terminal → YAML → commit is too heavy for daily use.

**Consequence:**

- Architecture gains a prior layer: User Experience → Capture → Profile → Decision → Projection → Renderer.
- All work on new model fields or projections is deferred until the personal usage loop (CARD-002) is validated.
- Criterion: if updating Provena costs more than not updating it, the system loses value. Every domain improvement must be accompanied by a viable usage experience.
- The product is designed around three moments of use:
  - **A — Just happened** (20 seconds available): capture a fact.
  - **B — Quiet time** (15 minutes available): review what accumulated.
  - **C — Need to communicate** (2 minutes available): generate a projection.
  - If Provena works in these three moments, the rest makes sense. If it fails here, the architecture becomes a library of abandoned information.

## PD-006

**Date:** 2026-07-31

**Observation:** The Timeline is a projection of a professional profile with two audiences: the user and the market. The technology market is predominantly English-speaking. The profile already lives in the canonical model; the Timeline was rendered in Spanish because the author's language is Spanish, not because the audience required it.

**Decision:** English-first. Language belongs to the projection, not to the data. A single canonical profile produces projections in whatever language the audience needs. Localization is added only when there is demonstrated user value:

> English-first. Localization only when there is demonstrated user value.

**Evidence:** The Timeline redesign (CARD-002C) — translating the UI to English required no model change, only a projection change. Confirms language is a presentation concern.

**Consequence:** The UI and all future projections default to English. Spanish is a possible future projection, not an MVP concern. The canonical profile remains language-neutral.

## PD-007

**Date:** 2026-07-31

**Observation:** The product evolution is now a chain: Canonical Identity → Timeline (Who am I?) → Habit (Do I come back?) → Career Compass L1 (How am I doing? / What's next?) → L2 (How does the market see me?) → L3 (What decision should I make?). Each stage must not skip the habit. Every feature should answer a question the user is already asking when they open Provena.

**Decision:** Every new capability must answer a question the user is already asking when opening Provena.

**Evidence:** The Timeline answers "Who am I?" (confirmed). "How am I doing?" is next. "What's next?" after that. Features that answer no user question are not introduced.

**Consequence:** Success is no longer "having a complete profile". It is:

> After using Provena, the user has more clarity about their next professional step than before opening it.

## PD-008

**Date:** 2026-08-03

**Observation:** As soon as a second screen existed (`/cv`), the Home started
creating ad-hoc navigation: a "Prepare CV" hero button, then a "← Home" back
link. Three different patterns for the same action. And the preview interaction
was redundant: the CV rendered below but was still triggered by a `Preview CV`
button.

**Decision:** Two permanent rules.

1. **The menu changes section; buttons perform actions.** No button ever
   navigates between sections. That removes, up front, the class of futute
   "Go to Career" / "Back to Story" buttons. Navigation is one shared
   component (`siteNav(section)`); buttons in a section start the section's
   actions (Download .md, Open HTML / Print PDF, Continue this story).
2. **A preview that is already visible is not an action.** If the output
   renders live, the control that "updates" it is redundant. So it updates
   automatically on any context change and the action button becomes a
   passive heading (`Your CV`).

**Evidence:** The compressed shell and the redundant `Preview CV` button were
the two visible frictions after deployment. Both were fixed without touching
domain architecture or projection logic.

**Consequence:** Navigation stays honest: only `Story | Prepare` render
(Career is reserved until it has its own entity). The next cycle is usage —
dogfooding Story + Compass + Prepare with real profiles to observe where
interpretation/projection breaks, before calibrating Compass thresholds or
building `careerHint`. No new functionality opens now.

---
