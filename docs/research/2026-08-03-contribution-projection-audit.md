# Empirical Audit Report: Contribution Projections across Decision Contexts

Date: 2026-08-03
Profile: `profiles/valentin`
Status: Complete

## Executive Summary

This audit evaluates how Provena's selection pipeline (R4 / R6 / `cvProjector`) selects and ranks fine-grained `Contribution` entities across four distinct Decision Contexts:

- **Context A (Staff Software Engineer)**: Architecture / Productivity / AI / Systems
- **Context B (Senior Backend Engineer)**: Java / Spring / Distributed Systems / Kafka
- **Context C (AI-Assisted Engineering / Productivity)**: AI Workflows / Team Velocity / Tooling
- **Context D (Software Quality / Research)**: Formal Methods / Mutation Testing / Verification

---

## 1. Context Projections Summary

### Context A (Staff Software Engineer)
- **Headline**: *"Staff Software Engineer"*
- **Summa Networks**: *Contribution Level: Core* (4/4 budget slots used)
  - `summa-clean-architecture`: "Designed a Clean Architecture proposal... (Outcome: Adopted as SMSC foundation)"
  - `summa-roadmap-ownership-4g-core`: "Evolved role to own product roadmap... (Outcome: Shifted to strategic architecture)"
  - `summa-telecom-modernization`: "Drove modernization initiatives... (Outcome: Upgraded platform capabilities)"
  - `summa-ai-assisted-engineering`: "Established AI-assisted engineering... (Outcome: Partnered with AI Lead)"
- **Projects**: Omitted academic research projects (treated as Historical).

### Context B (Senior Backend Engineer)
- **Headline**: *"Senior Software Engineer"*
- **Summa Networks**: *Contribution Level: Supporting* (Compressed budget: 2 slots)
  - `summa-telecom-modernization`: Selected via Java/Spring/backend signals.
  - `summa-ai-assisted-engineering`: Selected via engineering reference.
- **knowmad mood**: *Contribution Level: Core* (Distributed microservices & cloud take center stage).

### Context C (Developer Productivity / AI-Assisted Engineering)
- **Headline**: *"Lead Productivity Engineer"*
- **Summa Networks**: *Contribution Level: Core* (4/4 budget slots used)
  - `summa-ai-assisted-engineering`: Ranked #1 via AI & productivity stems.
  - `summa-maintainability-velocity`: Selected ("Reduced team friction and accelerated feature delivery velocity").
  - `summa-clean-architecture`: Selected via architecture maintainability.
  - `summa-roadmap-ownership-4g-core`: Selected via strategic leadership.

### Context D (Software Quality / Research)
- **Headline**: *"Software Quality Researcher"*
- **Summa Networks**: *Contribution Level: Supporting* (2 slots)
- **Universidad de Cádiz (Software Developer)**: *Contribution Level: Core* (Mutation testing & formal verification rank #1).
- **Projects Included**:
  - `Autoseed — Mutation-based Test Generation` (Core)
  - `WS-BPEL Mutation Operators` (Core)

---

## 2. Selection Matrix

| Contribution ID | Scope | Context A (Staff) | Context B (Backend) | Context C (AI/Prod) | Context D (Research) |
| --- | --- | --- | --- | --- | --- |
| `summa-clean-architecture` | product (initiator) | ✅ Selected | ❌ Omitted | ✅ Selected | ✅ Selected |
| `summa-ai-assisted-engineering` | organization (lead) | ✅ Selected | ✅ Selected | ✅ Selected | ✅ Selected |
| `summa-roadmap-ownership-4g-core` | product (lead) | ✅ Selected | ❌ Omitted | ✅ Selected | ❌ Omitted |
| `summa-telecom-modernization` | product (contributor) | ✅ Selected | ✅ Selected | ❌ Omitted | ❌ Omitted |
| `summa-maintainability-velocity` | team (lead) | ❌ Omitted | ❌ Omitted | ✅ Selected | ❌ Omitted |

---

## 3. Key Observations & System Gaps

### 1. Granular Selection Proven Effective
Different Decision Contexts select noticeably different bullet sets from the exact same company history (`Summa Networks`).
- Staff context selects architecture + roadmap + modernization.
- AI/Productivity context selects AI workflows + team velocity + maintainability.
- Research context promotes academic projects & mutation testing to `Core` while compressing backend experiences to `Supporting`.

### 2. Gap: Scope Level is Unused by R6
`Contribution.scope` (`level: organization | product | team`, `role: initiator | lead | contributor`) is stored in `contributions.yaml`, but **R6 currently ranks contributions purely using vocabulary stems and EvidenceClass regexes**.
- *Example*: A Staff role context should give higher structural weight to `level: organization` or `level: product` than `level: team`, even if vocabulary stem hits are equal.

### 3. Gap: Experience-Level vs. Contribution-Level Classification
Currently `ExperienceContribution` (`Core | Supporting | Historical`) is computed at the **Experience level**, which determines the bullet budget for the entire experience.
- Evaluating contribution level at the **individual `Contribution` level** will allow fine-grained budgeting across trajectory units.

### 4. Gap: Evidence Epistemic Quality
`Outcome.summary` currently operates as an asserted string. Evidence classification (`EvidenceClass.Adopted`) uses regex matching on the text string rather than verifying linked `evidenceIds`.
