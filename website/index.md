---
layout: home

hero:
  name: Provena
  text: Stop searching.
  tagline: |
    Provena continuously watches the job market and only interrupts you when an opportunity deserves your attention.
  actions:
    - theme: brand
      text: Quick start in 5 minutes
      link: /quickstart
    - theme: alt
      text: Explore Architecture
      link: /architecture
    - theme: alt
      text: GitHub
      link: https://github.com/valentinlineiro/provena

features:
  - title: 1. Build your identity
    details: Define your career facts, evidence, and capabilities once in a canonical, referentially sound YAML workspace.
  - title: 2. Connect market sources
    details: Observation adapters continuously monitor job streams across Greenhouse, Ashby, Lever, and public job boards.
  - title: 3. Deterministic evaluation
    details: Every market opportunity is evaluated deterministically against your profile with auditable, falsifiable reasoning.
  - title: 4. Review only what matters
    details: Your Attention Inbox filters out market noise automatically into Needs Attention, Worth Considering, and Decided.
---

> **Traditional job platforms optimize for engagement. Provena optimizes for preserved attention.**

---

## How It Works

```
Identity  ──►  Continuous Observation  ──►  Deterministic Assessment  ──►  Attention Inbox  ──►  Helping to look less
```

### 1. Build your professional identity
Define your experience, evidence, and capabilities once in a canonical YAML workspace. Every output is derived — never copied, never out of sync.

### 2. Connect market sources
Adapters continuously monitor job boards across Greenhouse, Ashby, and Lever, maintaining a real-time canonical market catalog.

### 3. Provena evaluates every opportunity
Deterministic decision engines measure professional fit, personal fit, and recognition coverage with explicit, auditable reasoning traced back to your profile.

### 4. Review only what matters
Your Attention Inbox groups postings into `Needs Attention`, `Worth Considering`, `Unresolved`, and `Decided`.

---

## Architecture Pipeline

```
Sources (Greenhouse / Ashby / Lever)
              │
              ▼
    Market Catalog (PostgreSQL)
              │
              ▼
   Decision Engine (Protocol v1)
              │
              ▼
    Deterministic Assessment
              │
              ▼
    Attention Inbox (Product)
```

---

## System Status

| Tier | Component | Description |
| --- | --- | --- |
| **Production-ready** | **Canonical Identity** | Deterministic profile model, invariants I1-I5, multi-format rendering |
| **Production-ready** | **Decision Protocol** | OE-1/2/3 evaluation policy, coverage & confidence scoring |
| **Production-ready** | **Shared Market** | Global market schema, board ingestion adapters, deduplication |
| **Production-ready** | **Continuous Sync** | Autonomous background sync & PostgreSQL repository persistence |
| **Production-ready** | **Attention Inbox** | Keyset pagination, attention tab ordering, decision recording |
| **Research** | **Market Knowledge Acquisition (K12)** | Operational requirement pattern extraction and clustering |
| **Research** | **Attention Validation** | Attention Precision & Missed Opportunity Rate telemetry |

---

## Philosophy

> **Helping to look less.**
> 
> *Preserve human attention for decisions that matter.*
