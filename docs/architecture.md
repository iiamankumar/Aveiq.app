# Target Architecture

## Runtime stack

- Runtime: Node.js 20+
- Language: JavaScript (ESM)
- Testing: Node built-in test runner
- CI: GitHub Actions

## Monorepo structure

- `apps/*`: user-facing executables and deployment entrypoints.
- `services/*`: business-domain implementation.
- `packages/*`: cross-cutting reusable modules.

## Module boundaries and ownership

- `apps/api`: API composition only; no domain logic.
- `services/user-service`: user domain behavior.
- `packages/config`: environment loading/validation.
- `packages/core`: shared schema-free models and utility logic.
- `packages/compat`: temporary adapters for migration compatibility.

## Integration contracts

- Apps call service functions through explicit imports.
- Services consume shared types/utilities from `packages/core`.
- Compatibility layer converts legacy payload shapes into target shapes.

## Data and auth model (initial)

- Data access is currently in-memory to enable migration incrementally.
- Auth contract is stub-ready through request context and can be replaced with provider middleware in `apps/api`.
