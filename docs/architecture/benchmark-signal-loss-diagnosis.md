# Diagnosis: Where the Isolated-OOS Benchmark Loses Pack Signal

**Card:** CARD-007
**Lineage:** [`ADR-003`](adr/ADR-003-knowledge-promotion-mechanism.md) ← CARD-002/004/005
**Verdict: structural, not a wiring defect.** The knowledge pack's signal survives intact through every stage up to and including the per-item verdict. It is discarded by design at the aggregation step the promotion metrics are computed from.

---

## Method

Traced `EMPTY` (`patterns: []`) vs. `DEFAULT_SOFTWARE_KNOWLEDGE` through every stage of the pipeline named in this card, for 3 real Corpus v3 OOS items (`oos-01`, `oos-02`, `oos-03`, all `WORTH_ATTENTION` ground truth), by calling `evaluateOpportunity` directly and inspecting its full return value (not just the final verdict).

```
knowledge pack → composeKnowledge/DeclarativeMarketRecognizer → extractMarketRequirements
              → MarketModel → evaluateOpportunity → runVerdictQualityBenchmark
              → runAttentionValidationAtScale → runOutOfSampleValidationBenchmark
```

## Result — the signal does NOT disappear where expected

| Item | Pack | `marketModel.requirements.length` | `coverage` | per-item `verdict` |
|---|---|---|---|---|
| oos-01 | EMPTY | 0 | 0 | `consider` |
| oos-01 | DEFAULT_SOFTWARE | 3 | 1 | `apply` |
| oos-02 | EMPTY | 0 | 0 | `consider` |
| oos-02 | DEFAULT_SOFTWARE | 1 | 1 | `apply` |
| oos-03 | EMPTY | 0 | 0 | `consider` |
| oos-03 | DEFAULT_SOFTWARE | 1 | 1 | `apply` |

Every intermediate stage — `MarketModel`, `coverage`, `interpretationCoverage`, and even the per-item `verdict` field itself — **does** differ between `EMPTY` and `DEFAULT_SOFTWARE_KNOWLEDGE`. The recognizer is correctly wired end to end; this is not a plumbing bug.

## Where it actually gets lost

`evaluateOpportunity` (`packages/core/src/opportunity.ts:1111-1116`):

```ts
const violated = criteria.find(c => c.status === 'violated')
const verdict: Verdict = violated
  ? 'skip'
  : coverage >= APPLY_COVERAGE_THRESHOLD && interpretationCoverage >= APPLY_INTERPRETATION_THRESHOLD
    ? 'apply'
    : 'consider'
```

`coverage` (derived from the knowledge pack via `marketModel`) only ever chooses **between `apply` and `consider`**. The only way to get `skip` is a `violated` entry in `criteria` — and `criteria` is `[checkCompensation(jd, prefs), checkWorkMode(jd, prefs), checkRoles(jd, prefs), checkAvoid(jd, prefs)]` (`opportunity.ts:1070-1075`). All four functions take `(jd, prefs)` — **none of them take `recognizer` or `marketModel` as an argument at all.** They match the job description text directly against `profile.preferences` (compensation floor, work mode, role family, avoid-list) — a path completely independent of any knowledge pack.

Then, one layer up, `runVerdictQualityBenchmark` (`verdict-benchmark.ts:60-70`) buckets the per-item verdict:

```ts
} else if (verdict === 'apply' || verdict === 'consider' || verdict === 'interested') {
  // counted as "surfaced" (tp or fp)
} else if (verdict === 'skip' || verdict === 'dismissed') {
  // counted as "silenced" (tn or fn)
}
```

`apply` and `consider` — the only two outcomes the knowledge pack can actually influence — are merged into the same "surfaced" bucket. The three §3 promotion metrics (`missedOpportunityRate`, `attentionReduction`, `attentionPrecision`) are all computed from the surfaced/silenced split, i.e. from `skip`/`dismissed` vs. everything else. Since the pack can never produce `skip` — only the pack-independent `criteria` checks can — the pack's real, observable effect (`apply` vs `consider`, `coverage` 0 vs 1) is invisible to exactly the three numbers the contract gates on.

## Answer to the card's question

> **¿En qué punto de esta cadena deja de producirse una diferencia observable entre `EMPTY` y los packs reales?**

Not in the pipeline stages — the difference is observable all the way through `evaluateOpportunity`'s returned `verdict` field. It is discarded one step later, in the surfaced/silenced aggregation that `runVerdictQualityBenchmark` and `runAttentionValidationAtScale` compute the promotion metrics from, because that aggregation treats `apply` and `consider` as equivalent, and `skip` is gated entirely by preference-criteria checks that never consume the knowledge pack.

## Implication for ADR-003 (stated, not decided)

ADR-003 named two scenarios that would tip the calculus differently: a narrow wiring defect (favors redesign-as-small-fix) vs. a structural limitation (favors treating redesign as materially harder, or favors elimination). This diagnosis places the finding in the **structural** category: it is not a bug to patch, it is a property of how `evaluateOpportunity`'s verdict is derived and how the benchmark aggregates it. Any redesign under Alternative A would need to either change what the promotion metric measures (e.g. use `coverage`/`apply`-vs-`consider` directly, not the surfaced/silenced split) or change what counts as "silenced" — both are non-trivial changes to code this card is explicitly not authorized to make.

## Explicitly out of scope for this card

- Modifying `evaluateOpportunity`, `runVerdictQualityBenchmark`, `runAttentionValidationAtScale`, or the promotion contract's metrics.
- Choosing between ADR-003's Alternative A (redesign) and Alternative B (eliminate) — that remains ADR-003's decision, informed by this diagnosis but not made here.
- Promoting any additional pack.
- Reconciling the unrelated `ADR-003` numbering collision noted in CARD-006's HANSEI (administrative, not causal).
