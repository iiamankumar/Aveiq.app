import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../apps/api/src/index.js';

function request(baseUrl, path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

async function createServerContext() {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  return {
    baseUrl,
    async close() {
      await new Promise((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve()))
      );
    }
  };
}

test('health endpoint returns ok', async () => {
  const ctx = await createServerContext();
  const response = await request(ctx.baseUrl, '/health');
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.ok(Number.isInteger(body.requests));

  await ctx.close();
});

test('auth signup/login/session flow works with bearer token validation', async () => {
  const ctx = await createServerContext();

  const signupRes = await request(ctx.baseUrl, '/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'u1', email: 'user@example.com', password: 'pw123', name: 'U 1' })
  });
  assert.equal(signupRes.status, 201);

  const loginRes = await request(ctx.baseUrl, '/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'pw123' })
  });
  assert.equal(loginRes.status, 200);
  const loginBody = await loginRes.json();
  assert.ok(loginBody.token);

  const sessionRes = await request(
    ctx.baseUrl,
    `/auth/session?token=${encodeURIComponent(loginBody.token)}`
  );
  assert.equal(sessionRes.status, 200);
  const sessionBody = await sessionRes.json();
  assert.equal(sessionBody.user.id, 'u1');

  await ctx.close();
});

test('database indexes and query return matching documents', async () => {
  const ctx = await createServerContext();

  const createIndexRes = await request(ctx.baseUrl, '/db/tasks/indexes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ field: 'status' })
  });
  assert.equal(createIndexRes.status, 201);

  await request(ctx.baseUrl, '/db/tasks/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 't1', status: 'open', title: 'Task 1' })
  });

  await request(ctx.baseUrl, '/db/tasks/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 't2', status: 'done', title: 'Task 2' })
  });

  const queryRes = await request(ctx.baseUrl, '/db/tasks/query?field=status&value=open');
  assert.equal(queryRes.status, 200);
  const result = await queryRes.json();
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 't1');

  await ctx.close();
});

test('storage access control allows team admin to read private file', async () => {
  const ctx = await createServerContext();

  const teamRes = await request(ctx.baseUrl, '/teams', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'team-1', name: 'Core Team', ownerId: 'owner-1' })
  });
  assert.equal(teamRes.status, 201);

  const addMemberRes = await request(ctx.baseUrl, '/teams/team-1/members', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ userId: 'admin-1', role: 'admin' })
  });
  assert.equal(addMemberRes.status, 200);

  const uploadRes = await request(ctx.baseUrl, '/storage/files', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      id: 'f1',
      name: 'secret.txt',
      content: 'c2VjcmV0',
      ownerId: 'owner-1',
      visibility: 'private'
    })
  });
  assert.equal(uploadRes.status, 201);

  const unauthorizedRes = await request(
    ctx.baseUrl,
    '/storage/files/f1?requesterId=random-user&teamId=team-1'
  );
  assert.equal(unauthorizedRes.status, 403);

  const authorizedRes = await request(
    ctx.baseUrl,
    '/storage/files/f1?requesterId=admin-1&teamId=team-1'
  );
  assert.equal(authorizedRes.status, 200);
  const body = await authorizedRes.json();
  assert.equal(body.id, 'f1');

  await ctx.close();
});

test('functions execution, realtime events, webhook deliveries, and audit logs are recorded', async () => {
  const ctx = await createServerContext();

  const webhookRes = await request(ctx.baseUrl, '/webhooks/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ id: 'wh1', eventType: 'function.execute', target: 'https://example.test/hook' })
  });
  assert.equal(webhookRes.status, 201);

  const subscribeRes = await request(ctx.baseUrl, '/realtime/subscribe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ channel: 'functions.aggregate', subscriberId: 'client-1' })
  });
  assert.equal(subscribeRes.status, 200);

  const registerFnRes = await request(ctx.baseUrl, '/functions/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'aggregate', logicType: 'sum' })
  });
  assert.equal(registerFnRes.status, 201);

  const execRes = await request(ctx.baseUrl, '/functions/execute', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'aggregate', payload: { numbers: [1, 2, 3] } })
  });
  assert.equal(execRes.status, 200);
  const execution = await execRes.json();
  assert.equal(execution.output.result, 6);

  const eventsRes = await request(ctx.baseUrl, '/realtime/channels/functions.aggregate');
  assert.equal(eventsRes.status, 200);
  const events = await eventsRes.json();
  assert.equal(events.length, 1);

  const deliveriesRes = await request(ctx.baseUrl, '/webhooks/deliveries');
  assert.equal(deliveriesRes.status, 200);
  const deliveries = await deliveriesRes.json();
  assert.equal(deliveries.length, 1);
  assert.equal(deliveries[0].eventType, 'function.execute');

  const logsRes = await request(ctx.baseUrl, '/audit/logs');
  assert.equal(logsRes.status, 200);
  const logs = await logsRes.json();
  assert.ok(logs.some((event) => event.eventType === 'function.execute'));

  await ctx.close();
});

test('invalid json body is handled with structured error response', async () => {
  const ctx = await createServerContext();
  const response = await request(ctx.baseUrl, '/users', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"id":"broken"'
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.code, 'REQUEST_BODY_INVALID_JSON');

  await ctx.close();
});
