# Step 9 — Contextual Disambiguation & Occupational Context Design

> **Guardrail Invariant:** Missed Opportunity Rate ($\text{MOR}$) must remain strictly **$0.0\%$ ($FN = 0$)**. Contextual disambiguation silences adversarial false positives without missing any genuine opportunity.

---

## 1. Executive Summary

Step 8 successfully falsified simple market recognition on Corpus v2 (55 opportunities), revealing 23 false positives ($FP$) caused by missing **Occupational Context**.

Step 9 introduces **Contextual Occupational Interpretation** into `MarketKnowledge` to disambiguate role scope, delivery mode, and technical domain without altering the core decision evaluator or violating the $0\%$ MOR guardrail.

---

## 2. Adversarial False Positive Clusters

| Cluster | Adversarial Pattern | Extracted Signal | Correct Occupational Scope |
| :--- | :--- | :--- | :--- |
| **Cluster A** | "Engineering Manager - 0% coding, 100% people management" | `management_scope` | `people_management` (Out of IC profile scope) |
| **Cluster B** | "Enterprise Pre-Sales Solutions Architect" | `pre_sales_enablement` | `pre_sales` (Out of IC engineering scope) |
| **Cluster C1** | "C++ Game Engine & Graphics Renderer" | `graphics_rendering` | `game_graphics` (Out of backend cloud scope) |
| **Cluster C2** | "Microcontroller Firmware & Embedded Systems" | `hardware_firmware` | `embedded_hardware` (Out of cloud infra scope) |
| **Cluster C3** | "Staff Frontend Systems Architect" | `ui_architecture` | `frontend_ui` (Out of backend infra scope) |

---

## 3. Architecture & Schema Extensions

```text
Raw JD Prose
    │
    ▼
DeclarativeMarketRecognizer (Enriched with OCCUPATIONAL_CONTEXT_KNOWLEDGE)
    │
    ├── Capability Patterns (Go, K8s, Envoy)
    ├── Qualification Qualifiers (required vs preferred)
    └── Occupational Context Patterns (IC vs Management, Pre-Sales, Embedded)
    │
    ▼
MarketModel (Enriched with occupationalScope)
    │
    ▼
evaluateOpportunity(...)
    │
    ▼
Verdict: SKIP (Out of profile scope) vs APPLY/CONSIDER (In profile scope)
```

### Extended `MarketPatternDefinition` & `MarketModel`

In `packages/core/src/market.ts` & `market-knowledge.ts`:
- Extend `RequirementKind` to include `'occupational_scope'` or attach `occupationalScope` signals (`ic_engineering` | `people_management` | `pre_sales` | `embedded_hardware` | `game_graphics` | `frontend_ui`).

---

## 4. Benchmark Metric Targets & Guardrails

- **Missed Opportunity Rate ($\text{MOR}$)**: **STRICTLY $0.0\%$ ($FN = 0$)** *(Primary Safety Invariant)*
- **Attention Reduction ($\uparrow$)**: Recover from $18.0\%$ to $>60.0\%$ on Corpus v2
- **Attention Precision ($\uparrow$)**: Recover from $49.0\%$ to $>85.0\%$ on Corpus v2
- **False Positive Reduction**: Reduce 23 $FP$ items down to $< 5$ items.
