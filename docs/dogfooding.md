# Dogfooding Log

Every entry in this log is a real event that generated friction in managing my own professional career.

The roadmap does not come from ideas. It comes from this table.

## Log

| Date | Event | Friction | Action | Resolved |
|------|-------|----------|--------|----------|
| 2026-07 | Recruiter requested CV | No up-to-date CV existed — had to reconstruct 2 years of work | Render from canonical profile | ✅ |
| 2026-07-30 | LinkedIn import session | Imported data had truncated dates, summaries, and missing fields | Imported → built real canonical profile with all 5 experiences via conversation | ✅ |

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


## How to add an entry

1. An event happens (opportunity, recruiter, performance review, conference).
2. Friction appears — something took longer than it should, or something was lost.
3. Add it here before deciding what to build.
4. If you build something to fix it, mark it resolved.

## Rules

- No hypothetical events. Only things that actually happened.
- If the same friction repeats, add a new row — frequency is evidence.
- If an event did not generate friction, it does not go in the log.
