# Examples

The same identity becomes different outputs depending on the projection.

## At a glance

```
identity:
  roles:    [...]
  skills:   [...]
  evidence: [...]

        ↓

Résumé      → all experience, evidence-backed
LinkedIn    → last 4 roles, top skills
Bio         → condensed narrative
AI agent    → answers a question
```

This is not a CV generator producing one document. It is one model, queried or rendered differently depending on who's asking.

## Same data

```yaml
# experience.yaml
- organization: Acme Corp
  title: Technical Lead
  start: "2022-03"
  focus:
    - AI-assisted engineering
    - developer tooling
  achievements:
    - Reduced p99 latency by 40%
    - Designed event-driven ingestion pipeline

# capabilities.yaml
- name: Distributed Systems
  description: Event-driven architecture, consensus protocols, observability.
```

## Different projections

### Résumé

```
# Alex Chen

## Experience
### Acme Corp
**Technical Lead** | Mar 2022 — Present

- Reduced p99 latency by 40%
- Designed event-driven ingestion pipeline
- Led AI-assisted engineering initiatives

## Skills
- Distributed Systems (1 piece of evidence)
```

Full experiences. All achievements. Evidence-backed skills.

### JSON Resume

```json
{
  "basics": {
    "name": "Alex Chen",
    "title": "Technical Lead",
    "summary": "..."
  },
  "experiences": [
    {
      "company": "Acme Corp",
      "position": "Technical Lead",
      "startDate": "2022-03"
    }
  ],
  "skills": [
    { "name": "Distributed Systems", "keywords": ["1 evidence items"] }
  ]
}
```

Standard format. Toolable. Interoperable.

## What makes this possible

The Projection layer. Each output uses the same identity but applies a different selector:

```
Projection = Selection + Transformation

ResumeProjector:
  select:      all experiences, all capabilities
  transform:   capability → name + evidenceCount

JsonResumeProjector:
  select:      all experiences, all capabilities
  transform:   capability → name + keywords
  output:      JSON Resume schema
```

```
Identity → ResumeProjector          → MarkdownRenderer  → resume.md
Identity → JsonResumeProjector      → JsonResumeRenderer → resume.json
```

The identity is the source of truth. Outputs are temporary views.
