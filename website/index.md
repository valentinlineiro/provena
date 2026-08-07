---
layout: home

hero:
  name: Provena
  text: Stop searching.
  tagline: |
    Provena continuously observes the market and surfaces only opportunities that deserve your attention.
    Connect your professional identity once. Let an autonomous system watch continuous market feeds.
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
  - title: 1. Professional Identity
    details: Build a canonical, referentially sound representation of your career facts, evidence, and capabilities in plain YAML.
  - title: 2. Continuous Market Watch
    details: Automated observation engines continuously poll ATS boards (Greenhouse, Ashby, Lever) and ingest raw postings.
  - title: 3. Deterministic Evaluation
    details: Every market posting is evaluated deterministically against your identity. No LLM hallucinations or opaque matching.
  - title: 4. Attention Inbox
    details: Filter out noise automatically. Only review high-confidence opportunities sorted by semantic attention tabs.
---

## How It Works

```
Identity  ──►  Decision Engine  ──►  Continuous Observation  ──►  Attention Inbox  ──►  Helping to look less
```

### 1. Build your professional identity
Define your experience, evidence, and capabilities once in a canonical YAML workspace. Every output is derived — never copied, never out of sync.

### 2. Provena continuously watches the market
Adapters automatically monitor job boards across Greenhouse, Ashby, and Lever, maintaining a real-time canonical market catalog.

### 3. Every opportunity is evaluated deterministically
Evaluations measure professional fit, personal fit, and recognition coverage with explicit, auditable reasoning traced back to your profile.

### 4. You only review what matters
Your Attention Inbox groups postings into `Needs Attention`, `Worth Considering`, `Unresolved`, and `Decided`.

---

## Real-Time Pipeline

```
Greenhouse / Ashby / Lever (Sources)
              │
              ▼
  Neon PostgreSQL / KV (Market)
              │
              ▼
     Protocol v1 (Decision)
              │
              ▼
  Attention Policy (Evaluation)
              │
              ▼
    Attention Inbox (Product)
```

---

## System Status

| Tier | Component | Status |
| --- | --- | --- |
| **Production-ready** | **Canonical Identity** | Deterministic profile model, invariants I1-I5, multi-format rendering |
| **Production-ready** | **Decision Protocol** | OE-1/2/3 evaluation policy, coverage & confidence scoring |
| **Production-ready** | **Shared Market** | Global market schema, Greenhouse board ingestion, deduplication |
| **Production-ready** | **Continuous Sync** | Autonomous cron sync & PostgreSQL/KV repository persistence |
| **Production-ready** | **Attention Inbox** | Keyset pagination, attention tab ordering, decision recording |
| *Experimental* | *Market Knowledge Learning* | K12 operational pattern extraction and clustering |
| *Experimental* | *Attention Validation* | Attention Precision & Missed Opportunity Rate telemetry |

---

## Philosophy

> **Helping to look less.**
> 
> *Preserve human attention for decisions that matter.*
