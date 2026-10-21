# Migration Map

| Source Component | Target Component | Target Path | Status | Notes |
|---|---|---|---|---|
| Legacy env/config loader | Config module | `packages/config/src/env.js` | Implemented (baseline) | Replace when source inventory is provided |
| Legacy shared models/utils | Core package | `packages/core/src/*` | Implemented (baseline) | Extend once source model list is known |
| Legacy user domain | User service | `services/user-service/src/userService.js` | Implemented (baseline) | Replace in-memory repository with source-integrated persistence |
| Legacy API facade | API app | `apps/api/src/index.js` | Implemented (Phase 1+2) | Includes auth, users, db, storage, functions, realtime, teams, webhooks, audit |
| Legacy compatibility glue | Compat package | `packages/compat/src/legacyUserAdapter.js` | Implemented (baseline) | Remove after complete cutover |
| Auth and session flows | Auth service | `services/auth-service/src/authService.js` | Implemented (Phase 1) | JWT-based session validation with in-memory credentials |
| Database collections/indexing | Database service | `services/database-service/src/databaseService.js` | Implemented (Phase 1) | In-memory indexed query support |
| Storage file handling | Storage service | `services/storage-service/src/storageService.js` | Implemented (Phase 1) | Private/public file access checks |
| Team and roles model | Team service | `services/team-service/src/teamService.js` | Implemented (Phase 2) | Owner/admin/member/viewer minimum role checks |
| Functions runtime | Functions service | `services/functions-service/src/functionsService.js` | Implemented (Phase 2) | Safe built-in handlers (echo/sum/uppercase) |
| Realtime fan-out | Realtime service | `services/realtime-service/src/realtimeService.js` | Implemented (Phase 2) | Channel subscriptions and event logs |
| Outbound event integration | Webhook service | `services/webhook-service/src/webhookService.js` | Implemented (Phase 2) | Registration and delivery queue simulation |
| Auditing and traceability | Audit service | `services/audit-service/src/auditService.js` | Implemented (Phase 2) | Structured action log for API flows |
| Messaging channels/events | Messaging service | `services/messaging-service/src/messagingService.js` | Implemented (Phase 3) | Channel management, subscription and message publish/list |
| Admin operations controls | Admin service | `services/admin-service/src/adminService.js` | Implemented (Phase 3) | Maintenance mode + system status contract |
| Extension integration facade | Extensions service | `services/extensions-service/src/extensionsService.js` | Implemented (Phase 3) | Register and invoke extension actions |
