import { createServer } from 'node:http';
import { loadEnv } from '../../../packages/config/src/env.js';
import { UserService } from '../../../services/user-service/src/userService.js';

const userService = new UserService();

export function createApiServer() {
  return createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.url === '/users' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      const payload = JSON.parse(body || '{}');
      const record = userService.upsert(payload);
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(record));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const env = loadEnv();
  const server = createApiServer();
  server.listen(env.port, () => {
    process.stdout.write(`API listening on :${env.port}\n`);
  });
}
