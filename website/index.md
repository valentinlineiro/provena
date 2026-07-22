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
  - title: Facts Over Formatting
    details: Your career is not a collection of profiles. It is a body of knowledge with many representations.
  - title: Publish anywhere
    details: Implement any output format as a plugin. Markdown ships today. LinkedIn, JSON Resume, and more are straightforward to add.
  - title: Catch mistakes before publishing
    details: Schema validation catches inconsistencies before they reach your résumé or website.
  - title: Modular by Design
    details: One file per aggregate — person, experience, projects, skills. Easy to edit, version, and share.
---

## Why now

```
Professional platforms are optimized for publishing.
They are not designed to be your source of truth.
```

Your identity is scattered across LinkedIn, GitHub, your résumé, your website, and conference bios. Each platform owns a copy. Each copy drifts.

## The model

A canonical domain model for professional identity.

```
                    Your identity

                         ↓

              Canonical Profile Model

          ↙             ↓              ↘

      Résumé        LinkedIn        Website

     Markdown       Profile          Bio

   One source. Deterministic projections.
```

## Same profile. Different contexts.

```
                    Your Profile

                         ↓

   ┌──────────────────────────────────┐
   │  Valentín Liñeiro                │
   │  Engineer · Distributed Systems  │
   │  Experience at Acme Corp         │
   └──────────────────────────────────┘

        ↙               ↓               ↘

   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │  Résumé  │   │ LinkedIn │   │ Conference   │
   │          │   │          │   │ Bio          │
   │ Full     │   │ Recent   │   │              │
   │ history  │   │ 4 roles  │   │ Condensed    │
   │ Evidence │   │ Top 10   │   │ narrative    │
   │ backed   │   │ skills   │   │ for audience │
   └──────────┘   └──────────┘   └──────────────┘

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
