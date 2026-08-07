# Redesign `/cv` as an A4-first CV document renderer with print parity — design

**Date:** 2026-08-04  
**Status:** Approved design  
**Version:** 0.6.0  

## Objective

Redesign `/cv` in `@provena/web` so that it is not a web page styled for printing, but an authentic **printable A4 document displayed inside a browser workspace**.

Achieve true **WYSIWYG print parity**: what the user sees on screen inside the `/cv` sheet preview is identical to what comes out on paper or PDF export.

## Architectural Model & Boundaries

```text
CVModel (CVProjection)
   │
   ▼
HtmlCvRenderer (@provena/html)
   ├── renderDocument(model: CVProjection): string  (pure .cv-document markup)
   ├── renderStyles(): string                      (scoped .cv-document CSS + @media print)
   └── render(model: CVProjection): string          (standalone <!DOCTYPE html> shell)
   │
   ├─► Standalone HTML Export (Download .html / CLI)
   └─► Provena Workspace (/cv in @provena/web)
          ├── Workspace UI (.cv-workspace-sidebar: Controls, Target Role, Audience, Checkboxes, Download PDF)
          └── Workspace Canvas (.cv-canvas: Grey bg, zoom/scale, centering)
                 └── Paper Sheet (.cv-sheet: A4 proportion, shadow)
                        └── Document Root (.cv-document: Injected from HtmlCvRenderer)
```

### Strict Boundary Rules
1. **Single Shared Renderer**: `HtmlCvRenderer` in `@provena/html` is the sole document renderer. No secondary CV renderer exists in `@provena/web`.
2. **Strict DOM & CSS Isolation**: 
   - Document markup is wrapped in `.cv-document`.
   - All document styles emitted by `renderStyles()` are scoped exclusively to `.cv-document` (e.g. `.cv-document h1`, `.cv-document section`), with local CSS resets at `.cv-document`.
   - Workspace CSS (`.cv-workspace-*`, `.cv-sheet`, `.cv-canvas`) never bleeds into `.cv-document`.
3. **Pure Document Surface**: Nothing inside `.cv-document` exists only because Provena exists. Controls, buttons, headers, brand elements, and download triggers remain strictly in `.cv-workspace-sidebar`.
4. **Visual Paper Scaling (No Reflow)**: The CV document layout is fixed to physical A4 dimensions (`210mm` width, fixed margins). On small viewports, the canvas/sheet applies visual zoom/scaling CSS (`transform: scale(...)` or container zoom) without breaking A4 layout or forcing text reflow.

## Document Design System (`.cv-document`)

- **Typography**: Sober, print-first typography (`system-ui, -apple-system, sans-serif`). Hierarchy tuned for document density: `h1` (20pt), `h2` (12pt uppercase/bold with border), `h3` (10pt bold), body (9.5pt / line-height 1.4).
- **Color Palette**: High-contrast neutral tone system (`#111` body text, `#555` dates/muted info, `#ddd` borders). No cards, pills, background shadows, or decorative badges inside `.cv-document`.
- **Margins & Spacing**: Explicit physical margins (`15mm 18mm` inner padding).
- **Pagination & Print Rules**:
  - `page-break-after: avoid` on `h2` section headers.
  - `page-break-inside: avoid` on experience/project articles (`.cv-document-article`).
  - Clear URL display for links when printed.

## `@media print` Strategy

Because the document sheet on screen is already designed to physical A4 specs, `@media print` is trivial and non-destructive:

```css
@page {
  size: A4;
  margin: 0;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    background: #fff;
  }

  .cv-workspace-sidebar {
    display: none !important;
  }

  .cv-canvas {
    display: contents !important;
  }

  .cv-sheet {
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    width: auto !important;
    transform: none !important;
  }
}
```

## Architectural Invariants

| Id | Invariant |
|----|-----------|
| I1 | `Profile` is authoritative. |
| I2 | Projectors (`cvProjector`) never mutate `Profile` and remain the exclusive authority on content. |
| I3 | Renderers never mutate representations or decide content filtering. |
| I4 | Representations are deterministic. |
| I9 | `HtmlCvRenderer` is the single source of truth for HTML/CSS CV document rendering. |
| I10 | `.cv-document` CSS is strictly scoped and immune to host workspace styles. |
| I11 | Document layout retains fixed A4 proportions; responsive adaptation scales visual zoom without reflow. |
| I12 | What is seen in the sheet preview matches paper/PDF print output (WYSIWYG parity). |

## Verification Plan

1. **Unit Tests (`@provena/html`)**:
   - Verify `renderDocument()`, `renderStyles()`, and `render()` outputs.
   - Assert all CSS selectors in `renderStyles()` are properly scoped under `.cv-document` or `@media print`.
2. **Web Integration Tests (`@provena/web`)**:
   - Verify `/cv` route renders workspace UI alongside `.cv-document` fragment + styles.
   - Verify POST `/api/cv/preview` returns correct document markup and metadata.
3. **Visual & Print Parity Inspection**:
   - Open `/cv` preview in browser.
   - Trigger Print Preview / Save as PDF.
   - Confirm: Exact A4 paper scale, correct physical margins, zero workspace UI clutter, no clipping/overflow, clean page breaks, and identical typography between screen preview and PDF export.
