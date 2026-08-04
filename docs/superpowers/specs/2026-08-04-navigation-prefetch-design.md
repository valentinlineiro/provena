# Spec: Provena Intent-Based Navigation Prefetching

**Date**: 2026-08-04  
**Status**: Approved  
**Scope**: AppShell Navigation Performance Optimization (`packages/provena-web/src/index.ts`)

---

## 1. Context & Objective

Switching between pages (`/`, `/cv`, `/evaluate`) requires native multi-page SSR navigation. While keeping full document SSR guarantees independence and simplicity, users experience page load delay on tab switching.

The objective is to reduce perceived navigation latency by prefetching the target document HTML upon user intent (`pointerenter`, `focus`, `touchstart` on inactive `.site-nav a` links) without modifying the SSR application architecture.

---

## 2. Technical Design

### 2.1 Trigger Rules
- **Events**: `pointerenter`, `focus`, `touchstart` attached to `.site-nav a:not(.active)` links.
- **Deduplication**: Maintain an in-memory `Set` of requested URLs during the document lifecycle. Never prefetch an already prefetched URL or the currently active URL.
- **Request Type**: Standard low-priority `fetch(href, { priority: 'low' })` or link prefetch header.

### 2.2 Inline Script Implementation
A minimal script (~15 lines) placed in `renderAppShell` or `APP_SHELL_CSS` script block:

```javascript
(function() {
  const prefetched = new Set([location.pathname]);
  function prefetch(a) {
    const href = a.getAttribute('href');
    if (!href || prefetched.has(href) || a.classList.contains('active')) return;
    prefetched.add(href);
    fetch(href, { priority: 'low' }).catch(function() {});
  }
  document.addEventListener('pointerenter', function(e) {
    if (e.target && e.target.matches && e.target.matches('.site-nav a:not(.active)')) prefetch(e.target);
  }, true);
  document.addEventListener('focusin', function(e) {
    if (e.target && e.target.matches && e.target.matches('.site-nav a:not(.active)')) prefetch(e.target);
  }, true);
  document.addEventListener('touchstart', function(e) {
    if (e.target && e.target.matches && e.target.matches('.site-nav a:not(.active)')) prefetch(e.target);
  }, { passive: true, capture: true });
})();
```

---

## 3. Verification Criteria

1. **Empirical Cache Verification**: Hovering or focusing an inactive link triggers a single `GET` request for the destination HTML.
2. **Deduplication**: Repeating hover/focus on the same link within the session does not send secondary fetch requests.
3. **No Active Link Prefetch**: The currently active page link is never fetched.
4. **Test Suite Integrity**: All unit tests in `packages/provena-web` continue to pass without error.
