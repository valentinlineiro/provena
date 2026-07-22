# Stability

## Core

`@provena/core` is the foundation of the project. Changes are allowed only if they improve the conceptual model. Backward compatibility is a priority.

Core includes: domain types, `Profile`, projection types and selectors, `Renderer` and `WorkspaceLoader` interfaces, validation.

## Plugins

`@provena/yaml`, `@provena/markdown`, and any future package may evolve more rapidly. They implement interfaces defined in core and can be developed, tested, and versioned independently.

## Schema

The canonical schema (the types in `@provena/core`) follows semantic versioning:

- **Major** — breaking changes to the domain model (removing a field, changing a required field to optional, restructuring an aggregate).
- **Minor** — adding optional fields or new aggregate types.
- **Patch** — documentation, validation improvements, non-breaking refinements.

Any incompatible change requires a new major version. Migration guides will be provided.
