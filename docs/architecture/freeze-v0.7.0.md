# Architecture Freeze Record — v0.7.0

**Date:** 2026-08-07  
**Status:** Frozen for v0.7.0 Release  
**Reference:** [ADR-001](adr/ADR-001-v0.7.0-architectural-reconciliation.md)

---

## Overview
This document defines the authoritative boundary of components included in the **v0.7.0** release of Provena. It specifies which subsystems are classified as **Stable**, which are **Experimental**, and which are **Not Started / Vision**.

---

## Component Classification Table

| Component | Layer / Scope | Maturity Status | Notes / Guarantees |
|-----------|---------------|-----------------|-------------------|
| **Canonical Identity Model** | Core Domain | **Stable** | Aggregate root `Profile`, YAML loader, referential integrity validation |
| **Decision Protocol (Protocol v1)** | Projection & Evaluation | **Stable** | Deterministic `evaluateOpportunity(jd, profile)` (APPLY / CONSIDER / SKIP), semantic trace from claims to evidence |
| **Shared Market Architecture (O2)** | Persistence & Ingestion | **Stable** | Greenhouse board ingestion, deduplication, Neon PostgreSQL storage, Cloudflare Cron worker sync |
| **Attention Inbox** | Web & Presentation | **Stable** | Opportunity listing, candidate preference filtering, relevance ranking |
| **Continuous Synchronization** | Pipeline | **Stable** | Automated Worker + Cron + PostgreSQL + KV snapshot pipeline |
| **Market Knowledge Acquisition (K12)** | Research / Learning | **Experimental** | Pattern extraction (`MarketPatternDefinitions`), GTM splits (K12-GTM-001/002), empirical learning reports |
| **Attention Validation** | Research / Measurement | **Not Started** | Empirical measurement of user attention reduction |
| **Outcome Learning** | Research / Feedback | **Not Started** | Application outcome feedback loop |

---

## Detailed Boundaries

### 1. Stable (Operational Production)
- **Identity Domain (`@provena/core`)**: The canonical profile model (`Profile`, `Person`, `Experience`, `Capability`, `Contribution`, `Evidence`) is frozen and backwards-compatible with YAML workspaces.
- **Decision Engine (`@provena/core`)**: `evaluateOpportunity` guarantees deterministic, non-LLM evaluations where every claim traces back to canonical profile capabilities and evidence (Invariants I-OE-1, I-OE-2, I-OE-3).
- **Shared Market & Persistence (`@provena/market-postgres`, `@provena/web`)**: Supports Greenhouse public board ingestion, deduplication keys (`makePostingDedupeKey`), PostgreSQL schema, and Cloudflare Worker handler with background Cron triggers.
- **Web App (`@provena/web`)**: `/` (Identity Timeline & Compass), `/cv` (CV Preparation), `/evaluate` (Opportunity Evaluation), `/opportunities` (Attention Inbox).

### 2. Experimental (Research & Active Experiments)
- **K12 Knowledge Acquisition**: Empirical experiments located in `experiments/k12-learning/` and `experiments/k12a/`. These test hypotheses on market requirement cluster extraction and GTM delta definitions.
- **Knowledge Versioning Guarantee**: Experimental knowledge artifacts (such as `K12-GTM-002`) do NOT alter the operational `Knowledge Version = 0` until formally promoted to production.

### 3. Not Started / Vision
- **Attention Validation**: Hypothesized reduction in job-seeking observation time; reserved for future phases.
- **Outcome Learning**: Automatic adjustment of candidate preferences based on hiring feedback; reserved for future phases.
