export function siteNav(section: 'story' | 'prepare' | 'evaluate' | 'opportunities' | 'sources', navClass = 'site'): string {
  const link = (label: string, href: string, active: boolean) =>
    '<a' + (active ? ' class="active"' : '') + ' href="' + href + '">' + label + '</a>'
  const sections = [
    { label: 'Story', href: '/', id: 'story' as const },
    { label: 'Identity', href: '/cv', id: 'prepare' as const },
    { label: 'Sources', href: '/sources', id: 'sources' as const },
    { label: 'Inbox', href: '/opportunities', id: 'opportunities' as const },
  ]
  return (
    '<nav class="' + navClass + '">' +
    '<a class="brand" href="/">Provena</a>' +
    '<div class="links">' + sections.map(s => link(s.label, s.href, s.id === section)).join('') + '</div>' +
    '<button class="theme-toggle" type="button" onclick="' +
    'var d=document.documentElement,k=d.classList.toggle(\'dark\');' +
    'try{localStorage.setItem(\'provena-theme\',k?\'dark\':\'light\')}catch(e){}' +
    '" aria-label="Toggle dark mode" title="Toggle dark mode">' +
    '<span class="icon-sun">☀️</span><span class="icon-moon">🌙</span>' +
    '</button>' +
    '</nav>'
  )
}

// Runs before first paint so the page never flashes the wrong theme.
export const THEME_INIT_SCRIPT =
  '<script>(function(){try{' +
  'var t=localStorage.getItem("provena-theme");' +
  'if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))' +
  'document.documentElement.classList.add("dark")' +
  '}catch(e){}})()</script>'

export function renderAppShell(
  section: 'story' | 'prepare' | 'evaluate' | 'opportunities' | 'sources',
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

// Palette lifted from the VitePress default theme used by the Provena docs
// site (indigo brand, same light/dark scales) so the app and the docs read
// as one product.
export const APP_SHELL_CSS = `
:root {
  --space-page-inline: clamp(1rem, 3vw, 2rem);

  --vp-c-bg: #ffffff;
  --vp-c-bg-soft: #f6f6f7;
  --vp-c-bg-elv: #ffffff;
  --vp-c-text-1: #3c3c43;
  --vp-c-text-2: #67676c;
  --vp-c-text-3: #929295;
  --vp-c-border: #c2c2c4;
  --vp-c-divider: #e2e2e3;
  --vp-c-brand-1: #3451b2;
  --vp-c-brand-2: #3a5ccc;
  --vp-c-brand-3: #5672cd;
  --vp-c-white: #ffffff;

  --c-page-bg: var(--vp-c-bg-soft);
  --c-surface: var(--vp-c-bg-elv);
  --c-surface-hover: var(--vp-c-bg-soft);
  --c-text: var(--vp-c-text-1);
  --c-text-muted: var(--vp-c-text-2);
  --c-text-faint: var(--vp-c-text-3);
  --c-border: var(--vp-c-divider);
  --c-border-strong: var(--vp-c-border);
  --c-brand: var(--vp-c-brand-1);
  --c-accent-bg: var(--vp-c-brand-3);
  --c-accent-bg-hover: var(--vp-c-brand-2);
  --c-white: var(--vp-c-white);
}
@media (prefers-color-scheme: dark) {
  :root:not(.light) {
    --vp-c-bg: #1b1b1f;
    --vp-c-bg-soft: #202127;
    --vp-c-bg-elv: #202127;
    --vp-c-text-1: #dfdfd6;
    --vp-c-text-2: #98989f;
    --vp-c-text-3: #6a6a71;
    --vp-c-border: #3c3f44;
    --vp-c-divider: #2e2e32;
    --vp-c-brand-1: #a8b1ff;
    --vp-c-brand-2: #5c73e7;
    --vp-c-brand-3: #3e63dd;
  }
}
:root.dark {
  --vp-c-bg: #1b1b1f;
  --vp-c-bg-soft: #202127;
  --vp-c-bg-elv: #202127;
  --vp-c-text-1: #dfdfd6;
  --vp-c-text-2: #98989f;
  --vp-c-text-3: #6a6a71;
  --vp-c-border: #3c3f44;
  --vp-c-divider: #2e2e32;
  --vp-c-brand-1: #a8b1ff;
  --vp-c-brand-2: #5c73e7;
  --vp-c-brand-3: #3e63dd;
}
.app-shell { display: flex; flex-direction: column; min-height: 100vh; background: var(--c-page-bg); }
.app-header { padding: 1rem var(--space-page-inline); }
.site-nav { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid var(--c-border); }
.site-nav .brand { display: block; font-weight: 700; font-size: 1rem; color: var(--c-text); text-decoration: none; margin-bottom: 0.625rem; }
.site-nav .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site-nav .links a { font-size: 0.875rem; color: var(--c-text-faint); text-decoration: none; padding-bottom: 0.125rem; }
.site-nav .links a.active { color: var(--c-text); font-weight: 700; border-bottom: 1px solid var(--c-text); }
.theme-toggle { flex-shrink: 0; width: auto; margin: 0; padding: 0.25rem; min-height: 0; background: none; border: none; cursor: pointer; font-size: 1rem; line-height: 1; }
.theme-toggle .icon-moon { display: none; }
:root.dark .theme-toggle .icon-sun { display: none; }
:root.dark .theme-toggle .icon-moon { display: inline; }
.page { flex: 1; padding: 0 var(--space-page-inline) 2rem; color: var(--c-text); }
.page-content { container-type: inline-size; container-name: page; width: 100%; max-width: 60rem; margin: 0 auto; }
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, 1.25rem); }
.readable { width: min(100%, 44rem); margin-inline: auto; }
.split-view { display: flex; flex-direction: column; gap: 1.5rem; }
.split-view > * { flex: 1; min-width: 0; }
@container page (min-width: var(--split-threshold, 54rem)) {
  .split-view { flex-direction: row; align-items: flex-start; }
  .action-bar { position: static; background: none; backdrop-filter: none; padding: 0; border: none; }
}
.action-bar { position: sticky; bottom: 0; background: color-mix(in srgb, var(--c-page-bg) 95%, transparent); backdrop-filter: blur(8px); padding: 0.75rem var(--space-page-inline); z-index: 10; border-top: 1px solid var(--c-border); }
.bottom-sheet { position: fixed; inset: auto 0 0 0; background: var(--c-surface); border-radius: 1rem 1rem 0 0; padding: 1.5rem; max-height: 85vh; overflow-y: auto; z-index: 100; box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15); transform: translateY(100%); transition: transform 0.25s ease-out; }
.bottom-sheet.open { transform: translateY(0); }
.bottom-sheet-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 99; opacity: 0; pointer-events: none; transition: opacity 0.25s ease-out; }
.bottom-sheet-overlay.open { opacity: 1; pointer-events: auto; }
`
