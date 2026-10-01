import { buildApplicationKit, type ApplicationKitModel } from '@provena/core'
import { renderAppShell, APP_SHELL_CSS, THEME_INIT_SCRIPT } from './shell.js'
import profile from './profile.js'

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

// ── Application Kit (/kit) ───────────────────────────────────────────────────

const kit: ApplicationKitModel = buildApplicationKit(profile)

function kitField(label: string, value: string): string {
  return (
    '<div class="kit-field">' +
    '<div class="kit-label">' + esc(label) + '</div>' +
    '<div class="kit-value">' + esc(value) + '</div>' +
    '<button class="kit-copy" type="button">Copy</button>' +
    '</div>'
  )
}

const kitFields: ReadonlyArray<readonly [string, string]> = [
  ['Full name', kit.fullName],
  ['Email', kit.email],
  ['Phone', kit.phone],
  ['Location', kit.location],
  ['LinkedIn', kit.linkedinUrl],
  ['GitHub', kit.githubUrl],
  ...Object.entries(kit.otherUrls),
  ['Current title', kit.currentTitle],
  ['Summary (short, ≤280)', kit.shortSummary],
  ['Summary (long)', kit.longSummary],
  ['Technologies', kit.technologiesLine],
  ['Experience', kit.experienceLines.join('\n')],
  ['Total years', String(kit.totalYearsExperience)],
  ['Languages', kit.languagesLine],
  ['Work authorization', kit.workAuthorizationLine],
  ['Salary expectation', kit.salaryLine],
  ['Notice period', kit.noticePeriod],
  ['Remote preference', kit.remotePreference],
]

export const KIT_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${THEME_INIT_SCRIPT}
<title>Provena — Application Kit</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: var(--c-page-bg); color: var(--c-text); }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: var(--c-text-muted); font-size: 0.875rem; margin-top: 0.125rem; }
.kit-toolbar { display: flex; justify-content: space-between; align-items: center; margin: 1rem 0; }
.kit-field { display: grid; grid-template-columns: 11rem 1fr auto; gap: 0.75rem; align-items: start; padding: 0.625rem 0; border-bottom: 1px solid var(--c-border); }
.kit-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-faint); padding-top: 0.2rem; }
.kit-value { font-size: 0.875rem; white-space: pre-wrap; word-break: break-word; }
.kit-copy { font-size: 0.75rem; padding: 0.25rem 0.6rem; border: 1px solid var(--c-border-strong); border-radius: 0.375rem; background: var(--c-surface); color: var(--c-text); cursor: pointer; }
.kit-copy:hover { background: var(--c-surface-hover); }
@media (max-width: 40rem) { .kit-field { grid-template-columns: 1fr; } }
</style>
${renderAppShell(
  'prepare',
  '<div class="page-header">' +
  '<h1>Application Kit</h1>' +
  '<p class="subtitle">Copy-paste values for application forms, generated from your canonical identity.</p>' +
  '</div>',
  '<div class="readable">' +
  '<div class="kit-toolbar"><a href="/applications" style="font-size:0.875rem;color:var(--c-text-muted);text-decoration:none;">← Applications</a>' +
  '<button class="kit-copy" id="copy-all" type="button">Copy all</button></div>' +
  kitFields.map(([label, value]) => kitField(label, value)).join('') +
  '</div>'
)}
<script>
document.addEventListener('click', async (e) => {
  const btn = e.target && e.target.closest && e.target.closest('.kit-copy')
  if (!btn) return
  let text
  if (btn.id === 'copy-all') {
    text = Array.from(document.querySelectorAll('.kit-field')).map((f) =>
      f.querySelector('.kit-label').textContent + ': ' + f.querySelector('.kit-value').textContent
    ).join('\\n')
  } else {
    text = btn.previousElementSibling.textContent
  }
  await navigator.clipboard.writeText(text)
  const old = btn.textContent
  btn.textContent = 'Copied'
  setTimeout(() => { btn.textContent = old }, 1200)
})
</script>
`

// ── Applications dashboard (/applications) ───────────────────────────────────

export const APPLICATIONS_PAGE = `<!DOCTYPE html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
${THEME_INIT_SCRIPT}
<title>Provena — Applications</title>
<style>
${APP_SHELL_CSS}
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, system-ui, sans-serif; background: var(--c-page-bg); color: var(--c-text); }
h1 { font-size: 1.125rem; font-weight: 700; }
.subtitle { color: var(--c-text-muted); font-size: 0.875rem; margin-top: 0.125rem; }
.header-actions { display: flex; gap: 1rem; align-items: center; }
.header-actions a { font-size: 0.875rem; color: var(--c-text); font-weight: 600; text-decoration: none; }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: 0.75rem; margin: 1rem 0; }
.card { background: var(--c-surface); border: 1px solid var(--c-border); border-radius: 0.5rem; padding: 0.75rem 1rem; }
.card .num { font-size: 1.5rem; font-weight: 700; }
.card .lbl { font-size: 0.75rem; color: var(--c-text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
.add-form { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
.add-form select, .add-form input { font-size: 0.875rem; padding: 0.5rem 0.625rem; border: 1px solid var(--c-border-strong); border-radius: 0.375rem; background: var(--c-surface); color: var(--c-text); }
.add-form input[name="url"] { flex: 1; min-width: 14rem; }
.add-form button { font-size: 0.875rem; font-weight: 600; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; background: var(--c-accent-bg); color: var(--c-white); cursor: pointer; }
.app-table { width: 100%; border-collapse: collapse; background: var(--c-surface); border-radius: 0.5rem; overflow: hidden; border: 1px solid var(--c-border); }
.app-table th, .app-table td { padding: 0.625rem 0.75rem; text-align: left; font-size: 0.875rem; border-bottom: 1px solid var(--c-border); }
.app-table th { background: var(--c-surface-hover); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--c-text-faint); }
.app-table tr.stale td { background: color-mix(in srgb, #c62828 8%, transparent); }
.app-table select, .app-table input { font-size: 0.8125rem; padding: 0.3rem 0.4rem; border: 1px solid var(--c-border); border-radius: 0.375rem; background: var(--c-page-bg); color: var(--c-text); max-width: 100%; }
.app-table input.action { min-width: 10rem; }
.empty { padding: 2rem; text-align: center; color: var(--c-text-muted); font-size: 0.875rem; }
</style>
${renderAppShell(
  'applications',
  '<div class="page-header">' +
  '<div class="header-actions" style="justify-content:space-between;">' +
  '<div><h1>Applications</h1>' +
  '<p class="subtitle">Track each application from ready to outcome — next actions and stale follow-ups surface here.</p></div>' +
  '<a href="/kit">Application Kit →</a>' +
  '</div>' +
  '</div>',
  '<div class="summary" id="summary">' +
  '<div class="card"><div class="num" id="sum-active">–</div><div class="lbl">Active</div></div>' +
  '<div class="card"><div class="num" id="sum-next">–</div><div class="lbl">Next actions</div></div>' +
  '<div class="card"><div class="num" id="sum-stale">–</div><div class="lbl">Stale &gt;21d</div></div>' +
  '<div class="card"><div class="num" id="sum-waiting">–</div><div class="lbl">Waiting on me</div></div>' +
  '</div>' +
  '<form class="add-form" id="add-form" onsubmit="return addApplication(event)">' +
  '<select name="platform" id="platform-select"></select>' +
  '<input name="url" type="url" placeholder="Job post URL (optional)">' +
  '<input name="notes" placeholder="Notes (optional)">' +
  '<button type="submit">Add application</button>' +
  '</form>' +
  '<div id="app-list"><div class="empty">Loading…</div></div>'
)}
<script>
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
}
let STATUSES = []
async function load() {
  const res = await fetch('/api/applications')
  const data = await res.json()
  STATUSES = data.statuses
  const sel = document.getElementById('platform-select')
  sel.innerHTML = data.platforms.map((p) => '<option value="' + esc(p) + '">' + esc(p) + '</option>').join('')
  render(data)
}
function render(data) {
  document.getElementById('sum-active').textContent = data.summary.active.length
  document.getElementById('sum-next').textContent = data.summary.nextActions.length
  document.getElementById('sum-stale').textContent = data.summary.stale.length
  document.getElementById('sum-waiting').textContent = data.summary.waitingOnMe.length
  const stale = new Set(data.summary.stale.map((s) => s.id))
  const list = document.getElementById('app-list')
  if (!data.applications.length) {
    list.innerHTML = '<div class="empty">No applications yet — add your first one above.</div>'
    return
  }
  list.innerHTML = '<table class="app-table"><thead><tr>' +
    '<th>Platform</th><th>Status</th><th>Next action</th><th>Due</th><th>Applied</th>' +
    '</tr></thead><tbody>' +
    data.applications.map((a) =>
      '<tr' + (stale.has(a.id) ? ' class="stale"' : '') + '>' +
      '<td>' + (a.url
        ? '<a href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer">' + esc(a.platform) + '</a>'
        : esc(a.platform)) + '</td>' +
      '<td><select onchange="updateApplication(\'' + esc(a.id) + '\', {status: this.value})">' +
      STATUSES.map((s) => '<option value="' + esc(s) + '"' + (s === a.status ? ' selected' : '') + '>' + esc(s) + '</option>').join('') +
      '</select></td>' +
      '<td><input class="action" value="' + esc(a.nextAction) + '" placeholder="none" ' +
      'onchange="updateApplication(\'' + esc(a.id) + '\', {nextAction: this.value})"></td>' +
      '<td><input type="date" value="' + esc(a.nextActionDue) + '" ' +
      'onchange="updateApplication(\'' + esc(a.id) + '\', {nextActionDue: this.value})"></td>' +
      '<td>' + esc(a.appliedAt ? String(a.appliedAt).slice(0, 10) : '—') + '</td>' +
      '</tr>'
    ).join('') +
    '</tbody></table>'
}
async function updateApplication(id, patch) {
  const res = await fetch('/api/applications/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(Object.assign({ id }, patch)),
  })
  if (!res.ok) { alert(await res.text()); load(); return }
  load()
}
async function addApplication(e) {
  e.preventDefault()
  const form = e.target
  const res = await fetch('/api/applications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platform: form.platform.value,
      url: form.url.value || undefined,
      notes: form.notes.value || undefined,
    }),
  })
  if (!res.ok) { alert(await res.text()); return false }
  form.reset()
  load()
  return false
}
load()
</script>
`
