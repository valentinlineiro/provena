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
