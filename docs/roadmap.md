# Product Roadmap

Every epic exists because of a real friction event. Each epic has a structured format: friction → objective → observable result → minimum implementation.

**Rule:** Each epic must reduce an observable friction by at least 50%.

---

## Friction Backlog

| Friction | Objective | Possible solutions |
|----------|-----------|-------------------|
| Reconstructing CV | Generate an adapted CV in minutes | New projections, context selection, derived narrative |
| Explaining the same to recruiters | First conversation starts where it adds value | Recruiter Brief, Career Brief, professional FAQ |
| Losing achievements | Capture in seconds | Quick capture, drafts, curation flow |
| Heavy forms | Replace structured editing with conversation | Guided curation, automatic relationship extraction |
| Editing from different devices | Record knowledge from anywhere | Light web UI, Git sync, mobile capture |

---

## CARD-000 — Define the Decision Model

**Before any implementation.** This unblocks everything else.

**Friction**
The model represents identity (Profile) but not the decisions that communication exists to support. Without defining which decisions Provena helps make, every projection grows as a format variant rather than a view optimized for a purpose.

**Design insight from dogfooding:**
The architecture should move from:
```
Profile → Projection → Renderer
```
to:
```
Profile → Decision → Projection → Renderer
```

A projection is a view optimized for a specific decision, not a format template. Decisions are more stable than channels (LinkedIn may not exist in 5 years, but the need for a recruiter to decide whether to contact will).

**Objective**
Answer:
- What decisions does Provena help make?
- What information does each decision require from the profile?
- What is the Decision Model — how does it select and prioritize facts?
- How do preference/criteria fields (opportunity criteria, dealbreakers) fit without contaminating identity?

**Observable result**
A written model in `docs/decision-model.md` that defines the canonical decisions, their information requirements, and how the Decision Model transforms Profile → Projection.

All future communication epics reference this model instead of inventing their own semantics.

---

## Epic 1 — Recruiter Brief

**Friction**
Always explaining the same thing. Evaluating opportunities that don't fit.

**Objective**
A recruiter understands the profile and criteria before talking to me.

**Observable result**
The first call starts talking about the role, not the trajectory.

**Minimum implementation**
A new projection: `provena render recruiter`.
Output: who I am, what problems I solve, what I'm looking for, what I'm not looking for, important conditions, relevant technologies, short narrative.

---

## CARD-002 — Personal Usage Loop

### CARD-002A — Capture Core (✅ Validated)

**Friction**
Maintaining Provena requires too much conscious effort. Terminal → edit YAML → commit → render. Context switching out of flow.

**Implementation**
```bash
provena add
```

Prompts: What happened? Where? Why does it matter?
Output: a draft YAML file in `captures/inbox.yaml`. Doesn't touch the canonical profile.

**Status:** Conceptually validated. The capture concept works. The bottleneck is now physical access — the CLI requires being at a terminal with the tool installed.

---

### CARD-002B.1 — Provena Home (Identity Timeline) ✅ Deployed

**Friction**
Knowledge happens away from the terminal. Provena only exists where the CLI is installed.

**Design shift (2026-07-30)**
The original concept was a capture form: text field + save. Dogfooding revealed a deeper friction:

> A capture box validates information entry, not professional memory. Provena is not Evernote. Its value is in connection.

The interface gravity shifts from:
```
Captura → Inbox
```
to:
```
Mi historia profesional → Añadir / Ver pendientes / Evolucionar
```

**Current state**
`packages/provena-web/` deployed at `https://provena-capture.valentinlineiro.workers.dev`. Currently serves the original capture form. Next iteration (CARD-002C) will replace it with the Identity Timeline.

**Storage boundary**
KV is a temporary dogfooding store, not a new source of truth. Future sync imports KV captures into the local workspace. The canonical profile remains the source of truth.

**Friction before/after**
- Before: "Something important → Where do I save it? → Do I have time? → Open tool"
- After: "Open Provena → See who I am → Update a piece"

**Status:** Deployed. Interface pending redesign per CARD-002C.

---

### CARD-002B.2 — Automated Deployment (✅ Implemented)

**Friction**
Every change requires remembering infrastructure steps. Manual deploy is a chore that will be skipped.

**Objective**
Push to `main` deploys automatically.

**Implementation**
`.github/workflows/provena-web-deploy.yml` — GitHub Actions workflow:
1. Checkout + setup Node
2. `npm ci`
3. Inject KV namespace ID from secret
4. `npx wrangler deploy`

**Secrets needed (GitHub → Settings → Actions):**
- `CLOUDFLARE_API_TOKEN` — token with Workers:Edit + KV:Edit
- `CLOUDFLARE_ACCOUNT_ID` — Cloudflare account ID
- `CAPTURES_KV_ID` — KV namespace ID (from `wrangler kv namespace create`)

**One-time setup:**
```bash
npx wrangler kv namespace create CAPTURES
# → paste ID in GitHub secrets + wrangler.jsonc
```

**Setup inicial** (una vez): crear KV namespace, configurar secrets.
**Operación diaria**: `git push` → Provena actualizado.

**Result:** Infrastructure becomes invisible. The Worker is part of versioned product, not manual console actions.

---

### CARD-002C — Identity Timeline View

**Friction**
The isolated capture form doesn't generate a sense of progress or connection to professional history. The user sees a form, not their identity. Captures land in an invisible inbox instead of being placed in context.

**Insight**
> "I don't want a tray where I deposit things. I want to see how they fit into my story while I build that story."

The action is not "capture." The action is **navigate identity**. Capture is a secondary action within that context.

**Objective**
Replace the capture form with a home screen showing the canonical profile (experiences, capabilities, pending captures) with "add" as a secondary action. Every capture has context: "I am adding something to my story."

**Minimum implementation**
A single view:
- Profile header (name, title)
- Experiences list (title, company, top capabilities)
- Pending captures section
- "Add capture" button

No editing yet. The view is read-only identity exploration with entry points for new information.

**Design question**
> What view makes a user want to come back tomorrow?

The loop starts with **observation** (seeing your story), not with **entry** (adding to it). The natural human loop: open → see → detect evolution/gaps → add → the story improves. Capture is a contextual action within identity maintenance, not the entry point to the product.

**Usability gate**
The capture habit must work before adding consumers/projections (PD-005). Identity Timeline is the capture habit interface, not a new feature.

**Status:** Implemented (2026-07-30). Home screen shows identity: name, title, focus, stats (experiences/capabilities/captures), experiences with capability tags, pending captures, and a contextual "+ Añadir evolución" with quick prompts. Capture always returns to the story.

---

### CARD-002D — Career Compass

**Friction**
The Identity Timeline tells the user "this is your story" — useful but static. It doesn't say what the story *means* for the market. Returning is driven by observation of facts, not by a reason to act.

**Insight**
> The habit loop is not "complete the profile". It is a feedback system. And the first benefit a user cannot easily get by themselves is: "What does my story mean in the market?"

The Timeline answers "Who am I?". The career decision needs "What does that mean in the market?". That answer is costly because it combines many signals: real experience (not just years), evidence (milestones), technologies, depth vs. breadth, market trends, expected level (Senior/Staff/Principal), observed compensation, compatible opportunities.

The canonical model has an advantage: it already holds the structured context.

**Reframing (2026-07-31):** Pulse is not a dashboard — it is a **Career Compass**. Salary is not the product. The product answers: Am I underpaid? Am I growing? Should I change companies? What companies look for me? What evidence is missing to reach the next level?

**Design relationship to CARD-000**
The profile feeds a **Decision Context**; the Compass is a decision surface for the **Self** context. It is feedback for the user, not a projection for an external consumer. This is what keeps it inside the personal usage loop (PD-005) rather than an external projection.

**Structured by levels — MVP is Level 1 only**

- **Level 1 (own data only, buildable now):** positioning, story coverage, last evolution, strengths, documentary gaps, readiness for Recruiter Brief.
- **Level 2 (adds external data):** technology demand, market trends, compatible roles, observed salaries.
- **Level 3 (requires user history over time):** "Your market value increased vs. 6 months ago", "You now match the typical Staff Engineer pattern", "Your story supports a higher salary negotiation", "You are aligning with Principal opportunities". This level is the sustainable differentiator — it is what a spreadsheet, CV, or LinkedIn cannot produce alone.

**Minimum implementation (Level 1)**
A "Career Compass" section derived from existing data, no new fields:
- **Positioning**: title + dominant capabilities
- **Last evolution**: days since most recent capture
- **Story coverage**: hitos per experience vs. their dates (recent well-covered, early sparse)
- **Strengths**: strongest differentiators
- **Documentary gaps**: the gap with highest value (e.g., "document the architectural outcomes from your current role")
- **Readiness**: ready to generate CV / LinkedIn / Recruiter Brief

**Deferred (needs sufficient information)**
- Level 2: market demand, trends, compatible roles, observed salaries.
- Level 3: longitudinal value/pattern inferences. Only when the data supports it.

**Usability gate**
PD-005 still applies: the capture/observation habit (CARD-002C) is being validated over 2-3 weeks. The Compass is the reason to keep returning — but it must be built from real data, so the validation period also accumulates the evidence it needs.

**Status:** Design validated. Not implemented. Implementation deferred until the Timeline habit is confirmed.

---

## Epic 2 — Career Narrative

**Friction**
CV looks like a list. Narrative must be built manually.

**Objective**
Automatically generate a coherent story.

**Observable result**
Do I need to edit it heavily?

**Minimum implementation**
Derive a professional summary from the profile. Rules, not AI.

---

## Epic 3 — Contextual Projections

**Friction**
One CV for everything.

**Objective**
Change the context. Not the profile.

**Observable result**
A single profile produces distinct representations for different audiences without manual editing.

**Minimum implementation**
```
provena render cv --context recruiter
provena render cv --context staff
provena render cv --context architect
```
Even if initially they produce very similar results.

---

## Epic 4 — Opportunity Criteria

**Friction**
Wasting time on opportunities I'll never accept.

**Objective**
Explicitly represent criteria. Not experience. Criteria.

**Observable result**
Recruiters self-filter before contacting.

**Minimum implementation**
Add to the domain:
```yaml
opportunity:
  salary:
    min: 60000
  remote: required
  roles:
    - staff
    - principal
  avoid:
    - six interview rounds
    - java maintenance
```
No UI yet.

---

## Epic 5 — Capture

**Friction**
Something happens away from the computer.

**Objective**
Record the fact in seconds.

**Observable result**
TBD.

**Minimum implementation**
Not yet defined. First, live the pain.

---

## Epic 6 — Curation

**Friction**
Editing YAML is costly.

**Objective**
Convert knowledge into structure.

**Observable result**
TBD.

**Minimum implementation**
Not yet defined. First, live the pain.

---

## Epic 7 — Ubiquity

**Friction**
Don't always have the laptop.

**Objective**
Keep using Provena from anywhere.

**Observable result**
TBD.

**Minimum implementation**
Not yet decided.
