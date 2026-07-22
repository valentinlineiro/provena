# The concept

One identity. Multiple projections.

```
Persistence
     ↓
   Domain (canonical profile)
     ↓
 Projection (context-optimized view)
     ↓
Presentation (renderer)
```

## Domain

A canonical model of professional identity. Pure types with no dependencies. Entities like Person, Experience, Project, Capability, and Evidence. Capabilities reference evidence — skills are not free-form claims.

## Projection

A projection selects and reshapes the canonical model for a specific context.

- **Résumé** — full experiences, all achievements, evidence-backed skills.
- **LinkedIn** — recent 4 experiences, top 10 capabilities, featured projects.
- **Bio** — condensed narrative for a specific audience.

The same Profile produces different projections without modification.

## Presentation

Renderers consume a projection and produce output. They have no access to the domain model. A résumé renderer writes Markdown. A LinkedIn renderer respects character limits and platform conventions.

## Why this matters

Platforms change. Your source should remain yours.

Provena never locks your identity into a proprietary format. Everything except the domain model is replaceable.
