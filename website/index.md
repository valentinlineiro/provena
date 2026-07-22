---
layout: home

hero:
  name: Provena
  text: Your career has a source of truth.
  tagline: LinkedIn, résumés, websites, and bios are just different views of the same professional identity. Maintain one model. Generate every representation.
  actions:
    - theme: brand
      text: See the problem
      link: /problem
    - theme: alt
      text: Try the example
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: One Source of Truth
    details: Maintain one canonical career model. Generate every platform-specific representation — résumé, LinkedIn, website — from it.
  - title: Deterministic Projections
    details: YAML files → Profile → Projection → Renderer → Output. Every output is a pure function of your canonical data.
  - title: Facts Over Formatting
    details: Your career is not a collection of profiles. It is a body of knowledge with many representations.
  - title: Pluggable Renderers
    details: Implement any output format as a plugin. Markdown ships today. LinkedIn, JSON Resume, and more are straightforward to add.
  - title: Validation Built In
    details: Schema validation catches inconsistencies before they reach your résumé or website.
  - title: Modular by Design
    details: One file per aggregate — person, experience, projects, skills. Easy to edit, version, and share.
---

## The problem

```
Your professional story exists in five places.

  LinkedIn.
  Résumé.
  GitHub.
  Personal website.
  Conference bios.

Each copy drifts.
Each update costs time.

Visitors notice the inconsistency.
```

## How it works

```
              YOUR IDENTITY

                 Profile

        /          |          \

    Résumé     LinkedIn    Website

  One source. Deterministic projections.
```

```
YAML files → Profile → Projection → Renderer → Output
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
