import test from 'node:test';
import assert from 'node:assert/strict';
import { UserService } from '../services/user-service/src/userService.js';

test('UserService upserts and fetches user', () => {
  const service = new UserService();

  const created = service.upsert({ id: '1', email: 'Test@Email.com', name: 'Test' });
  const fetched = service.findById('1');

  assert.equal(created.email, 'test@email.com');
  assert.ok(created.updatedAt);
  assert.deepEqual(fetched, created);
});
