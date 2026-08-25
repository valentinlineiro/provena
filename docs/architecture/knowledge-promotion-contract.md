# Operational Knowledge Promotion Contract

**Status:** Active — defines the gate a pack must clear to be promoted. Two packs have cleared a promotion gate so far: `DEFAULT_SOFTWARE_KNOWLEDGE` (CARD-002/003, this contract's original §2/§3 isolated-benchmark gate) and `FINTECH_PLATFORM_KNOWLEDGE` (CARD-014–019, the causal-contribution policy that superseded §3 after CARD-007 found it structurally blind to any pack's real effect — see [`ADR-003`](adr/ADR-003-knowledge-promotion-mechanism.md) and [`causal-promotion-policy-complete-validation.md`](causal-promotion-policy-complete-validation.md)). This document itself does not perform a promotion or change `Operational Knowledge Version` — it defines eligibility; promotion is executed by a separate promotion-record card each time.
**Scope:** Governs when an experimental market knowledge pack becomes part of `Operational Knowledge Version 1` — see [`operational-knowledge-v1.md`](operational-knowledge-v1.md) for the current composition and full per-pack lineage.
**Non-goals:** This document does not perform a promotion and does not modify code. Promotion execution and regression-suite wiring are separate follow-up work gated on this contract.

---

## 1. What "Operational Knowledge" means today

`Operational Knowledge Version` is currently a documentation-level governance concept — there is no `knowledgeVersion` constant in `packages/core/src` tied to it. The composite default knowledge set (`default-knowledge.ts`) already includes packs of differing evidentiary maturity:

| Pack | Location | Exercised in a frozen OOS/adversarial benchmark? |
|---|---|---|
| `DEFAULT_SOFTWARE_KNOWLEDGE` | `market-knowledge.ts` | Yes — base of every benchmark below |
| `SYSTEMS_INFRA_KNOWLEDGE` | `domain-knowledge.ts` | Yes — H8 (`attention-validation-h8.test.ts`), Step 10 OOS (`attention-validation-step10.test.ts`) |
| `FINTECH_PLATFORM_KNOWLEDGE` | `domain-knowledge.ts` | Yes — H8, Step 10 OOS |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | `domain-knowledge.ts` | Yes — Step 10 OOS only (introduced to address H8's border-case failures) |
| `MLOPS_KNOWLEDGE` | `knowledge/mlops.ts` | No — wired into the default composite and covered by K12A Specimen #1's 4-gate validation, but not exercised by the Step 10 OOS/H8 benchmarks read for this contract |
| `DATA_AGENTIC_KNOWLEDGE` | `knowledge/data-agentic.ts` | No — same as above, K12A Specimen #2 |

This split is the reason a promotion contract is needed: "already in the default composite" and "empirically validated for v1" are not the same claim, and the codebase currently conflates them by including all packs in the same default set.

---

## 2. Eligibility

A knowledge pack is eligible for `Operational Knowledge Version 1` only if **both** hold:

1. It is exercised by name (via `composeKnowledge(...)`) inside a benchmark that runs against an **out-of-sample corpus** — a corpus the pack's own authoring/induction process was structurally prevented from observing (see `experiments/k12-learning/stripe-gap-clusters/K12-GTM-002-spec.md`'s "VirginHoldout" isolation rule for the standard this mirrors).
2. That benchmark run satisfies every threshold in §3, on the OOS corpus, with the pack included.

A pack is **not** eligible on the strength of:
- being present in `default-knowledge.ts`'s composite export,
- passing only against the corpus it was authored/discovered on (Discovery-only coverage, no holdout transfer),
- passing a K12 GTM promotion criteria (RecoveryGain / HoldoutTransfer / ControlContamination / Discriminativity) alone — those gate entry into K12's own experimental delta, not entry into `Operational Knowledge Version 1`. K12 promotion and Operational Knowledge promotion are sequential, not equivalent.

---

## 3. Required benchmarks and thresholds

These are the machine-checked thresholds already asserted in the frozen benchmark suite (`packages/core/src/attention-validation-step10.test.ts`, `attention-validation-h8.test.ts`). Promotion re-uses them rather than inventing new ones:

| Metric | Threshold | Source assertion |
|---|---|---|
| Missed Opportunity Rate (MOR) | `<= 5%` (0% preferred) — **strict safety guardrail** | Step 10 OOS test |
| Attention Reduction (OOS) | `>= 50%` | Step 10 OOS test |
| Attention Precision (OOS) | `>= 75%` | Step 10 OOS test |
| Corpus scale | `>= 50` items, out-of-sample | Step 10 OOS test |
| Border-case attention reduction (adversarial) | `>= 18%` under Corpus v2 stress | H8 test |

A candidate pack must be added to the `composeKnowledge(...)` call used by an OOS-style benchmark (same shape as `attention-validation-step10.test.ts`) run over a corpus it has not seen during induction, and the run must meet every row above. A pack that improves Discovery-set metrics but degrades any OOS threshold is rejected, not promoted with caveats.

---

## 4. Invariants that promotion must not break

Promotion changes *which knowledge feeds the evaluator* — it must never change *how* the evaluator decides. Specifically, promoting a pack must preserve:

- **Protocol v1 determinism**: `evaluateOpportunity(jd, profile)` remains a pure, non-LLM, deterministic function (Invariants I-OE-1, I-OE-2, I-OE-3 per `docs/architecture/freeze-v0.7.0.md`).
- **APPLY / CONSIDER / SKIP semantics**: the verdict vocabulary and evidence-traceability contract (every claim traces to canonical profile capability/evidence) is unchanged.
- **MOR guardrail**: the `<= 5%` MOR ceiling from §3 is a floor for *all* promoted knowledge combined, not just the candidate pack in isolation — a pack that is individually compliant but pushes the combined OOS MOR above 5% when composed with already-promoted packs is not eligible.
- **Frozen platform boundary**: promotion is a knowledge-layer change; it must not require modifying anything classified `Stable`/frozen in `docs/architecture/freeze-v0.7.0.md` (Identity Domain, Decision Engine, Shared Market Architecture). If a candidate pack's promotion would require such a change, that is out of this contract's scope and needs its own ADR.

---

## 5. Explicitly out of scope for this contract

Per the card that produced this document (`CARD-001`), the following are deliberately **not** done here and require separate, later work once this contract is accepted:

- Promoting any specific pack (`SYSTEMS_INFRA_KNOWLEDGE`, `FINTECH_PLATFORM_KNOWLEDGE`, `OCCUPATIONAL_CONTEXT_KNOWLEDGE`, or others).
- Incrementing `Operational Knowledge Version` from `0` to `1`, anywhere (docs or code).
- Making production consume a distinguished "v1" knowledge set instead of the current default composite.
- Building the regression suite (Corpus v1/v2/v3 OOS + MOR guardrail) as a standing CI gate.
- Updating `roadmap.md` / `project-status.md` / release notes to reflect promotion having happened.
