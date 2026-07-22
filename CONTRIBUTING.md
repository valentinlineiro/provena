# Contributing

## Architecture

Provena follows a four-layer architecture: **Persistence → Domain → Projection → Presentation**.

The domain model is the only layer that is never a plugin. Everything else can be replaced.

## How to extend

- **New aggregate type** → core review. Touches the canonical model.
- **New output format** → plugin. Implement `Renderer<T>` for an existing projection.
- **New platform** (LinkedIn, JSON Resume, etc.) → projection + renderer. The projection selects and reshapes; the renderer writes.
- **New data source** (SQLite, Notion, etc.) → plugin. Implement `WorkspaceLoader`.

## Guiding question

Every contribution should answer:

> Does this strengthen the canonical model or expand the plugin ecosystem?

If neither, it probably does not belong in Provena.

## Core stability

`@provena/core` follows semantic versioning. Breaking changes require a major version. Plugins may evolve at their own pace.
