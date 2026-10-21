# Aveiq.app

Initial migration-ready monorepo foundation for feature implementation and architecture-driven delivery.

## Quick start

```bash
npm install
npm run lint
npm run build
npm test
```

## Repository layout

- `apps/api` — entrypoint API application.
- `services/user-service` — initial domain service for user-centric features.
- `packages/config` — environment and runtime configuration layer.
- `packages/core` — shared models/utilities.
- `packages/compat` — compatibility adapters for staged migration.
- `docs` — scope, architecture, migration map, parity matrix, and delivery docs.

## Current status

This repository now includes:

1. Migration scope and acceptance templates.
2. Architecture and module-boundary definition.
3. Initial foundational and domain modules.
4. Quality pipeline (lint/build/test + CI).
