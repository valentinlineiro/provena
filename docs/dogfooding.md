# Dogfooding Log

Every entry in this log is a real event that generated friction in managing my own professional career.

The roadmap does not come from ideas. It comes from this table.

## Log

| Date | Event | Friction | Action | Resolved |
|------|-------|----------|--------|----------|
| 2026-07 | Recruiter requested CV | No up-to-date CV existed — had to reconstruct 2 years of work | Render from canonical profile | ✅ |
| 2026-07-30 | LinkedIn import session | Imported data had truncated dates, summaries, and missing fields | Imported → built real canonical profile with all 5 experiences via conversation | ✅ |
| 2026-07-30 | Product direction conversation | Experimental methodology was heavier than building; model only represents past, not decision criteria | PD-004: friction-driven development; identified alignment loop as distinct from knowledge loop | ✅ |
| 2026-07-30 | Recruiter Brief implementation | Implemented Recruiter Brief as first vertical slice — added preferences model, projector, renderer | Preferences + recuiter projection built into model and CLI | ✅ |
| 2026-07-30 | Personal usage friction | Using Provena (terminal → YAML → commit → render) requires too much overhead for daily use | CARD-002: reduce personal usage friction; minimal capture interaction | 🔄 |



---

## Session Notes — 2026-07-30

### What happened

Built a complete canonical profile from a LinkedIn export + conversational reconstruction. Import gave ~80% of the skeleton; the remaining 20% (narrative, achievements, context) came from walking through each experience conversationally.

### What worked better than expected

- **Conversational reconstruction**: Not a single experience was built by starting with bullets. Every one came from telling the story first, then extracting achievements. This was faster and produced better summaries than any form-based approach.
- **5-capability limit**: Limiting each experience to 5 technologies forced prioritization and made each experience's essence clear.
- **Person summary as portada**: Writing it as "how I solve problems" rather than "what I do" made it survive across all experiences.

### Surprises

- The LinkedIn projection excluded Summa Networks due to a sort bug (comparing corrupted date strings alphabetically vs. chronologically). Fixed in linkedin-projector.ts.
- The career arc "understanding complex systems + reducing friction" only appeared once all 5 experiences were complete — it was invisible in the LinkedIn import.
- Markdown and HTML headers initially showed "I design systems" as the about summary (truncated by the import), making the CV feel hollow until fixed.

### Frictions encountered

1. **Import truncation**: LinkedIn parser lost date precision and summary text. Not blockers for dogfooding, but need fixing before shipping.
2. **Projects have no names**: LinkedIn export doesn't include project names, only descriptions and URLs. Need to backfill manually.
3. **Education garbled**: Degree names became degree descriptions in the import. Need to fix the parser.
4. **Publications broken**: HTML content captured as URLs. Parser needs a rewrite for this section.
5. **Certification dates truncated**: "Apr 202" instead of "Apr 2026". Parser drops the last digit.
6. **70+ flat skills**: Duplicates, Spanish/English, "Recogida de basura". Needs editorial filtering or projection-time cleanup.
7. **knowmad mood start date**: Still TBD — need to recover from contract or LinkedIn profile page.

### Product decisions that emerged naturally

| Decision | Origin |
|----------|--------|
| **PD-002**: Max 5 capabilities per experience | First render showed 70+ skills flat — overwhelming and unhelpful |
| **Summaries before bullets** | All 5 experiences were built by telling the story first, then extracting achievements |
| **Person summary as portada** | "I design systems" was too generic; the final summary describes how you solve problems, not what you do |
| **Import doesn't need to be perfect** | Even with corrupted dates, empty achievements, and garbled education, the import saved 80% of data entry time |
| **LinkedIn projector sorts by end date** | Bug fix: was sorting alphabetically by start date, which excluded current roles with corrupted sibling dates |

### What's next

- Fix knowmad mood start date (TBD → real date)
- Clean up education, publications, certifications (import bugs)
- Give projects real names
- Apply 5-capability editorial rule across all experiences
- Optionally filter the 70-skill flat list in projections

---

## Session Notes — 2026-07-30 (afternoon) — Product direction

### What happened

Extended conversation about Provena's positioning. Three key reframings emerged:

**1. The real problem is not interview optimization — it's preventing wrong conversations from starting.**
The recruiter conversation flow: contact → first call → explain trajectory → explain criteria → discover misalignment. The friction is not the 30 minutes — it's that the conversation never should have happened. This reframes the product target: not "more interviews" but "higher match quality on initial contact."

**2. The model must represent decision criteria, not just experience.**
A recruiter needs to know not just what you've done, but what kind of opportunities you'd accept: modality, responsibility level, salary range, technologies you want to use (or not), company type, problem types you enjoy, dealbreaker conditions. This is a distinct projection — not for getting more interviews, but for making sure the interviews that happen are the right ones.

**3. Two loops emerged.**
- **Knowledge loop**: capture, organize, maintain trajectory (avoids reconstructing the past).
- **Alignment loop**: communicate trajectory and criteria so that resulting interactions are higher quality (avoids wasting time on futures that were never going to fit).
Both serve the same principle: reduce unnecessary work around professional career management.

**4. The recruiter benefit is a side effect.**
A better representation benefits any consumer of that information (recruiter, hiring manager, ATS). But optimizing for recruiters leads to scope drift (CRM, messaging, pipelines). The north star remains: "Does this reduce work for the professional?"

### Frictions observed

1. **Contact misalignment**: Recruiters reach out about roles that don't fit. The current model doesn't represent what the professional is looking for — only what they've done.
2. **Repetitive criteria explanation**: Every first call requires explaining the same dealbreakers (modality, responsibility, salary, stack, etc.).
3. **Implicit vs explicit filters**: Some criteria are never stated but cause process abandonment later (e.g., culture mismatch, decision-making autonomy).

### Product decisions that emerged

| Decision | Origin |
|----------|--------|
| **PD-004**: Friction-driven development replaces experimental methodology | The first cycle produced zero features and consumed more prose than product |
| **Recruiter benefit is side effect, not target** | The product stays focused on the professional's friction; recruiter efficiency follows from better representation |

### Design insights

- The career profile today answers "What have you done?" LinkedIn partially answers "Who are you professionally?" The missing question: "What would an opportunity need to meet for it to be worth talking to you?"
- Projections are not the product — they are communication interfaces. The product is the structured professional knowledge. Every projection exists for a different consumer (ATS, recruiter, hiring manager, conference, portfolio, future self).
- The process methodology should mirror the product goal: minimal friction. Friction → Change → Result. No bureaucracy.
- A Recruiter Brief is the first card because it attacks the most recurrent visible friction and builds the communicative core of the model. It's reusable across most projections. An investment in narrative, not a one-off fix.

### What's next

- Rebuild roadmap as a list of frictions (PD-004 consequence)
- ~~Pick first friction and implement minimal change~~
- ~~CARD-001: Recruiter Brief vertical slice~~ ✅
- CARD-002: Reduce personal usage friction
- Optional: create "looking for" section in the profile model (not building yet — observing if alignment friction repeats)

Built a complete canonical profile from a LinkedIn export + conversational reconstruction. Import gave ~80% of the skeleton; the remaining 20% (narrative, achievements, context) came from walking through each experience conversationally.

### What worked better than expected

- **Conversational reconstruction**: Not a single experience was built by starting with bullets. Every one came from telling the story first, then extracting achievements. This was faster and produced better summaries than any form-based approach.
- **5-capability limit**: Limiting each experience to 5 technologies forced prioritization and made each experience's essence clear.
- **Person summary as portada**: Writing it as "how I solve problems" rather than "what I do" made it survive across all experiences.

### Surprises

- The LinkedIn projection excluded Summa Networks due to a sort bug (comparing corrupted date strings alphabetically vs. chronologically). Fixed in linkedin-projector.ts.
- The career arc "understanding complex systems + reducing friction" only appeared once all 5 experiences were complete — it was invisible in the LinkedIn import.
- Markdown and HTML headers initially showed "I design systems" as the about summary (truncated by the import), making the CV feel hollow until fixed.

### Frictions encountered

1. **Import truncation**: LinkedIn parser lost date precision and summary text. Not blockers for dogfooding, but need fixing before shipping.
2. **Projects have no names**: LinkedIn export doesn't include project names, only descriptions and URLs. Need to backfill manually.
3. **Education garbled**: Degree names became degree descriptions in the import. Need to fix the parser.
4. **Publications broken**: HTML content captured as URLs. Parser needs a rewrite for this section.
5. **Certification dates truncated**: "Apr 202" instead of "Apr 2026". Parser drops the last digit.
6. **70+ flat skills**: Duplicates, Spanish/English, "Recogida de basura". Needs editorial filtering or projection-time cleanup.
7. **knowmad mood start date**: Still TBD — need to recover from contract or LinkedIn profile page.

### Product decisions that emerged naturally

| Decision | Origin |
|----------|--------|
| **PD-002**: Max 5 capabilities per experience | First render showed 70+ skills flat — overwhelming and unhelpful |
| **Summaries before bullets** | All 5 experiences were built by telling the story first, then extracting achievements |
| **Person summary as portada** | "I design systems" was too generic; the final summary describes how you solve problems, not what you do |
| **Import doesn't need to be perfect** | Even with corrupted dates, empty achievements, and garbled education, the import saved 80% of data entry time |
| **LinkedIn projector sorts by end date** | Bug fix: was sorting alphabetically by start date, which excluded current roles with corrupted sibling dates |

### What's next

- Fix knowmad mood start date (TBD → real date)
- Clean up education, publications, certifications (import bugs)
- Give projects real names
- Apply 5-capability editorial rule across all experiences
- Optionally filter the 70-skill flat list in projections


## How to add an entry

1. An event happens (opportunity, recruiter, performance review, conference).
2. Friction appears — something took longer than it should, or something was lost.
3. Add it here before deciding what to build.
4. If you build something to fix it, mark it resolved.

## Rules

- No hypothetical events. Only things that actually happened.
- If the same friction repeats, add a new row — frequency is evidence.
- If an event did not generate friction, it does not go in the log.

---

## Friction Log

### DF-001

**Date:** 2026-07-30

**Situation:** Away from computer when a noteworthy professional event occurs.

**Current workaround:** Wait until I get home.

**Problem:** Often forget or lose details by the time I can record them. Professional memory becomes discontinuous.

**Hypothesis:** Capture must be possible from whatever device the user already has in hand, in under a minute.

**Frequency:** Pending observation.

**Experiment:** For 1-2 weeks, when something happens away from the computer, note it in the fastest available medium (phone note, message to self). Later, try to turn that note into a Provena entry and observe: what information is missing, what is extra, how long does it take?

**Design insight (2026-07-30):** DF-001 revealed a deeper friction — the best profile data came from conversation, not from forms. "Sé lo que hice, pero me cuesta transformarlo en una representación coherente." This suggests two complementary problems to observe: (1) capture immediacy (getting the fact down), and (2) guided reconstruction (not having to translate that fact into a model alone). Not building anything yet — observing whether this pattern repeats.

---

### DF-002

**Date:** 2026-07-30

**Situation:** Recruiter contacts about an opportunity that doesn't fit (modality, level, technologies, salary, etc.).

**Current workaround:** 30-minute call to discover what should have been filterable upfront.

**Problem:** The professional's decision criteria are not represented anywhere in their public profile. Recruiters can't filter themselves out before initiating contact. Each misaligned contact consumes time for both sides.

**Frequency:** Pending observation — hypothesis: recurring.

**Experiment:** Next time a recruiter contacts, observe: what would have made them realise the misalignment before the call? Track how many contacts are misaligned over the next period.

**Design insight:** This reveals a missing question in professional representation. Current projections answer "What have you done?" (CV) and partially "Who are you?" (LinkedIn). Missing: "What would an opportunity need to meet for it to be worth talking to you?" Not building yet — observing if this friction repeats.

---

### DF-003

**Date:** 2026-07-30

**Situation:** After building the canonical profile and the Recruiter Brief projection, the next bottleneck is clear: the profile will go stale unless the capture habit is sustainable.

**Current workaround:** Open terminal, edit YAML, commit, re-render.

**Problem:** This requires context switching out of flow. The distance between "something happened" and "it's captured" is too large. The system depends on a discipline that will fail over time.

**Frequency:** Recurring. Every time a professional event happens, the question is: "Is this worth the overhead of opening the profile?"

**Experiment:** Build a `provena add` minimal interaction that captures facts without touching the model. Use it for 1-2 weeks. Observe: does the capture habit stick? What information survives the round-trip? What is the minimal interaction that maintains the model alive?

**Design insight:** The model's value depends on it being alive. The capture friction is the bottleneck that determines whether everything else works. Before building more consumers/projections, solve for sustainable maintenance.

---

### DF-004

**Date:** 2026-07-30

**Situation:** After building `provena add`, the capture concept works but the physical access barrier remains. To capture, you need a terminal with Provena installed.

**Current workaround:** Only capture when at the computer.

**Problem:** The most important professional events don't happen at the computer. The CLI requires the user to come to Provena, rather than Provena being where the user already is.

**Frequency:** Every time a notable event happens away from the terminal.

**Experiment:** Design and build a capture access layer (web page, bot, PWA) that removes the device barrier. Measure whether the capture habit sustains when access friction drops to near zero.

---

## Session Notes — 2026-07-30
