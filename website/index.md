---
layout: home

hero:
  name: Provena
  text: Define your identity once. Export everywhere.
  tagline: |
    A canonical model for your professional identity.
    One YAML workspace. CV, JSON Resume, HTML, and more — all generated from the same source.
  actions:
    - theme: brand
      text: Quick start in 5 minutes
      link: /quickstart
    - theme: alt
      text: See the model
      link: /concept
    - theme: alt
      text: View example output
      link: /examples
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: One source of truth
    details: Your career facts live in YAML files. Every output is derived — never copied, never out of sync.
  - title: Multiple projections
    details: Resume, LinkedIn profile, conference bio, JSON Resume — different views of the same identity.
  - title: Verified by validation
    details: Referential integrity checks catch broken links between skills, experience, and evidence before you render.
  - title: CLI-first
    details: No build step, no platform lock-in. `provena render` from any directory. Works with your editor, not instead of it.
  - title: Future-proof
    details: New output format? New projection? The model stays the same. Add a renderer, don't reshape your data.
  - title: Open source
    details: MIT license. Your identity is not a SaaS subscription. Own your data, own your toolchain.
---

## YAML → Profile → Outputs

```
┌─────────────────────┐
│  person.yaml        │
│  experience.yaml    │
│  capabilities.yaml  │  Canonical identity model
│  projects.yaml      │
│  provena.yaml       │
└─────────┬───────────┘
          │
          ▼
   ┌──────────────┐
   │   Profile    │  (validated, referentially sound)
   └──────┬───────┘
          │
     ┌────┴────┐
     │         │
     ▼         ▼         ▼
  resume.md  resume.json  resume.html
  (Markdown) (JSON Resume) (HTML)
```

## Who is it for?

**Developers** who want their CV to reflect their actual work, not a hand-edited copy from last year.

**Freelancers** who manage multiple bios for different clients and platforms, and want one source of truth.

**Job seekers** who need polished, consistent outputs across every application channel.

**Consultants** who maintain capability statements, case studies, and speaker profiles — all from one model.

Try it:

```bash
npx @provena/cli render examples/valen
cat examples/valen/resume.md
```

## See it in action

| Input YAML | Output Markdown |
|---|---|
| `person.yaml` defines name, title, summary | Header shows name and about section |
| `experience.yaml` lists roles with achievements | Each role is a section with org, title, dates |
| `capabilities.yaml` defines skills with evidence | Skills are listed with optional descriptions |
| Identity links experiences to capabilities | No duplication — references, not copies |

[Render the example workspace](/examples) →
[Start your own in 5 minutes](/quickstart) →
