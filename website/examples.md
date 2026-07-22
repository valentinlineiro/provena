# Examples

The same identity becomes different outputs depending on the projection.

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

### LinkedIn (in development)

```
Headline: Technical Lead
About: Engineering leader focused on AI-assisted
development and developer tooling.

Experience:
  Acme Corp — Technical Lead (Mar 2022 — Present)
  Led AI adoption and engineering productivity.

Top skills: Distributed Systems
```

Recent 4 experiences. Top 10 capabilities by evidence. Character-limited.

### Bio

```
Alex Chen is a Technical Lead at Acme Corp,
where they work on AI-assisted engineering and
developer tooling. They focus on distributed
systems and engineering productivity.
```

Condensed narrative. Context-specific.

### AI agent (queried, not rendered)

```
Query: "Prepare a proposal for a distributed systems consulting role."

Relevant:
  - Designed event-driven ingestion pipeline
  - Reduced p99 latency by 40%
  - Capability: Distributed Systems (1 piece of evidence)

Excluded:
  - Anything outside the distributed-systems capability
```

Not a document — a selection over the same model, shaped by a question instead of a template.

## What makes this possible

The Projection layer. Each output uses the same identity but applies a different selector:

```
Projection = Selection + Transformation + Constraints

LinkedInProjection:
  select:      experiences.last(4), capabilities.top(10, by: evidenceCount)
  transform:   experience → headline + summary
  constraints: character limits, platform conventions
```

```
Identity → ResumeProjection    → MarkdownRenderer
Identity → LinkedInProjection  → LinkedInRenderer
```

The identity is the source of truth. Outputs are temporary views.
