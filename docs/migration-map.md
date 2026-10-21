# Migration Map

| Source Component | Target Component | Target Path | Status | Notes |
|---|---|---|---|---|
| Legacy env/config loader | Config module | `packages/config/src/env.js` | Implemented (baseline) | Replace when source inventory is provided |
| Legacy shared models/utils | Core package | `packages/core/src/*` | Implemented (baseline) | Extend once source model list is known |
| Legacy user domain | User service | `services/user-service/src/userService.js` | Implemented (baseline) | Replace in-memory repository with source-integrated persistence |
| Legacy API facade | API app | `apps/api/src/index.js` | Implemented (baseline) | Add routes per parity matrix |
| Legacy compatibility glue | Compat package | `packages/compat/src/legacyUserAdapter.js` | Implemented (baseline) | Remove after complete cutover |
