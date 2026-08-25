# Causal Promotion Candidate Policy — Complete Validation

**Status:** Validation only. Does not modify the policy, does not promote any pack, does not declare `Operational Knowledge Version` changed.
**Card:** CARD-018
**Input:** [`causal-promotion-candidate-policy-design.md`](causal-promotion-candidate-policy-design.md) (CARD-014, ordinal taxonomy + veto), [`causal-promotion-eligibility-independence-redesign.md`](causal-promotion-eligibility-independence-redesign.md) / [`...-validation.md`](causal-promotion-eligibility-independence-validation.md) (CARD-016/017, corpus-diversity `ELIGIBLE` clause, validated), [`causal-promotion-policy-validation.md`](causal-promotion-policy-validation.md) (CARD-015, open adversarial-veto gap).

---

**Per this card's own prohibition, the policy is not modified, the veto is not changed, `≥2 corpora` is not recalibrated, and no synthetic case is presented as real evidence.**

## 1. Adversarial veto — re-checked against the full 20-observation evidence, not just the 19 CARD-015 checked

CARD-015 §3 searched the 19 CARD-010/CARD-012 points and found no pack with both an Aligned Contribution and a Misaligned Regression signal. A 20th observation now exists (CARD-015's own new-evidence stress test, `B+SYSTEMS_INFRA→+DATA_AGENTIC` on OOS) — this card re-runs the same search over all 20 points rather than assuming CARD-015's negative result still holds unchanged.

**Per-pack signal-type membership, re-derived directly from the raw tables (CARD-010, CARD-012, CARD-015):**

| Pack `X` | Aligned Contribution instances | Misaligned Regression instances | Both present? |
|---|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | 0 (its one Aligned-Contribution-*shaped* row is the removal-audit, which is evidence about removing it, not adding it — CARD-015 §1.2) | 2 (CARD-010 standalone; CARD-012 V2 standalone) | No |
| `FINTECH_PLATFORM_KNOWLEDGE` | 3 (CARD-010 standalone; CARD-012 V2 standalone; CARD-012 v3 pairwise) | 0 | No |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | 0 | 0 | No |
| `MLOPS_KNOWLEDGE` | 0 | 0 | No |
| `DATA_AGENTIC_KNOWLEDGE` | 0 | 0 (all 3 instances — CARD-010, CARD-012 V2, CARD-015's new pairwise — are No Observable Effect) | No |
| `ADMIN_KNOWLEDGE` | 0 | 0 | No |

**No pack in the full 20-observation evidence base carries both signal types.** This confirms, rather than merely repeats, CARD-015's finding: the 20th point (added after CARD-015 was written) does not change the answer. **The adversarial veto-precedence question remains genuinely UNTESTED — not VALIDATED, not REJECTED.** No case is fabricated here to close this gap. This card's own prohibition against synthetic evidence is the same reason this stays open rather than being resolved one way or the other.

## 2. Veto precedence, as designed — confirmed unchanged, not re-evaluated for correctness

CARD-014 §4 states the design choice plainly: **any single Misaligned Regression instance is an unconditional veto**, regardless of how much Aligned Contribution evidence the same pack also has. This card does not change that rule (prohibited), and — since no real conflicting case exists (§1) — cannot re-evaluate whether that choice is *correct* on real evidence either. What this card *can* confirm is that the rule, as written, is unambiguous about precedence: CARD-014 §6's summary table places the veto row (`≥1 Misaligned Regression → VETOED`) structurally ahead of the `ELIGIBLE` row in the decision order — a pack with any Misaligned Regression is `VETOED` before its Aligned Contribution count or corpus-diversity is even evaluated. There is no code path in the *design* (this policy has not been implemented — CARD-014 §"Explicitly out of scope") where a pack could accumulate enough positive evidence to overrule a confirmed regression. The precedence is unambiguous by construction; whether it is the *right* precedence remains the open question named in §1.

## 3. Full composition — corpus-diversity criterion integrates correctly with the rest of the states

Re-checking CARD-016 §5's replacement clause against the full state table (not just the `ELIGIBLE` row it directly modified):

- **`VETOED`** (`≥1 Misaligned Regression`) — untouched by the CARD-016 redesign; still evaluated first, independent of corpus count. Confirmed in §2 above.
- **`ELIGIBLE`** (`≥1 Aligned Contribution/Aligned Regression on ≥2 distinct corpora`, `0 Misaligned Regression`) — the redesigned clause, validated by CARD-017.
- **`INSUFFICIENT`** (exactly 1 Aligned Contribution/Aligned Regression instance total, `0 Misaligned Regression`) — CARD-014's original wording ("exactly 1... total") is a comparison-count concept the CARD-016 redesign did not explicitly restate in corpus terms. Read literally against §5's new `ELIGIBLE` clause, the natural corpus-consistent reading is: `0 Misaligned Regression`, `≥1 Aligned Contribution/Aligned Regression instance`, but on only **1** distinct corpus (not "exactly 1 instance" — a pack with 3 same-corpus instances, per CARD-016 §6.1's discussion, is `INSUFFICIENT` under the corpus-diversity logic, not `ELIGIBLE`, even though it has more than "1 instance total"). **This is a genuine terminology gap between CARD-014's original §6 wording and CARD-016's redesign, not previously reconciled in either document.** No pack in the current evidence sits in this exact gap (per §1.1/§6.1 of CARD-016/017, only `FINTECH_PLATFORM_KNOWLEDGE` has any Aligned Contribution at all, and it clears 2 corpora outright) — so this composition ambiguity has no effect on any current verdict, but it is a real drafting gap this card names rather than silently resolves, since resolving it would mean editing CARD-014's or CARD-016's wording, out of this card's scope (prohibited: "modifying the policy").
- **`INCONCLUSIVE`** (both rows: only No Observable Effect, or only Sub-threshold/Misaligned Sub-threshold Movement with no qualifying instance) — untouched by the CARD-016 redesign, since it only fires when the `ELIGIBLE`/`INSUFFICIENT` necessary condition (≥1 Aligned Contribution) is never met at all; corpus-diversity is irrelevant to this state by construction.

**Composition integrates correctly for every pack actually present in the evidence** (§4 below shows no pack's verdict is ambiguous), but the `INSUFFICIENT` wording gap is a real, if currently inert, drafting inconsistency worth flagging for whoever eventually implements this policy in code.

## 4. Full replay — the complete policy applied to every available pack

| Pack `X` | Misaligned Regression? | Aligned Contribution corpora | Final verdict |
|---|---|---|---|
| `SYSTEMS_INFRA_KNOWLEDGE` | Yes (2 instances) | — (moot) | **VETOED** |
| `FINTECH_PLATFORM_KNOWLEDGE` | No | 2 distinct (OOS, V2) | **ELIGIBLE** |
| `OCCUPATIONAL_CONTEXT_KNOWLEDGE` | No | 0 | **INCONCLUSIVE** |
| `MLOPS_KNOWLEDGE` | No | 0 | **INCONCLUSIVE** |
| `DATA_AGENTIC_KNOWLEDGE` | No | 0 | **INCONCLUSIVE** |
| `ADMIN_KNOWLEDGE` | No | 0 | **INCONCLUSIVE** |
| `DEFAULT_SOFTWARE_KNOWLEDGE` | n/a — baseline, never tested as `X` | n/a | **not applicable** |

No pack is promoted by this replay. This table is a record of what the policy *would* output, not a promotion action.

## 5. Overall verdict

**POLICY VALIDATED as an instrument — with one specific, named component left open, not smoothed into a pass:**

- **Full replay (§4)**: deterministic, unambiguous, produces exactly one verdict per pack with no case requiring judgment calls this card had to make. **Validated.**
- **Composition (§3)**: the corpus-diversity `ELIGIBLE` clause integrates correctly with `VETOED` and `INCONCLUSIVE`; one wording gap found in the unused corner of `INSUFFICIENT` (§3), named but not resolved since it currently affects zero real verdicts and fixing it means editing the policy text, out of scope. **Validated, with a named drafting gap for future implementation to resolve.**
- **Veto precedence (§2)**: unambiguous by construction in the design as written. **Validated as a design property** — not validated (and not falsified) as the *correct* choice, since §1 confirms no real case exists to test it against.
- **Adversarial veto (§1)**: re-confirmed **UNTESTED** across the full 20-observation evidence base, including the point added since CARD-015. Not fabricated to force a result either way.

**This authorizes moving toward promotion in the sense CARD-013 originally scoped**: the policy is now a fully-specified, internally-consistent instrument that has been checked against every real case the current evidence can pose. **It does not authorize skipping the adversarial-veto gap** — any future promotion-authority card should carry `FINTECH_PLATFORM_KNOWLEDGE`'s `ELIGIBLE` verdict forward with this caveat attached explicitly: the policy has never been tested on a pack that presents mixed signals, and `FINTECH_PLATFORM_KNOWLEDGE` itself is not such a case (§1 confirms it has zero Misaligned Regression instances), so this gap does not block `FINTECH_PLATFORM_KNOWLEDGE`'s own verdict specifically — but it remains a real, open limit on the policy's general trustworthiness for any *future* pack that might present mixed evidence.

## Explicitly out of scope for this card

- Modifying the policy, the veto, or the `≥2 distinct corpora` clause.
- Fabricating a same-pack Aligned-Contribution + Misaligned-Regression case.
- Promoting `FINTECH_PLATFORM_KNOWLEDGE` or any pack.
- Declaring `Operational Knowledge Version` changed.
- Reconciling `roadmap.md`, `project-status.md`, or `knowledge-promotion-contract.md`.
- Resolving the `INSUFFICIENT` wording gap named in §3 (requires editing CARD-014/CARD-016's text — a policy modification, prohibited here).
