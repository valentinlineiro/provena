# Concept

## From Profile Compiler to Continuous Market Observer

Provena combines a **Canonical Professional Identity** with a **Continuous Market Observation Engine** to minimize human attention in job discovery.

```text
Canonical Identity  ──►  Continuous Observation  ──►  Deterministic Assessment  ──►  Attention Inbox
```

---

## 1. Canonical Identity (The Foundation)

Professional identity is not an abstraction or a PDF — it is a referentially sound body of experience, capabilities, and evidence. Provena models those facts once in plain YAML:

- **Domain Model**: Pure, validated identity entities (`Person`, `Experience`, `Capability`, `Evidence`). Skills carry explicit evidence references.
- **Projections**: Context-optimized representations (`Resume`, `LinkedIn`, `Career Compass`) derived directly from the identity without mutating it.

> **Authority flows inward. Formatting flows outward.**

---

## 2. Continuous Market Observation & Decision Engine

Once canonical identity is established, Provena turns outward to observe the job market continuously:

- **Sources (`/sources`)**: Observation adapters poll ATS job boards (Greenhouse, Ashby, Lever) to build a global, deduplicated market catalog.
- **Decision Engine (Protocol v1)**: Deterministic evaluation functions (`evaluateOpportunity(jd, profile)`) measure professional fit, personal fit, and recognition coverage.
- **Attention Inbox (`/opportunities`)**: Evaluated market postings are sorted into semantic attention tabs (`Needs Attention`, `Worth Considering`, `Unresolved`, `Decided`).

---

## 3. Preserved Attention ("Helping to look less")

The ultimate purpose of Provena is not to help you browse longer or generate endless CV variations.

It is to filter out market noise automatically and preserve human attention for decisions that truly matter.

> **Traditional job platforms optimize for engagement.**
>
> **Provena optimizes for preserved attention.**
