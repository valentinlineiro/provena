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

### CARD-002B.1 — Mobile Capture Surface

**Friction**
Knowledge happens away from the terminal. Provena only exists where the CLI is installed.

**Decision**
Cloudflare Worker at `provena.dev/add` (or equivalent). Same minimal page: text field + save. Same capture format as local. This is a surface of Provena, not a satellite product.

**Implementation**
`packages/provena-web/` — Cloudflare Worker inside the Provena monorepo. Serves mobile-friendly HTML, stores captures in KV, ready for future sync to workspace.

**Storage boundary**
KV is a temporary dogfooding store, not a new source of truth. Future sync imports KV captures into the local workspace. The canonical profile remains the source of truth.

**Status:** Code ready. Deployment blocked on Cloudflare account setup.

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
