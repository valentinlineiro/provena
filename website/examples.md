# Examples

The same identity becomes different outputs depending on the projection. Everything below is the actual output of `provena render examples/valen`, not a hand-written mockup — clone the repo and run it yourself to see the same thing.

## At a glance

```
identity:
  roles:    [...]
  skills:   [...]
  evidence: [...]

        ↓

Résumé      → all experience, evidence-backed
LinkedIn    → last 4 roles, top skills, sized to platform limits
JSON Resume → standard, toolable schema
```

This is not a CV generator producing one document. It is one model, queried or rendered differently depending on who's asking.

## Input

`examples/valen/` — a real workspace, unmodified.

::: code-group

```yaml [person.yaml]
name: "Valentín Liñeiro Barea"
email: "valentin@example.com"
location: "Madrid, Spain"
title: "Software Engineer & Architect"
summary: "Engineer focused on distributed systems, developer tooling, and knowledge representation."
urls:
  github: "https://github.com/valenlb"
  linkedin: "https://linkedin.com/in/valenlb"
```

```yaml [experience.yaml]
- id: "exp-1"
  organization: "Acme Corp"
  title: "Senior Software Engineer"
  start: "2022-03"
  location: "Remote"
  summary: "Led platform reliability initiatives across the engineering org."
  achievements:
    - "Reduced p99 latency by 40% through architectural redesign"
    - "Designed event-driven ingestion pipeline processing 1M+ events/day"
    - "Mentored 4 junior engineers"
  technologies:
    - "TypeScript"
    - "Rust"
    - "Kafka"
    - "PostgreSQL"
  capabilityIds:
    - "cap-distributed-systems"
    - "cap-architecture"
  evidenceIds: []
```

```yaml [capabilities.yaml]
- id: "cap-distributed-systems"
  name: "Distributed Systems"
  description: "Event-driven architecture, consensus protocols, observability at scale."
  evidenceIds: []

- id: "cap-architecture"
  name: "Software Architecture"
  description: "System design, domain-driven design, architectural decision records."
  evidenceIds: []
```

:::

## Output

Same workspace, three projections — pick a tab.

::: code-group

```markdown [resume.md]
# Valentín Liñeiro Barea

## About

Engineer focused on distributed systems, developer tooling, and knowledge representation.

## Experience

### Acme Corp
**Senior Software Engineer** | Mar 2022 — Present

Led platform reliability initiatives across the engineering org.

- Reduced p99 latency by 40% through architectural redesign
- Designed event-driven ingestion pipeline processing 1M+ events/day
- Mentored 4 junior engineers

*TypeScript, Rust, Kafka, PostgreSQL*

## Skills

- **Distributed Systems**
  Event-driven architecture, consensus protocols, observability at scale.
- **Software Architecture**
  System design, domain-driven design, architectural decision records.
```

```json [resume.json]
{
  "basics": {
    "name": "Valentín Liñeiro Barea",
    "email": "valentin@example.com",
    "location": "Madrid, Spain",
    "title": "Software Engineer & Architect",
    "summary": "Engineer focused on distributed systems, developer tooling, and knowledge representation.",
    "url": "https://github.com/valenlb"
  },
  "experiences": [
    {
      "company": "Acme Corp",
      "position": "Senior Software Engineer",
      "startDate": "2022-03",
      "summary": "Led platform reliability initiatives across the engineering org.",
      "achievements": [
        "Reduced p99 latency by 40% through architectural redesign",
        "Designed event-driven ingestion pipeline processing 1M+ events/day",
        "Mentored 4 junior engineers"
      ]
    }
  ],
  "skills": [
    { "name": "Distributed Systems" },
    { "name": "Software Architecture" }
  ]
}
```

```markdown [resume.linkedin.md]
## Headline

Software Engineer & Architect

## About

Engineer focused on distributed systems, developer tooling, and knowledge representation.

## Experience

### Senior Software Engineer, Acme Corp

2022-03 – Present

Led platform reliability initiatives across the engineering org.

TypeScript, Rust, Kafka, PostgreSQL

## Skills

Distributed Systems, Software Architecture
```

:::

Same `person.yaml` and `experience.yaml`. Three different shapes — full detail for the resume, standard schema for tooling, truncated-to-platform-limits text ready to paste into a LinkedIn profile.

## What makes this possible

The Projection layer. Each output uses the same identity but applies a different selector:

```
Projection = Selection + Transformation

resumeProjector (core):
  select:      all experiences, all capabilities
  transform:   capability → name + evidenceCount

jsonResumeProjector (@provena/jsonresume):
  select:      all experiences, all capabilities
  transform:   capability → name + keywords
  output:      JSON Resume schema

linkedInProjector (@provena/linkedin):
  select:      last 4 experiences, top 10 capabilities by evidence count
  transform:   truncate headline/about/description to LinkedIn's limits
```

```
Identity → resumeProjector      → MarkdownRenderer  → resume.md
Identity → jsonResumeProjector  → jsonResumeRenderer → resume.json
Identity → linkedInProjector    → linkedInRenderer   → resume.linkedin.md
```

The identity is the source of truth. Outputs are temporary views.

Try it yourself:

```bash
npx @provena/cli render examples/valen --format markdown --stdout
npx @provena/cli render examples/valen --format jsonresume --stdout
npx @provena/cli render examples/valen --format linkedin --stdout
```
