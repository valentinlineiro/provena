# Example

A minimal workspace produces a complete Markdown resume.

## Input

`person.yaml`

```yaml
name: Alice Romero
email: alice@example.com
location: Madrid, Spain
title: Software Engineer
summary: Engineer focused on distributed systems and developer tooling.
```

`experience.yaml`

```yaml
- organization: Acme Corp
  title: Senior Software Engineer
  start: "2022-03"
  summary: Led platform reliability initiatives.
  achievements:
    - Reduced p99 latency by 40%
    - Designed event-driven ingestion pipeline
  technologies:
    - TypeScript
    - Rust
    - Kafka
```

`capabilities.yaml`

```yaml
- name: Distributed Systems
  description: Event-driven architecture, consensus protocols, observability.
```

## Transformation

```
Profile → ResumeProjection → MarkdownResumeRenderer
```

## Output

```markdown
# Alice Romero

## About

Engineer focused on distributed systems and developer tooling.

## Experience

### Acme Corp
**Senior Software Engineer** | Mar 2022 — Present

Led platform reliability initiatives.

- Reduced p99 latency by 40%
- Designed event-driven ingestion pipeline

*TypeScript, Rust, Kafka*

## Skills

- **Distributed Systems**
  Event-driven architecture, consensus protocols, observability.
```

## Run it yourself

```bash
npm install
npx tsx packages/demo/src/load-and-render.ts
```

See the full example at `examples/valen/`.
