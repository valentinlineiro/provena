# Site Navigation (Story | Prepare) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ad-hoc "Prepare CV" hero button and "← Home" link with a single persistent `siteNav` component shared by both pages, and rename the `/cv` section heading to "Prepare".

**Architecture:** A pure string helper `siteNav(section)` in `packages/provena-web/src/index.ts` returns the `<nav class="site">` markup (brand + Story/Prepare links, current section marked active). Both page templates interpolate it; the Home hero button and the CV page back-link are removed.

**Tech Stack:** TypeScript, Cloudflare Workers, `node:test` + `assert/strict` + `tsx`, no new dependencies.

## Global Constraints

- Design rule (permanent): **Buttons start actions; the menu changes sections.** No button may navigate to a section.
- `siteNav(section: 'story' | 'prepare')` lives in `packages/provena-web/src/index.ts`, same module as the page templates. No `layout()` abstraction, no new file for the helper.
- The helper owns route mapping: `story → /`, `prepare → /cv`. Callers pass only the domain section.
- **Career is NOT rendered** — no link, no text, until `/career` exists.
- Copy is exact: brand "Provena", links "Story" and "Prepare", `/cv` `<h1>` becomes "Prepare", subtitle stays "Target a role, review suggestions, export.", `<title>` becomes "Provena — Prepare".
- Active link: darker text (`#1a1a1a`), bold, thin 1px underline. Inactive links: grey (`#999`). Brand: darker, bold, not part of the section list.
- TDD: write the failing test first, run it to confirm failure, then implement.
- Test command: `npm test`. Typechecks: `npx tsc --noEmit` (root) and `npm run typecheck -w packages/provena-web`. Both must pass.
- Tests may call the exported `worker.fetch` directly (module scope is pure; no KV access on the `/` and `/cv` routes).

---

### Task 1: `siteNav` shared navigation component

**Files:**
- Modify: `packages/provena-web/src/index.ts` (insert after line 44, after `recordEvent`)
- Test: Create `packages/provena-web/src/nav.test.ts`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `export function siteNav(section: 'story' | 'prepare'): string` — returns `<nav class="site">` containing `<a class="brand" href="/">Provena</a>`, then Story and Prepare links with `class="active"` applied to the current section only. Never contains "Career".

- [ ] **Step 1: Write the failing test**

Create `packages/provena-web/src/nav.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { siteNav } from './index.js'

test('siteNav renders the brand and both section links', () => {
  const html = siteNav('story')
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Prepare</a>'))
})

test('siteNav marks the current section active and the other inactive', () => {
  assert.ok(siteNav('story').includes('<a class="active" href="/">Story</a>'))
  assert.ok(!siteNav('story').includes('class="active" href="/cv"'))
  assert.ok(siteNav('prepare').includes('<a class="active" href="/cv">Prepare</a>'))
  assert.ok(!siteNav('prepare').includes('class="active" href="/"'))
})

test('siteNav never renders the reserved Career section', () => {
  assert.ok(!siteNav('story').includes('Career'))
  assert.ok(!siteNav('prepare').includes('Career'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test packages/provena-web/src/nav.test.ts`
Expected: FAIL with `SyntaxError: The requested module './index.js' does not provide an export named 'siteNav'`.

- [ ] **Step 3: Write minimal implementation**

Insert into `packages/provena-web/src/index.ts` immediately after the `recordEvent` function (after line 44):

```ts
export function siteNav(section: 'story' | 'prepare'): string {
  const link = (label: string, href: string, active: boolean) =>
    '<a' + (active ? ' class="active"' : '') + ' href="' + href + '">' + label + '</a>'
  const sections = [
    { label: 'Story', href: '/', id: 'story' as const },
    { label: 'Prepare', href: '/cv', id: 'prepare' as const },
  ]
  return (
    '<nav class="site">' +
    '<a class="brand" href="/">Provena</a>' +
    sections.map(s => link(s.label, s.href, s.id === section)).join('') +
    '</nav>'
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test packages/provena-web/src/nav.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/nav.test.ts
git commit -m "feat(web): add siteNav shared navigation component"
```

---

### Task 2: Wire the navigation into both pages

**Files:**
- Modify: `packages/provena-web/src/index.ts`
  - `PAGE`: remove `.nav`/`.nav a` CSS (lines 98-100); add `.site` CSS after `.hidden` (line 97); remove `<p class="nav"><a href="/cv">Prepare CV</a></p>` (line 106); add `<nav class="site">${siteNav('story')}</nav>` before `<div class="hero">` (line 103).
  - `CV_PAGE`: remove `a.home` CSS (line 282); add `.site` CSS after `.row button` (line 281); remove `<p><a class="home" href="/">← Home</a></p>` (line 285); add `<nav class="site">${siteNav('prepare')}</nav>` before `<h1>` (line 286); change `<title>Provena — Prepare CV</title>` → `<title>Provena — Prepare</title>` (line 265); change `<h1>Prepare CV</h1>` → `<h1>Prepare</h1>` (line 286).
- Test: Create `packages/provena-web/src/pages.test.ts`

**Interfaces:**
- Consumes: `siteNav(section)` from Task 1.
- Produces: end-to-end proof that both pages render the shared nav via `worker.fetch`.

- [ ] **Step 1: Write the failing test**

Create `packages/provena-web/src/pages.test.ts`:

```ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import worker from './index.js'

const env = {} as never

test('Home renders the site nav with Story active and no Prepare CV button', async () => {
  const res = await worker.fetch(new Request('https://provena.example/'), env)
  const html = await res.text()
  assert.ok(html.includes('<nav class="site">'))
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a class="active" href="/">Story</a>'))
  assert.ok(html.includes('<a href="/cv">Prepare</a>'))
  assert.ok(!html.includes('Prepare CV'))
})

test('Prepare page renders the site nav with Prepare active and no back link', async () => {
  const res = await worker.fetch(new Request('https://provena.example/cv'), env)
  const html = await res.text()
  assert.ok(html.includes('<a class="brand" href="/">Provena</a>'))
  assert.ok(html.includes('<a href="/">Story</a>'))
  assert.ok(html.includes('<a class="active" href="/cv">Prepare</a>'))
  assert.ok(html.includes('<h1>Prepare</h1>'))
  assert.ok(html.includes('Target a role, review suggestions, export.'))
  assert.ok(!html.includes('← Home'))
  assert.ok(!html.includes('Prepare CV'))
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test packages/provena-web/src/pages.test.ts`
Expected: FAIL (Home still contains "Prepare CV" and the back link; no `<nav class="site">`).

- [ ] **Step 3: Implement page changes**

In `packages/provena-web/src/index.ts`, make these four edits:

**Edit A — PAGE nav styles.** Replace:

```css
.hidden { display: none; }
.nav { margin-top: 0.75rem; }
.nav a { color: #1a1a1a; font-size: 0.875rem; font-weight: 600; text-decoration: none; border: 1px solid #ccc; border-radius: 0.375rem; padding: 0.25rem 0.625rem; }
.nav a:hover { background: #efefef; }
```

with:

```css
.hidden { display: none; }
.site { margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; }
.site a:not(.brand) { display: inline-block; margin: 0.375rem 1rem 0 0; font-size: 0.875rem; color: #999; text-decoration: none; }
.site a:not(.brand).active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.125rem; }
```

**Edit B — PAGE body.** Replace:

```html
<main>
<div class="hero">
  <h1 id="name"></h1>
  <p class="subtitle" id="title"></p>
  <p class="nav"><a href="/cv">Prepare CV</a></p>
</div>
```

with:

```html
<main>
<nav class="site">${siteNav('story')}</nav>
<div class="hero">
  <h1 id="name"></h1>
  <p class="subtitle" id="title"></p>
</div>
```

**Edit C — CV_PAGE styles and title.** Replace:

```html
<title>Provena — Prepare CV</title>
```

with:

```html
<title>Provena — Prepare</title>
```

And replace:

```css
.row button { flex: 1; }
a.home { color: #1a1a1a; font-size: 0.8125rem; font-weight: 600; text-decoration: none; }
```

with:

```css
.row button { flex: 1; }
.site { margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e5e5; }
.site .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; }
.site a:not(.brand) { display: inline-block; margin: 0.375rem 1rem 0 0; font-size: 0.875rem; color: #999; text-decoration: none; }
.site a:not(.brand).active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; padding-bottom: 0.125rem; }
```

**Edit D — CV_PAGE body.** Replace:

```html
<main>
<p><a class="home" href="/">← Home</a></p>
<h1>Prepare CV</h1>
<p class="subtitle">Target a role, review suggestions, export.</p>
```

with:

```html
<main>
<nav class="site">${siteNav('prepare')}</nav>
<h1>Prepare</h1>
<p class="subtitle">Target a role, review suggestions, export.</p>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx tsx --test packages/provena-web/src/nav.test.ts packages/provena-web/src/pages.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Full verification**

Run: `npm test`
Expected: all tests pass (84 existing + 5 new).

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run typecheck -w packages/provena-web`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add packages/provena-web/src/index.ts packages/provena-web/src/pages.test.ts
git commit -m "feat(web): wire persistent Story | Prepare navigation into both pages"
```

- [ ] **Step 7: Push**

```bash
git push
```

Expected: push succeeds; CI runs tests and the Deploy Provena Web workflow deploys.
