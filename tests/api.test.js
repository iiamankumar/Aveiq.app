import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer } from '../apps/api/src/index.js';

function request(baseUrl, path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

test('health endpoint returns ok', async () => {
  const server = createApiServer();
  await new Promise((resolve) => server.listen(0, resolve));

  const { port } = server.address();
  const response = await request(`http://127.0.0.1:${port}`, '/health');
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');

  await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
});
