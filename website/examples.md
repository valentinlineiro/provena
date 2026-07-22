# Example

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
# Alice Romero

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
Alice Romero is a Technical Lead at Acme Corp,
where she works on AI-assisted engineering and
developer tooling. She focuses on distributed
systems and engineering productivity.
```

Condensed narrative. Context-specific.

## What makes this possible

The Projection layer. Each output uses the same Profile but applies a different selector:

```
Profile → ResumeProjection → MarkdownRenderer
Profile → LinkedInProjection → LinkedInRenderer
```

The domain model never changes. Only the projection does.
