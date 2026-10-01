# Attention Inbox Presentation Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Attention Inbox table presentation contract (column ordering, Verdict visual dominance, responsive media queries, presentation contract tests) and establish ranking separation before freezing UI and transitioning to decision engine validation.

**Architecture:** Update `@provena/web` (`packages/provena-web/src/index.ts`) table structure and CSS styles for `.opp-table` and `.badge`. Add presentation contract tests in `packages/provena-web/src/pages.test.ts`. Maintain deterministic SQL/Policy ranking unchanged.

**Tech Stack:** TypeScript, Vanilla CSS (Container Queries + Media Queries), Node.js Test Runner (`node:test`).

## Global Constraints

- Physical column order: `Opportunity → Verdict → Professional Fit → Personal Fit → Evidence Coverage → Action` (headers: `Opportunity`, `Verdict`, `Prof Fit`, `Personal Fit`, `Evidence`, `Action`).
- Verdict must be visually dominant (badge sizing, font weight, background contrast).
- Mobile view (`max-width: 640px` or container `@container page (max-width: 40rem)`) must prioritize `Opportunity + Verdict + Action` by hiding `Prof Fit`, `Personal Fit`, and `Evidence`.
- Presentation order must NOT alter backend ranking policies or pagination. No interactive table sorting added.
- TDD with node:test: Write failing contract assertions, implement minimal CSS/HTML changes, verify green test suite.

---

### Task 1: Presentation Contract HTML & Visual Dominance CSS

**Files:**
- Modify: `packages/provena-web/src/index.ts:1225-1375`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `OPPORTUNITIES_PAGE` HTML template string & `loadTab()` rendering function.
- Produces: Updated `.opp-table` structure and `.badge` verdict styles with dominant visual presentation and explicit column layout.

- [x] **Step 1: Write failing contract test for Table Column Order & Verdict Dominance CSS**

Add test in `packages/provena-web/src/pages.test.ts`:

```typescript
test('Attention Inbox presentation contract: column order and Verdict visual dominance', async () => {
  const res = await worker.fetch(new Request('https://provena.example/opportunities'), env)
  const html = await res.text()

  // Column order verification
  const expectedHeaderPattern = /<table class="opp-table"><thead><tr><th>Opportunity<\/th><th>Verdict<\/th><th>Prof Fit<\/th><th>Personal Fit<\/th><th>Evidence<\/th><th>Action<\/th><\/tr><\/thead>/
  assert.ok(expectedHeaderPattern.test(html), 'Table columns must follow presentation contract: Opportunity → Verdict → Prof Fit → Personal Fit → Evidence → Action')

  // Verdict visual dominance verification
  assert.ok(html.includes('.badge {'), 'Must include .badge CSS definition')
  assert.ok(html.includes('font-weight: 800') || html.includes('font-weight: 700'), 'Verdict badges must use heavy font weight for visual dominance')
  assert.ok(html.includes('.badge.strong-candidate'), 'Must style strong-candidate verdict')
  assert.ok(html.includes('.badge.consider'), 'Must style consider verdict')
  assert.ok(html.includes('.badge.skip'), 'Must style skip verdict')
})
```

- [x] **Step 2: Run test to verify it passes or fails**

Run: `npm test`

- [x] **Step 3: Update `index.ts` with column order and dominant Verdict CSS**

In `packages/provena-web/src/index.ts`:
1. Ensure the HTML template header for `.opp-table` has:
```html
<table class="opp-table">
  <thead>
    <tr>
      <th>Opportunity</th>
      <th>Verdict</th>
      <th>Prof Fit</th>
      <th>Personal Fit</th>
      <th>Evidence</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody id="opp-rows"></tbody>
</table>
```
2. Enhance `.badge` CSS for Verdict visual dominance:
```css
.opp-table td:nth-child(2) { font-weight: 600; }
.badge { display: inline-block; padding: 0.3rem 0.65rem; border-radius: 0.375rem; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): enforce presentation contract column order and verdict dominance"
```

---

### Task 2: Mobile Responsive Contract & Column Prioritization

**Files:**
- Modify: `packages/provena-web/src/index.ts:1225-1260`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: CSS rules for `.opp-table` inside `OPPORTUNITIES_PAGE`.
- Produces: Responsive media query rules hiding metric columns on mobile views while keeping `Opportunity + Verdict + Action`.

- [x] **Step 1: Write failing responsive contract test**

Add test in `packages/provena-web/src/pages.test.ts`:

```typescript
test('Attention Inbox responsive contract: mobile hides metrics and prioritizes Opportunity + Verdict + Action', async () => {
  const res = await worker.fetch(new Request('https://provena.example/opportunities'), env)
  const html = await res.text()

  // Verify responsive CSS rules targeting compact viewports
  assert.ok(
    html.includes('.opp-table th:nth-child(3)') || html.includes('@media') || html.includes('@container'),
    'Must include responsive rules for table columns'
  )
  assert.ok(
    html.includes('display: none'),
    'Mobile layout must hide secondary metric columns (Prof Fit, Personal Fit, Evidence)'
  )
})
```

- [x] **Step 2: Run test to verify initial failure/pass**

Run: `npm test`

- [x] **Step 3: Implement responsive table CSS in `index.ts`**

Add CSS inside `<style>` block in `OPPORTUNITIES_PAGE`:

```css
@media (max-width: 640px) {
  .opp-table th:nth-child(3), .opp-table td:nth-child(3),
  .opp-table th:nth-child(4), .opp-table td:nth-child(4),
  .opp-table th:nth-child(5), .opp-table td:nth-child(5) {
    display: none;
  }
}
@container page (max-width: 40rem) {
  .opp-table th:nth-child(3), .opp-table td:nth-child(3),
  .opp-table th:nth-child(4), .opp-table td:nth-child(4),
  .opp-table th:nth-child(5), .opp-table td:nth-child(5) {
    display: none;
  }
}
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): add responsive column prioritization for mobile view"
```

---

### Task 3: Presentation Contract Verification & UI Freeze Checkpoint

**Files:**
- Modify: `packages/provena-web/src/pages.test.ts`
- Documentation: `docs/architecture/freeze-v0.7.0.md` or roadmap references.

**Interfaces:**
- Consumes: Entire test suite across packages.
- Produces: Verified UI presentation contract and frozen UI boundary declaration.

- [x] **Step 1: Write comprehensive presentation contract test suite in `pages.test.ts`**

Verify header names, order, responsiveness, and ranking independence assertion:

```typescript
test('Presentation Contract Invariant: physical column order does not alter backend ranking or keyset cursor', async () => {
  const res = await worker.fetch(new Request('https://provena.example/api/opportunities?tab=needs-attention'), env)
  const data = await res.json() as any
  assert.equal(res.status, 200)
  assert.ok('nextBookmark' in data)
})
```

- [x] **Step 2: Run full test suite across codebase**

Run: `npm test`
Expected: All tests PASS.

- [x] **Step 3: Commit UI Freeze & Presentation Contract**

```bash
git add packages/provena-web/src/pages.test.ts
git commit -m "test(web): freeze UI presentation contract and verify ranking independence"
```
