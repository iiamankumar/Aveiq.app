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
- `services/auth-service`: signup/login/session validation and token lifecycle.
- `services/user-service`: user domain behavior.
- `services/database-service`: collection CRUD and indexing behavior.
- `services/storage-service`: file object storage and access checks.
- `services/functions-service`: function registration and execution.
- `services/realtime-service`: channel subscriptions and event streams.
- `services/messaging-service`: messaging channels, subscribers, and message delivery records.
- `services/team-service`: team membership and role hierarchy checks.
- `services/webhook-service`: webhook registration and delivery queueing.
- `services/audit-service`: audit trail of user/system actions.
- `services/admin-service`: maintenance mode and operational status.
- `services/extensions-service`: extension registration and invocation contract.
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
