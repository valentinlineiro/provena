# Provena Intent-Based Navigation Prefetching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce perceived navigation latency across Provena routes by introducing intent-based prefetching for inactive `.site-nav` links.

**Architecture:** Inject a compact client-side script into `renderAppShell` in `packages/provena-web/src/index.ts` listening to `pointerenter`, `focusin`, and `touchstart` on `.site-nav a:not(.active)` links, with `Set`-based URL deduplication.

**Tech Stack:** TypeScript, Cloudflare Worker HTML string templates (`packages/provena-web/src/index.ts`), Node.js test runner (`node:test`).

## Global Constraints

- Must NOT change multi-page native SSR routing semantics.
- Must NOT fetch active page URLs.
- Must deduplicate requests per session lifecycle.

---

### Task 1: Implement Intent-Based Prefetching in `renderAppShell`

**Files:**
- Modify: `packages/provena-web/src/index.ts:62-80`
- Test: `packages/provena-web/src/nav.test.ts`
- Test: `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `.site-nav a:not(.active)` DOM elements.
- Produces: Client-side event listeners and low-priority `fetch(href)` calls for inactive navigation links.

- [ ] **Step 1: Write test in `nav.test.ts` asserting prefetch script presence in `renderAppShell`**

Add unit test to `packages/provena-web/src/nav.test.ts`:

```typescript
test('renderAppShell includes intent-based navigation prefetch script', () => {
  const html = renderAppShell('story', '<h1>Title</h1>', '<div>Content</div>')
  assert.ok(html.includes('prefetched = new Set'))
  assert.ok(html.includes("matches('.site-nav a:not(.active)')"))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test` inside `packages/provena-web`.
Expected: FAIL with missing prefetch script string assertions.

- [ ] **Step 3: Add inline prefetch script to `renderAppShell` in `index.ts`**

Update `renderAppShell` in `packages/provena-web/src/index.ts` to append the script:

```typescript
export function renderAppShell(
  section: 'story' | 'prepare' | 'evaluate',
  pageHeaderHtml: string,
  pageContentHtml: string
): string {
  return (
    '<div class="app-shell">' +
    '<header class="app-header">' +
    siteNav(section, 'site-nav') +
    pageHeaderHtml +
    '</header>' +
    '<main class="page">' +
    '<div class="page-content">' +
    pageContentHtml +
    '</div>' +
    '</main>' +
    '</div>' +
    '<script>' +
    '(function(){' +
    'const s=new Set([location.pathname]);' +
    'function p(a){' +
    'const h=a.getAttribute("href");' +
    'if(!h||s.has(h)||a.classList.contains("active"))return;' +
    's.add(h);' +
    'fetch(h,{priority:"low"}).catch(function(){});' +
    '}' +
    'document.addEventListener("pointerenter",function(e){if(e.target&&e.target.closest&&e.target.closest(".site-nav a:not(.active)"))p(e.target.closest(".site-nav a:not(.active)"));},true);' +
    'document.addEventListener("focusin",function(e){if(e.target&&e.target.closest&&e.target.closest(".site-nav a:not(.active)"))p(e.target.closest(".site-nav a:not(.active)"));},true);' +
    'document.addEventListener("touchstart",function(e){if(e.target&&e.target.closest&&e.target.closest(".site-nav a:not(.active)"))p(e.target.closest(".site-nav a:not(.active)"));},{passive:true,capture:true});' +
    '})();' +
    '</script>'
  )
}
```

- [ ] **Step 4: Run tests to verify all pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit changes**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/nav.test.ts
git commit -m "feat(web): add intent-based navigation prefetching to AppShell"
```

---

## Plan Self-Review & Verification

1. **Spec Coverage**: Intent-based prefetching, deduplication, active link filter, test coverage.
2. **Placeholder Check**: Verified zero `TODO` or pseudocode.
3. **Execution Ready**: Single self-contained task.
