# Use Cases

Provena serves professionals who want to stop manually searching job boards and instead let an autonomous system continuously observe and evaluate the market.

---

## 1. Passive Market Observation

**The Problem**: Searching multiple job boards (Greenhouse, Ashby, Lever) every week consumes hours of manual attention and creates constant fear of missing out.

**Provena Solution**: You connect your market sources once (`/sources`). Provena continuously observes market streams in the background and delivers evaluated opportunities straight to your **Attention Inbox** (`/opportunities`).

```text
Sources (Greenhouse, Ashby, Lever)  ──►  Continuous Sync  ──►  Attention Inbox
```

---

## 2. Deterministic Opportunity Evaluation

**The Problem**: Evaluating whether a job posting truly fits your background requires reading long descriptions, matching requirements against your memory, and guessing.

**Provena Solution**: Paste any job description into `/evaluate`. Provena deterministically measures:
- **Professional Fit**: Capability match and evidence coverage.
- **Personal Fit**: Preference alignment.
- **Recognition Coverage**: Vocabulary sufficiency.

You receive an immediate, auditable verdict (`APPLY`, `CONSIDER`, `SKIP`) with explicit reasoning traced to your profile.

---

## 3. Career Timeline & Compass Tracking

**The Problem**: Professional history and evidence get forgotten over time. When you evaluate new opportunities, you struggle to recall specific metrics or achievements.

**Provena Solution**: Provena tracks your story in a canonical timeline (`/`). Capture achievements and evidence as they happen. The **Career Compass** continuously checks your market readiness and highlights gap areas before you apply.

---

## 4. Single Source of Truth for Identity Projections

**The Problem**: Maintaining separate copies of your résumé, LinkedIn profile, conference bio, and JSON Resume causes facts to drift.

**Provena Solution**: Define your experience, skills, and evidence once in a canonical YAML workspace. Derive Markdown, HTML, JSON Resume, or recruiter briefs without manual copying or formatting drift.

```text
Canonical Identity (YAML)
        │
        ├──► Markdown Resume (`resume.md`)
        ├──► HTML / PDF CV (`resume.html`)
        ├──► JSON Resume (`resume.json`)
        └──► LinkedIn Profile (`resume.markdown`)
```

---

## Core Value Proposition

> **Traditional job platforms optimize for engagement.**
>
> **Provena optimizes for preserved attention.**
>
> **Helping to look less.**
