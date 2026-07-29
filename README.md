# Provena

Your professional identity as a single source of truth. Manage once. Export everywhere.

```bash
npx provena init my-profile     # guided setup (60 seconds)
cd my-profile && provena render # generates resume.md, resume.json
```

**Why:** Your resume, LinkedIn, website, and portfolio all diverge over time.
Provena stores your identity as structured data and projects it into any format.

### 60-second demo

```bash
git clone https://github.com/valenlb/provena.git && cd provena
npm install && npm run build
provena demo
```

You'll see a complete resume rendered from a canonical profile — no files to
create, no YAML to touch.

### Next: create your own profile

```bash
provena init my-profile
# answer 10 questions
provena render my-profile --stdout     # Markdown resume
provena render my-profile --format linkedin --stdout  # LinkedIn summary
provena render my-profile --format jsonresume         # JSON Resume schema
```

Edit the YAML files to add achievements, projects, and detail. Re-render
and all outputs stay in sync.

### CLI reference

| Command | What it does |
|---------|-------------|
| `provena init <dir>` | Guided questionnaire — creates workspace |
| `provena render <dir>` | Generates resume.md (default), use `--format` for others |
| `provena demo` | Shows an example profile rendered immediately |
| `provena validate <dir>` | Checks for missing references or duplicates |
| `provena import linkedin <file.zip>` | Imports LinkedIn data export |

### Status

Working: init, render (Markdown, HTML, JSON Resume, LinkedIn), validate,
LinkedIn import, merge engine, referential integrity checks.
