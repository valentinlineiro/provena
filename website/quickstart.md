# Try it in 5 minutes

Clone, install, create a workspace, and render it. No previous setup needed.

## 1. Clone and install

```bash
git clone https://github.com/valentinlineiro/provena.git
cd provena
npm install
```

## 2. Create a workspace

```bash
mkdir my-profile

cat > my-profile/person.yaml << 'EOF'
name: "Your Name"
email: "you@example.com"
title: "Software Engineer"
summary: "A short professional summary."
urls:
  github: "https://github.com/you"
EOF

cat > my-profile/provena.yaml << 'EOF'
version: "1.0"
EOF
```

## 3. Render it

Render as Markdown:

```bash
provena render my-profile
cat my-profile/resume.md
```

Render as JSON Resume:

```bash
provena render my-profile --format jsonresume
cat my-profile/resume.json
```

## 4. Validate it

```bash
provena validate my-profile
```

## Total time

Under five minutes.

## What just happened?

```
my-profile/
  person.yaml          ──┐
  provena.yaml          ──┤
                         ▼
                    Identity (canonical model)
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
                resume.md   resume.json
```

The YAML workspace became a canonical identity model. Two different
representations — Markdown and JSON Resume — were derived from the same
source, without any manual copying.

## Next steps

- See the [concept](/concept) behind the model
- Browse the [example workspace](https://github.com/valentinlineiro/provena/tree/main/examples/valen)
- Read the [architecture](/architecture)
- View the [source](https://github.com/valentinlineiro/provena) on GitHub
