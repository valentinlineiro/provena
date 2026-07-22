# Examples

The same identity becomes different outputs depending on the projection.

## Input

A single source of truth:

```yaml
# person.yaml
name: Alice Romero
title: Software Engineer
summary: Engineer focused on distributed systems and developer tooling.

# experience.yaml
- organization: Acme Corp
  title: Senior Software Engineer
  start: "2022-03"
  achievements:
    - Reduced p99 latency by 40%
    - Designed event-driven ingestion pipeline
  technologies: [TypeScript, Rust, Kafka]

# capabilities.yaml
- name: Distributed Systems
  description: Event-driven architecture, consensus protocols, observability.
```

## Outputs

### Résumé (Markdown)

```
# Alice Romero

## About
Engineer focused on distributed systems...

## Experience
### Acme Corp
**Senior Software Engineer** | Mar 2022 — Present

- Reduced p99 latency by 40%
- Designed event-driven ingestion pipeline

## Skills
- Distributed Systems (1 piece of evidence)
```

Includes all experiences, full achievements, evidence counts.

### LinkedIn (in development)

```text
Headline: Software Engineer
About: Engineer focused on distributed systems...

Experience:
  Acme Corp — Senior Software Engineer (Mar 2022 — Present)
  Led platform reliability and designed event-driven pipelines.

Top skills: Distributed Systems
```

Recent 4 experiences only. Top 10 capabilities by evidence. Character-limited.

## What makes this possible

The Projection layer. Each output uses the same Profile but applies a different selector:

```
Profile → ResumeProjection → MarkdownRenderer
Profile → LinkedInProjection → LinkedInRenderer
```

The domain model never changes. Only the projection does.
