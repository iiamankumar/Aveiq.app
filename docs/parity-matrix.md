# Feature Parity Matrix

| Feature | Priority | Source Reference | Target Module | Status | Tests |
|---|---|---|---|---|---|
| Health endpoint | Must-have | N/A baseline | `apps/api` | Implemented | `tests/api.test.js` |
| User upsert service | Must-have | N/A baseline | `services/user-service` | Implemented | `tests/user-service.test.js` |
| Legacy user payload adapter | Must-have | N/A baseline | `packages/compat` | Implemented | `tests/compat.test.js` |
| Auth signup/login/session token validation | Must-have | appwrite/auth | `services/auth-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Users read/write endpoints | Must-have | appwrite/users | `services/user-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Database CRUD + query indexes | Must-have | appwrite/databases | `services/database-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Storage upload/download + access control | Must-have | appwrite/storage | `services/storage-service`, `services/team-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Functions registration/execution | Next | appwrite/functions | `services/functions-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Realtime subscriptions/events | Next | appwrite/realtime | `services/realtime-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Teams and advanced role checks | Next | appwrite/teams | `services/team-service`, `apps/api` | Implemented | `tests/api.test.js` |
| Webhooks + audit logs | Next | appwrite/webhooks | `services/webhook-service`, `services/audit-service`, `apps/api` | Implemented | `tests/api.test.js` |
