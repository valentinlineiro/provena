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
