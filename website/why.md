# Why Provena

## The problem

Your résumé says one thing. Your LinkedIn says something slightly different.
Your speaker bio is outdated. Your website still shows last year's projects.

Nobody notices until they don't match.

Every time you update your career, you manually rebuild the same information
in five places. It's tedious, error-prone, and never ends.

## Why it happens

Your professional identity is not stored anywhere. What you have are platform
profiles — LinkedIn hosts one version, your résumé is a file on your laptop,
your GitHub profile is another. Each platform treats your identity as content
*it* owns. None of them talks to the others.

So the same fact — "I worked on X in 2024" — exists in multiple copies. And
copies diverge.

## What Provena proposes

Store your professional identity **once**. Derive everything else from it.

```
YAML workspace (facts)
       ↓
  Identity (canonical model)
       ↓
  resume.md · resume.json · (more formats)
```

Your LinkedIn, résumé, and website stop being separate documents. They become
different views of the same underlying facts.

Update one fact. Every representation reflects it.

## What Provena is not

Provena does not replace LinkedIn, résumé builders, or portfolio platforms.
It does not host your profile. It does not have a UI.

It is a domain model with a CLI — a tool for developers who want to own their
professional identity as structured data.

## An example

```yaml
# person.yaml
name: "Alex Morgan"
title: "Software Engineer"
summary: "Engineer focused on distributed systems."
```

That's your canonical identity.

Running:

```bash
provena render .
```

produces `resume.md`. Running:

```bash
provena render . --format jsonresume
```

produces `resume.json`. Same facts. Different formats. Always in sync.

## The deeper idea

> Facts over formatting. Evidence over claims.
> The domain model is canonical. Everything else is replaceable.

A résumé is not your identity. It is a *projection* of your identity — one
possible representation, optimized for one audience. Confusing the projection
for the source is why professional identity drifts.

Provena separates the two. The identity is the invariant. Everything else is a view.
