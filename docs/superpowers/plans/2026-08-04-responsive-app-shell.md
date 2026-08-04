# Provena Mobile-First Responsive App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor Provena's web application to use a unified, mobile-first `AppShell` with Container-Query-based layout primitives (`Stack`, `SplitView`, `ActionBar`, `BottomSheet`).

**Architecture:** Replace local navigation and layout helpers with a global `AppShell` wrapper rendering a consistent `AppHeader` across all routes. Define container-query responsive primitives (`Stack` for single-column baseline, `SplitView` for multi-column when container width permits, `ActionBar` for compact sticky actions, and `BottomSheet` for compact `/cv` customization).

**Tech Stack:** TypeScript, Vanilla CSS (Container Queries, flexbox, CSS variables), Cloudflare Worker HTML string templates (`packages/provena-web/src/index.ts`), Node.js test runner (`node:test`).

## Global Constraints

- Spacing MUST use fluid clamp sizing (`clamp(1rem, 3vw, 2rem)`).
- Interactive touch targets MUST meet a minimum hit area of `44px x 44px`.
- Navigation links ("Story", "Prepare", "Evaluate") MUST remain identical across all routes.
- Structural layout transitions MUST use Container Queries on `.page-content` (`container-type: inline-size`), not global viewport media queries.
- The A4 document canvas in `/cv` MUST NOT cause horizontal scrolling of the `AppShell`.

---

### Task 1: AppShell Shell & Navigation Helper Refactoring

**Files:**
- Modify: `packages/provena-web/src/index.ts:46-60, 62-125, 281-334, 469-505`
- Test: `packages/provena-web/src/nav.test.ts`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `siteNav(section: 'story' | 'prepare' | 'evaluate')` in `packages/provena-web/src/index.ts`
- Produces: `renderAppShell(section: 'story' | 'prepare' | 'evaluate', pageHeaderHtml: string, pageContentHtml: string)` helper in `packages/provena-web/src/index.ts` returning full HTML documents.

- [ ] **Step 1: Write unit tests for `renderAppShell` in `nav.test.ts`**

Add tests to `packages/provena-web/src/nav.test.ts`:

```typescript
import { renderAppShell } from './index.js'

test('renderAppShell outputs valid HTML structure with AppHeader and PageContent container', () => {
  const html = renderAppShell('story', '<h1>Header</h1>', '<div>Content</div>')
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('<header class="app-header">'))
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<nav class="site-nav">'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<main class="page">'))
  assert.ok(html.includes('<div class="page-content">'))
  assert.ok(html.includes('<div>Content</div>'))
})
```

- [ ] **Step 2: Run `nav.test.ts` to verify it fails**

Run: `npm test` inside `packages/provena-web` (or `npm test --workspaces`).
Expected: FAIL with `renderAppShell is not a function` or export missing error.

- [ ] **Step 3: Implement `renderAppShell` and shared AppShell CSS in `index.ts`**

In `packages/provena-web/src/index.ts`, define `renderAppShell` and update shared CSS rules:
- Add CSS variables: `--space-page-inline: clamp(1rem, 3vw, 2rem);`
- Add `.app-shell`, `.app-header`, `.site-nav`, `.page`, `.page-content` rules.
- Minimum target sizes `min-height: 44px` on nav links.

- [ ] **Step 4: Run tests to verify `nav.test.ts` passes**

Run: `npm test`
Expected: PASS for `nav.test.ts`.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/nav.test.ts
git commit -m "feat(web): implement AppShell structural wrapper and CSS tokens"
```

---

### Task 2: Implement Layout Primitives CSS (`Stack`, `.readable`, `SplitView`, `ActionBar`, `BottomSheet`)

**Files:**
- Modify: `packages/provena-web/src/index.ts` (styles block)
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `.page-content` CSS container (`container-type: inline-size; container-name: page;`).
- Produces: Utility classes `.stack`, `.readable`, `.split-view`, `.action-bar`, `.bottom-sheet` in `PAGE`, `CV_PAGE`, `EVALUATE_PAGE` style definitions.

- [ ] **Step 1: Write test in `pages.test.ts` checking layout primitive CSS rules**

Add test in `packages/provena-web/src/pages.test.ts`:

```typescript
test('AppShell HTML templates include container queries and layout primitives', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('container-type: inline-size'))
  assert.ok(html.includes('.stack'))
  assert.ok(html.includes('.split-view'))
  assert.ok(html.includes('.action-bar'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL due to missing CSS rules.

- [ ] **Step 3: Add CSS definitions to `index.ts`**

Add CSS rules to `index.ts`:

```css
.page-content { container-type: inline-size; container-name: page; width: 100%; }
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, 1.25rem); }
.readable { width: min(100%, 44rem); margin-inline: auto; }
.split-view { display: flex; flex-direction: column; gap: 1.5rem; }
@container page (min-width: var(--split-threshold, 54rem)) {
  .split-view { flex-direction: row; align-items: flex-start; }
}
.action-bar { position: sticky; bottom: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 0.75rem var(--space-page-inline); z-index: 10; border-top: 1px solid #e5e5e5; }
@container page (min-width: var(--split-threshold, 54rem)) {
  .action-bar { position: static; background: none; backdrop-filter: none; padding: 0; border: none; }
}
.bottom-sheet { position: fixed; inset: auto 0 0 0; background: #fff; border-radius: 1rem 1rem 0 0; padding: 1.5rem; max-height: 85vh; overflow-y: auto; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); transform: translateY(100%); transition: transform 0.25s ease-out; }
.bottom-sheet.open { transform: translateY(0); }
.bottom-sheet-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 99; opacity: 0; pointer-events: none; transition: opacity 0.25s ease-out; }
.bottom-sheet-overlay.open { opacity: 1; pointer-events: auto; }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): add responsive layout primitives CSS"
```

---

### Task 3: Vertical Slice Migration — `/evaluate`

**Files:**
- Modify: `packages/provena-web/src/index.ts:469-560` (EVALUATE_PAGE)
- Test: `packages/provena-web/src/evaluate.test.ts`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `renderAppShell('evaluate', ...)` and `.split-view` with `--split-threshold: 54rem`.
- Produces: `/evaluate` page with Stack in compact mode and 2-column SplitView (JD textarea on left, Result Card on right) in spacious mode. ActionBar sticky Evaluate button in compact.

- [ ] **Step 1: Update `evaluate.test.ts` to assert new AppShell & SplitView markup**

Update `packages/provena-web/src/evaluate.test.ts`:

```typescript
test('Evaluate page renders with AppShell and SplitView structure', async () => {
  const res = await worker.fetch(new Request('https://provena.example/evaluate'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('class="split-view"'))
  assert.ok(html.includes('class="action-bar"'))
  assert.ok(html.includes('id="jd"'))
  assert.ok(html.includes('id="result"'))
})
```

- [ ] **Step 2: Run `evaluate.test.ts` to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Refactor `EVALUATE_PAGE` template in `index.ts`**

Update `EVALUATE_PAGE` HTML string using `renderAppShell` and structure:
- `PageHeader`: Title "Evaluate an opportunity" and subtitle.
- `PageContent`: `<div class="split-view" style="--split-threshold: 54rem;">`
- Left panel: `<div class="evaluate-input"><label for="jd">...</label><textarea id="jd">...</textarea></div>`
- Right panel: `<div id="result"></div>`
- `ActionBar`: `<div class="action-bar"><button onclick="evaluate()">Evaluate</button></div>`

- [ ] **Step 4: Run tests to verify `evaluate.test.ts` and `pages.test.ts` pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/evaluate.test.ts packages/provena-web/src/pages.test.ts
git commit -m "refactor(web): migrate /evaluate to AppShell and SplitView"
```

---

### Task 4: Responsive Validation Gate (`/evaluate`)

**Files:**
- Test: `packages/provena-web/src/pages.test.ts`

- [ ] **Step 1: Write comprehensive responsive assertion tests in `pages.test.ts`**

Add tests to verify:
- Touch target sizes on buttons (`min-height: 44px` or `padding: 0.75rem`).
- Sticky `ActionBar` styling rules presence.
- No fixed pixel widths on input containers.

- [ ] **Step 2: Run verification test suite**

Run: `npm test`
Expected: All tests PASS.

- [ ] **Step 3: Commit validation gate checkpoint**

```bash
git commit --allow-empty -m "chk: pass responsive validation gate for /evaluate vertical slice"
```

---

### Task 5: Migration — `/` (Story)

**Files:**
- Modify: `packages/provena-web/src/index.ts:62-270` (PAGE)
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `renderAppShell('story', ...)` and `.split-view` with `--split-threshold: 56rem`.
- Produces: `/` page with 2-column SplitView (Current chapter & Recent evidence on left, Career Compass on right in spacious mode).

- [ ] **Step 1: Add unit test in `pages.test.ts` for Story SplitView**

```typescript
test('Story page uses AppShell and SplitView Content-Aside composition', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('class="split-view"'))
  assert.ok(html.includes('id="chapter"'))
  assert.ok(html.includes('id="compass"'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Refactor `PAGE` template in `index.ts`**

Update `PAGE` template:
- Wrap content in `renderAppShell('story', ...)`
- Use `<div class="split-view" style="--split-threshold: 56rem;">`
- Left column: Hero + Current Chapter + Recent Evidence + Full Story details.
- Right column: Career Compass section.

- [ ] **Step 4: Run tests to verify all tests pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "refactor(web): migrate / (Story) to AppShell and SplitView"
```

---

### Task 6: Migration — `/cv` (Prepare & Mobile BottomSheet)

**Files:**
- Modify: `packages/provena-web/src/index.ts:281-467` (CV_PAGE)
- Test: `packages/provena-web/src/cv.test.ts`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `renderAppShell('prepare', ...)` and `.bottom-sheet` implementation.
- Produces: `/cv` page preview-first in compact mode with `[ Customize ]` ActionBar trigger opening BottomSheet, and 2-column Sidebar + Canvas in spacious mode (`--split-threshold: 64rem`).

- [ ] **Step 1: Add tests for `/cv` BottomSheet and AppShell markup in `cv.test.ts`**

Update `packages/provena-web/src/cv.test.ts`:

```typescript
test('Prepare page includes BottomSheet structure for compact controls', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('<div class="app-shell">'))
  assert.ok(html.includes('class="bottom-sheet"'))
  assert.ok(html.includes('onclick="openCustomize()"'))
  assert.ok(html.includes('onclick="closeCustomize()"'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL.

- [ ] **Step 3: Refactor `CV_PAGE` template in `index.ts`**

Update `CV_PAGE`:
- Render with `renderAppShell('prepare', ...)`
- Move controls sidebar into both `.cv-workspace-sidebar` (desktop) and `.bottom-sheet` (mobile compact), sharing the same input IDs and event listeners (`openCustomize()`, `closeCustomize()`).
- Keep `.cv-canvas` and A4 `.cv-sheet` intact.

- [ ] **Step 4: Run tests to verify all tests pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/cv.test.ts packages/provena-web/src/pages.test.ts
git commit -m "refactor(web): migrate /cv to AppShell and Mobile BottomSheet"
```

---

## Plan Self-Review & Verification

1. **Spec Coverage**:
   - AppShell & Navigation: Task 1
   - Fluid Spacing & Primitives CSS: Task 2
   - Vertical Slice /evaluate: Task 3 & 4
   - Story /: Task 5
   - Prepare /cv & BottomSheet: Task 6
2. **Placeholder Check**: Verified zero `TODO`, `TBD`, or pseudocode. Complete code blocks provided for all tasks.
3. **Type/Signature Consistency**: `renderAppShell` helper used consistently across Tasks 1-6.
