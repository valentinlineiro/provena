---
layout: home

hero:
  name: Provena
  text: Your career has a source of truth.
  tagline: A canonical domain model for professional identity
  actions:
    - theme: brand
      text: Get Started
      link: /concept
    - theme: alt
      text: View Examples
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - icon: 🎯
    title: One Source of Truth
    details: Maintain one canonical career model. Generate every platform-specific representation — résumé, LinkedIn, website — from it.
  - icon: 🔄
    title: Deterministic Projections
    details: YAML files → Profile → Projection → Renderer → Output. Every output is a pure function of your canonical data.
  - icon: 🧠
    title: Facts Over Formatting
    details: Your career is not a collection of profiles. It is a body of knowledge with many representations.
  - icon: 📦
    title: Pluggable Renderers
    details: Implement any output format as a plugin. Markdown ships today. LinkedIn, JSON Resume, and more are straightforward to add.
  - icon: ✅
    title: Validation Built In
    details: Schema validation catches inconsistencies before they reach your résumé or website. Your data stays clean.
  - icon: 🗂️
    title: Modular by Design
    details: One file per aggregate — person, experience, projects, skills. Easy to edit, version, and share.
---

## How it works

```
YAML Workspace
      │
      ▼
    Profile  ←  validated, canonical
      │
      ├── ResumeProjection ──────► Markdown Renderer ──► .md
      └── LinkedInProjection ────► (your renderer here)
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

## After

```
               Profile
                  |
         -----------------
         |       |       |
      Résumé  LinkedIn  Website

   One source. Deterministic projections.
```

> **Identity is knowledge. Documents are projections. Facts over formatting. Evidence over claims.**
