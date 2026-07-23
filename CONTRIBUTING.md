# Contributing

## How to extend

- **New aggregate type** → core review. Touches the canonical model.
- **New output format** → plugin. Implement `Renderer<TModel>` for an existing model type.
- **New platform** (LinkedIn, etc.) → `Projector<TModel>` + `Renderer<TModel>`. The projector selects and reshapes; the renderer serializes.
- **New data source** (SQLite, Notion, etc.) → plugin. Implement `WorkspaceLoader`.

## Development

```bash
npm install
npm run build     # tsc --noEmit
npm test          # node --import tsx --test packages/*/src/*.test.ts
npm run provena   # run the CLI
```

## Philosophy

Every contribution should answer:

> Does this strengthen the canonical model or expand the plugin ecosystem?

If neither, it probably does not belong in Provena.

The domain model is the only layer that is never a plugin. Everything else
can be replaced. Interface contracts (`Projector<TModel>`, `Renderer<TModel>`,
`WorkspaceLoader`) are stable. Implementations are interchangeable.

## Core stability

`@provena/core` follows semantic versioning. Breaking changes to `Identity`,
`Profile`, or core interfaces require a major version. Plugins may evolve at
their own pace.
