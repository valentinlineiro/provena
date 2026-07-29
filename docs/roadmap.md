# Product Roadmap

Every epic exists because of a real friction event. No item enters this roadmap without an entry in `docs/dogfooding.md` or a decision in `docs/product-decisions.md`.

## Epic 1 — My professional profile exists

**Goal:** Stop depending on memory to respond to an opportunity.

**Origin:** Dogfooding — recruiter requested CV, had to reconstruct years of work.

### P1.1 — Build my canonical profile

**Problem:** No complete, up-to-date profile exists.

**Deliverable:** A real workspace containing all experience, relevant projects, capabilities, and evidence where available.

**Definition of done:** Can generate a complete CV without manual post-editing.

### P1.2 — Generate first real CV

Not the demo profile. My CV.

**Validation:** Send that CV to a real recruiter.

### P1.3 — Regeneration

Modify one data point. Regenerate all projections. Verify consistency.

---

## Epic 2 — Never rebuild again

**Goal:** When an opportunity arrives, the profile already exists.

**Origin:** Repeated dogfooding — reconstruction from Git, Jira, memory, old CVs.

### P2.1 — Friction journal

No code. For several weeks, record only:

```
Event
Friction
Time lost
What I missed
```

This feeds the roadmap.

### P2.2 — Classify frictions

Group by pattern (capture, reconstruction, search, adaptation, presentation).

### P2.3 — Find the dominant bottleneck

Build the one thing that costs the most time.

---

## Epic 3 — Capture

**Goal:** Reduce the cost of recording professional achievements.

**Origin:** Only if Epic 2 justifies it.

### P3.1 — Design minimal capture

Do not implement yet. Answer: what would have to happen for me to capture an achievement immediately after finishing a project?

### P3.2 — Manual experiment

Before writing code. For two weeks: open a note, write one line. Measure: do I actually do it?

### P3.3 — Implement minimal capture

Only if P3.2 works. No AI. No classification. Just record.

---

## Epic 4 — Transform captures

When enough captures exist. Convert notes, link evidence, associate experiences, enrich the model.

---

## Epic 5 — Automate

Only when the manual workflow works. AI, importers, suggestions, sync.

---

## Epic 6 — Export

Find people similar to me (Staff Engineers, Tech Leads, senior freelancers). Ask: does your flow look like mine?

---

## Immediate backlog

| Priority | Task | Expected outcome |
|----------|------|------------------|
| P0 | Complete my real canonical profile | Provena represents my full career |
| P0 | Generate and send my next CV with Provena | Validation in a real scenario |
| P0 | Start `docs/dogfooding.md` | Evidence base for future decisions |
| P1 | Log all frictions for 30 days | Discover the biggest bottleneck |
| P1 | Review journal and group patterns | Identify the next capability to build |
| P2 | Design a manual capture experiment | Validate the habit before the code |

---

## DOG-001 — Live from Provena

**Goal:** From today, every change to my professional profile happens exclusively in Provena.

Examples:
- Add a project → Provena.
- Change LinkedIn About → first Provena, then render.
- Update CV → never edit the PDF; regenerate the projection.
- Change an experience description → only in the model.

**Success criterion:** For several months, no direct editing of any derived artifact (CV, Markdown, HTML, reusable text). Every change originates in the canonical profile.
