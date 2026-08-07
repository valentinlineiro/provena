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
    '</nav>'
  )
}

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

export const APP_SHELL_CSS = `
:root {
  --space-page-inline: clamp(1rem, 3vw, 2rem);
}
.app-shell { display: flex; flex-direction: column; min-height: 100vh; }
.app-header { padding: 1rem var(--space-page-inline); }
.site-nav { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #e5e5e5; }
.site-nav .brand { display: block; font-weight: 700; font-size: 1rem; color: #1a1a1a; text-decoration: none; margin-bottom: 0.625rem; }
.site-nav .links { display: flex; flex-wrap: wrap; gap: 0.375rem 1.5rem; }
.site-nav .links a { font-size: 0.875rem; color: #999; text-decoration: none; padding-bottom: 0.125rem; }
.site-nav .links a.active { color: #1a1a1a; font-weight: 700; border-bottom: 1px solid #1a1a1a; }
.page { flex: 1; padding: 0 var(--space-page-inline) 2rem; }
.page-content { container-type: inline-size; container-name: page; width: 100%; max-width: 60rem; margin: 0 auto; }
.stack { display: flex; flex-direction: column; gap: var(--stack-gap, 1.25rem); }
.readable { width: min(100%, 44rem); margin-inline: auto; }
.split-view { display: flex; flex-direction: column; gap: 1.5rem; }
.split-view > * { flex: 1; min-width: 0; }
@container page (min-width: var(--split-threshold, 54rem)) {
  .split-view { flex-direction: row; align-items: flex-start; }
  .action-bar { position: static; background: none; backdrop-filter: none; padding: 0; border: none; }
}
.action-bar { position: sticky; bottom: 0; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(8px); padding: 0.75rem var(--space-page-inline); z-index: 10; border-top: 1px solid #e5e5e5; }
.bottom-sheet { position: fixed; inset: auto 0 0 0; background: #fff; border-radius: 1rem 1rem 0 0; padding: 1.5rem; max-height: 85vh; overflow-y: auto; z-index: 100; box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15); transform: translateY(100%); transition: transform 0.25s ease-out; }
.bottom-sheet.open { transform: translateY(0); }
.bottom-sheet-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.4); z-index: 99; opacity: 0; pointer-events: none; transition: opacity 0.25s ease-out; }
.bottom-sheet-overlay.open { opacity: 1; pointer-events: auto; }
`
