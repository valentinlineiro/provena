# Spec: Provena Mobile-First Responsive App Shell Architecture

**Date**: 2026-08-04  
**Status**: Approved  
**Scope**: AppShell, Responsive Layout Primitives (`Stack`, `SplitView`, `ActionBar`), Journey Migrations (`/evaluate`, `/`, `/cv`)

---

## 1. Executive Summary

Provena has evolved across multiple surfaces (`/`, `/evaluate`, `/cv`), each managing navigation and layout locally. This specification establishes a shared **Mobile-First App Shell Architecture**.

"Mobile-first" does not mean designing a mobile UI and stretching it for desktop. It means every journey defines a primary interaction flow in a single-column layout (`Stack`), while desktop/spacious environments utilize available space to maintain context and accelerate operations (`SplitView`).

---

## 2. Global Architecture & AppShell

### 2.1 Structural Hierarchy
All routes migrate from local `siteNav()` rendering to a global `AppShell` container:

```text
AppShell
├── AppHeader
│   ├── Brand ("Provena")
│   └── Navigation (Story, Prepare, Evaluate)
└── Page
    ├── PageHeader (Optional title & subtitle)
    └── PageContent [container-type: inline-size]
        ├── Stack (Compact / 1-column baseline)
        ├── SplitView (Spacious / 2-pane composition)
        └── ActionBar (Compact primary action affordance)
```

### 2.2 Global Rules & CSS Tokens
- **Fluid Spacing**: Page inline padding uses `clamp(1rem, 3vw, 2rem)`. Container Queries handle structural composition changes; global viewport breakpoints are avoided for page spacing.
- **Touch Targets**: Minimum interactive hit area of `44px x 44px` for all interactive elements (navigation links, chips, checkboxes, buttons).
- **Navigation Stability**: `AppHeader` maintains identical link order and labels ("Story", "Prepare", "Evaluate") across all journeys. Only the `active` state changes. No hamburger menu or hidden navigation drawer.

---

## 3. Layout & Composition Primitives

### 3.1 Container Query Setup
`PageContent` acts as the container context for responsive layout switching:

```css
.page-content {
  container-type: inline-size;
  container-name: page;
}
```

### 3.2 `Stack` (Compact Baseline)
Single-column layout used by default across all journeys:
- **Layout**: `display: flex; flex-direction: column; gap: var(--stack-gap, 1.25rem);`
- **Readable Width**: Content width constraint is managed separately by a `.readable` wrapper (`width: min(100%, 44rem); margin-inline: auto;`), ensuring layout primitives do not force arbitrary text widths.

### 3.3 `SplitView` (Spacious Composition)
Transitions from single-column to two-pane layout when the `PageContent` container has sufficient width for the journey's specific composition.

```css
.split-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@container page (min-width: var(--split-threshold)) {
  .split-view {
    flex-direction: row;
    align-items: flex-start;
  }
}
```

**Initial Calibrable Thresholds**:
1. **Balanced (`/evaluate`)**: `--split-threshold: 54rem` (~864px) — Left: Input JD (`flex: 1`), Right: Evaluation Card (`flex: 1`).
2. **Content-Aside (`/`)**: `--split-threshold: 56rem` (~896px) — Left: Story & Evidence (`flex: 1.5`), Right: Career Compass (`flex: 1`).
3. **Controls-Canvas (`/cv`)**: `--split-threshold: 64rem` (~1024px) — Left: Sidebar Controls (`340px`), Right: A4 Canvas Workspace (`flex: 1`).

### 3.4 `ActionBar` & Compact Affordance
- **Responsibility**: Keeps primary journey actions reachable during compact (`Stack`) composition when vertical scrolling or software keyboards threaten visibility.
- **Behavior**:
  - In `Stack` mode: Positioned sticky at the bottom (`position: sticky; bottom: 0;`).
  - In `SplitView` mode: Dissolves fixed positioning and renders actions inline beside their natural contextual controls.
- **Verification Rule**: Must remain reachable during primary mobile journeys, including when interactive form inputs trigger software keyboards.

### 3.5 Mobile BottomSheet (`/cv` Customization)
- **Role**: Temporary configuration surface for `/cv` in compact mode. Does not introduce draft/provisional states; controls mutate live CV state directly.
- **Trigger**: `[ Customize ]` button in the compact `ActionBar`.
- **Accessibility**: Focus trap on open, overlay dismissal, `Escape` key listener, and `[ Done ]` action button to close.

---

## 4. Journey Mapping

| Surface | Compact (Stack) | Spacious (SplitView) | Action Affordance |
| :--- | :--- | :--- | :--- |
| **`/evaluate`** | 1-column input + results | 2-column (JD | Evaluation Card) | `ActionBar` (Evaluate button sticky in compact, inline in spacious) |
| **`/` (Story)** | 1-column story + compass | 2-column (Story | Compass) | `ActionBar` (Add to story trigger) |
| **`/cv`** | Preview-first (A4 Canvas) | 2-column (340px Sidebar | Canvas) | `ActionBar` [Customize \| PDF] + `BottomSheet` |

---

## 5. Verification Criteria

1. **No Global Horizontal Overflow**: `/cv` may scale or contain the fixed A4 document within its canvas, but the document **MUST NOT** cause horizontal scrolling of the application shell.
2. **Accessibility & Touch Targets**: Interactive elements guarantee a minimum `44px x 44px` hit target. Keyboard navigation and `Escape` handlers function properly in `BottomSheet`.
3. **Responsive Stability**: Composition switches cleanly via Container Queries without DOM duplication of action handlers where avoidable.

---

## 6. Implementation Phasing & Validation Gates

```text
Phase 1: AppShell & Shared CSS Tokens
   ↓
Phase 2: Layout Primitives (Stack, SplitView, ActionBar, BottomSheet)
   ↓
Phase 3: Vertical Slice Migration — /evaluate
   ↓
[ RESPONSIVE VALIDATION GATE ]
  ├── Viewports: ~320px, ~375px, container boundary, desktop
  ├── Touch targets & software keyboard interaction
  └── Verification of ActionBar dissolve behavior
   ↓
Phase 4: Migration — / (Story)
   ↓
Phase 5: Migration — /cv (Prepare & Mobile BottomSheet)
```
