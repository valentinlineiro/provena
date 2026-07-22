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
      text: See the model
      link: /concept
    - theme: alt
      text: View the example
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: One Source of Truth
    details: Maintain one canonical career model. Generate every platform-specific representation — résumé, LinkedIn, website — from it.
  - title: Every version stays consistent
    details: Each output is a pure function of your canonical data. Update once. Every representation reflects the change.
  - title: Publish anywhere
    details: Implement any output format as a plugin. Markdown ships today. LinkedIn, JSON Resume, and more are straightforward to add.
---

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

> **Identity is knowledge. Documents are projections. Facts over formatting. Evidence over claims.**
