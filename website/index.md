---
layout: home

hero:
  name: Provena
  text: Your professional identity has too many copies.
  tagline: |
    LinkedIn. Résumés. Websites. Bios.

    They are not different identities.
    They are different views of the same one.

    A canonical model keeps them synchronized.
  actions:
    - theme: brand
      text: Try it in 5 minutes
      link: /quickstart
    - theme: alt
      text: See the model
      link: /concept
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: Canonical identity
    details: One model owns meaning. Your career facts live in one place, not scattered across every platform that asks for them.
  - title: Verified projections
    details: Every output is a pure function of your canonical data. Once updated, every representation stays synchronized. Tests enforce it.
  - title: Ready today
    details: CLI available. Markdown and JSON Resume output. Five-minute Quick Start. No build step, no platform lock-in.
---

## From one workspace to multiple formats

```yaml
# person.yaml
name: "Alex Morgan"
title: "Software Engineer"
summary: "..."
```

```
        ↓
   ┌────────────┐
   │  Identity  │  (canonical model — facts, evidence, history)
   └─────┬──────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 resume.md  resume.json
```

**Same source. Different projections.** Add a skill once. Both outputs reflect it.

## The problem

```
LinkedIn ≠ Résumé ≠ Portfolio ≠ Bio
```

Every one of them says something slightly different, because every one of them was updated on a different day, by hand. Keeping them in sync is manual work that never ends — and nobody notices until they don't match.

## The solution

```
        Identity Model
              ↓
         Projections
       ↙        ↓        ↘
     CV      LinkedIn   Website
```

One canonical model. Every representation is generated from it, not copied into it.

## Same profile. Different contexts.

```
                     Your Profile
                          ↓
   ┌──────────────────────────────────────┐
   │  Alex Morgan                         │
   │  Software Engineer · Distributed Sys │
   │  Experience at Acme Corp             │
   └──────────────────────────────────────┘

        ↙               ↓               ↘

   ┌─────────────┐  ┌──────────┐  ┌──────────────┐
   │   Résumé    │  │ LinkedIn │  │ Conference   │
   │             │  │          │  │ Bio          │
   │ Full        │  │ Recent   │  │              │
   │ history     │  │ 4 roles  │  │ Condensed    │
   │ Evidence    │  │ Top 10   │  │ narrative    │
   │ backed      │  │ skills   │  │ for audience │
   └─────────────┘  └──────────┘  └──────────────┘

   Same data. Different views.
```

## Before

```
LinkedIn      Résumé       Website
    |            |            |
 Experience   Experience   Experience
    |            |            |
   Skills       Skills       Skills
    |            |            |
  Projects     Projects     Projects

   Three copies. Always diverging.
```

## Status

**v0.4** — From architecture to adoption.

| Capability | Status |
|------------|--------|
| Canonical identity model | ✅ |
| Executable validation | ✅ |
| Projector + Renderer contracts | ✅ |
| Markdown renderer | ✅ |
| JSON Resume renderer | ✅ |
| CLI (`render`, `validate`, `--format`, `--stdout`) | ✅ |
| Five-minute Quick Start | ✅ |
| I6: Multiple renderers per representation | 🚧 Deferred |

> **Identity is knowledge. Documents are projections. Facts over formatting. Evidence over claims.**
