# Design: Persistent site navigation — Story | Prepare

Date: 2026-07-31
Status: Approved

## Problem

Provena has grown beyond a single view: the Home (`GET /`) and the Prepare CV page
(`GET /cv`) are now separate screens, with more arriving (Career, LinkedIn,
Recruiter Brief, Settings). The current ad-hoc navigation — a "Prepare CV" button
in the Home hero and a "← Home" link on `/cv` — does not scale. Three different
patterns for the same action signals the navigation has no hierarchy.

## Goal

Introduce a single, persistent navigation component shared by every page. The
menu is the only way to change section; buttons only start actions.

## Design rule (permanent)

> **Buttons start actions; the menu changes sections.**

- ✅ Buttons: "Continue this story", "Download .md", "Print PDF".
- ❌ Buttons: "Go to Prepare", "Back to Home".

## Navigation

```
Provena

Story    Prepare
─────────────
```

- Brand "Provena" at the top, darker.
- Links below: **Story** and **Prepare**.
- Inactive link: normal grey text.
- Active link: darker text, bold, thin 1px underline. Discreet — the navigation
  should feel stable, almost invisible.
- No buttons, no tabs.

### Section labels

- **Story** — the product's main asset: the professional history. Not "Timeline",
  "Profile", "History".
- **Prepare** — task-oriented: today the CV, tomorrow Recruiter Brief, LinkedIn,
  Cover Letter, Portfolio. The name survives the artifact it currently generates.
- **Career** — reserved, NOT rendered until it has its own page. It will house
  Career Compass, Career Fit, Market, Next Strategy. Not a ghost link.

### Section title

The `/cv` page heading becomes **"Prepare"** (subtitle stays "Target a role,
review suggestions, export."). "Prepare CV" names the current implementation;
"Prepare" names the user's intent.

## Component

```ts
siteNav(section: 'story' | 'prepare'): string
```

- Lives in `packages/provena-web/src/index.ts`, same module as the page templates.
- The helper knows the routes internally (`story → /`, `prepare → /cv`); the
  caller passes only the domain section.
- `Career` is not rendered until `/career` exists.
- No `layout()` abstraction — a single shared component, not premature layout
  infrastructure. Introduced when the domain asks for it.

## Changes

1. Home (`PAGE`): hero "Prepare CV" button removed. Brand becomes "Provena";
   the person's name/title remain below the nav. Injects `siteNav('story')`.
2. `/cv` (`CV_PAGE`): "← Home" link removed. `h1` becomes "Prepare". Injects
   `siteNav('prepare')`.
3. Nav styles added to both `<style>` blocks.

## Testing

`siteNav` is exported and tested:
- correct link for each section (story → `/`, prepare → `/cv`);
- active class applied to the current section only;
- brand "Provena" present;
- "Career" absent.

## Out of scope

- Moving the Career Compass out of Home.
- Any new page (Career, LinkedIn, Recruiter Brief, Settings).
