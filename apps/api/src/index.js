import { createServer } from 'node:http';
import { loadEnv } from '../../../packages/config/src/env.js';
import { asAppError, AppError } from '../../../packages/core/src/errors.js';
import { AuthService } from '../../../services/auth-service/src/authService.js';
import { AuditService } from '../../../services/audit-service/src/auditService.js';
import { DatabaseService } from '../../../services/database-service/src/databaseService.js';
import { FunctionsService } from '../../../services/functions-service/src/functionsService.js';
import { RealtimeService } from '../../../services/realtime-service/src/realtimeService.js';
import { StorageService } from '../../../services/storage-service/src/storageService.js';
import { TeamService } from '../../../services/team-service/src/teamService.js';
import { UserService } from '../../../services/user-service/src/userService.js';
import { WebhookService } from '../../../services/webhook-service/src/webhookService.js';

const userService = new UserService();
const teamService = new TeamService();
const authService = new AuthService({ userService, jwtSecret: process.env.JWT_SECRET || 'dev-secret' });
const databaseService = new DatabaseService();
const storageService = new StorageService();
const functionsService = new FunctionsService();
const realtimeService = new RealtimeService();
const webhookService = new WebhookService();
const auditService = new AuditService();
let requestCount = 0;
let errorCount = 0;

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
  }

  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new AppError('Invalid JSON body', 400, 'REQUEST_BODY_INVALID_JSON');
  }
}

function tokenFromRequest(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    const url = new URL(req.url || '/', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      throw new AppError('Missing bearer token', 401, 'AUTH_TOKEN_MISSING');
    }
    return token;
  }
  return header.slice('Bearer '.length).trim();
}

function withAudit(eventType, details) {
  auditService.log(eventType, details);
  webhookService.trigger(eventType, details);
  realtimeService.publish('audit', eventType, details);
}

function splitPath(url) {
  const [pathname] = String(url || '').split('?');
  return pathname.split('/').filter(Boolean);
}

export function createApiServer() {
  return createServer(async (req, res) => {
    requestCount += 1;
    try {
      const pathParts = splitPath(req.url);
      const pathname = `/${pathParts.join('/')}`;

      if (pathname === '/health' && req.method === 'GET') {
        sendJson(res, 200, {
          status: 'ok',
          uptimeSeconds: Math.floor(process.uptime()),
          requests: requestCount,
          errors: errorCount
        });
        return;
      }

      if (pathname === '/metrics' && req.method === 'GET') {
        sendJson(res, 200, {
          requests: requestCount,
          errors: errorCount,
          auditEvents: auditService.list().length
        });
        return;
      }

      if (pathname === '/auth/signup' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const user = authService.signup(payload);
        withAudit('auth.signup', { userId: user.id });
        sendJson(res, 201, user);
        return;
      }

      if (pathname === '/auth/login' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const session = authService.login(payload);
        withAudit('auth.login', { userId: session.user.id });
        sendJson(res, 200, session);
        return;
      }

      if (pathname === '/auth/session' && req.method === 'GET') {
        const token = tokenFromRequest(req);
        const session = authService.validateToken(token);
        sendJson(res, 200, session);
        return;
      }

      if (pathname === '/users' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const record = userService.upsert(payload);
        withAudit('user.upsert', { userId: record.id });
        sendJson(res, 200, record);
        return;
      }

      if (pathParts[0] === 'users' && pathParts[1] && req.method === 'GET') {
        const user = userService.findById(pathParts[1]);
        if (!user) {
          throw new AppError('User not found', 404, 'USER_NOT_FOUND');
        }
        sendJson(res, 200, user);
        return;
      }

      if (pathname === '/teams' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const team = teamService.createTeam(payload);
        withAudit('team.create', { teamId: team.id });
        sendJson(res, 201, team);
        return;
      }

      if (pathParts[0] === 'teams' && pathParts[2] === 'members' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const team = teamService.addMember(pathParts[1], payload.userId, payload.role);
        withAudit('team.member.add', { teamId: pathParts[1], userId: payload.userId, role: payload.role });
        sendJson(res, 200, team);
        return;
      }

      if (pathParts[0] === 'db' && pathParts[2] === 'indexes' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const index = databaseService.createIndex(pathParts[1], payload.field);
        sendJson(res, 201, index);
        return;
      }

      if (pathParts[0] === 'db' && pathParts[2] === 'documents' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const doc = databaseService.put(pathParts[1], payload);
        withAudit('db.put', { collection: pathParts[1], id: doc.id });
        sendJson(res, 200, doc);
        return;
      }

      if (pathParts[0] === 'db' && pathParts[2] === 'documents' && pathParts[3] && req.method === 'GET') {
        const doc = databaseService.get(pathParts[1], pathParts[3]);
        if (!doc) {
          throw new AppError('Document not found', 404, 'DB_DOC_NOT_FOUND');
        }
        sendJson(res, 200, doc);
        return;
      }

      if (pathParts[0] === 'db' && pathParts[2] === 'query' && req.method === 'GET') {
        const url = new URL(req.url, 'http://localhost');
        const field = url.searchParams.get('field');
        const value = url.searchParams.get('value');
        if (!field) {
          throw new AppError('Query field is required', 400, 'DB_QUERY_INVALID');
        }
        sendJson(res, 200, databaseService.query(pathParts[1], field, value));
        return;
      }

      if (pathname === '/storage/files' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const file = storageService.upload(payload);
        withAudit('storage.upload', { fileId: file.id, ownerId: file.ownerId });
        sendJson(res, 201, file);
        return;
      }

      if (pathParts[0] === 'storage' && pathParts[1] === 'files' && pathParts[2] && req.method === 'GET') {
        const url = new URL(req.url, 'http://localhost');
        const requesterId = url.searchParams.get('requesterId');
        const teamId = url.searchParams.get('teamId');
        let canReadPrivate = false;
        if (teamId && requesterId) {
          canReadPrivate = teamService.hasMinimumRole(teamId, requesterId, 'admin');
        }
        const file = storageService.get(pathParts[2], requesterId, canReadPrivate);
        sendJson(res, 200, file);
        return;
      }

      if (pathname === '/functions/register' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const fn = functionsService.register(payload);
        withAudit('function.register', { name: fn.name, logicType: fn.logicType });
        sendJson(res, 201, fn);
        return;
      }

      if (pathname === '/functions/execute' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const execution = functionsService.execute(payload.name, payload.payload);
        realtimeService.publish(`functions.${execution.name}`, 'function.executed', execution);
        withAudit('function.execute', { name: execution.name, executionId: execution.id });
        sendJson(res, 200, execution);
        return;
      }

      if (pathname === '/realtime/subscribe' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        sendJson(res, 200, realtimeService.subscribe(payload.channel, payload.subscriberId));
        return;
      }

      if (pathParts[0] === 'realtime' && pathParts[1] === 'channels' && pathParts[2] && req.method === 'GET') {
        sendJson(res, 200, realtimeService.getEvents(pathParts[2]));
        return;
      }

      if (pathname === '/webhooks/register' && req.method === 'POST') {
        const payload = await readJsonBody(req);
        const webhook = webhookService.register(payload);
        sendJson(res, 201, webhook);
        return;
      }

      if (pathname === '/webhooks/deliveries' && req.method === 'GET') {
        sendJson(res, 200, webhookService.listDeliveries());
        return;
      }

      if (pathname === '/audit/logs' && req.method === 'GET') {
        sendJson(res, 200, auditService.list());
        return;
      }

      throw new AppError('Not found', 404, 'NOT_FOUND');
    } catch (error) {
      errorCount += 1;
      const appError = asAppError(error);
      sendJson(res, appError.statusCode, { error: appError.message, code: appError.code });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = loadEnv();
  const server = createApiServer();
  server.listen(env.port, () => {
    process.stdout.write(`API listening on :${env.port}\n`);
  });
}
