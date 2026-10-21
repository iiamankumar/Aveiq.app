import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptLegacyUser } from '../packages/compat/src/legacyUserAdapter.js';

test('legacy adapter maps legacy keys to target user model', () => {
  const adapted = adaptLegacyUser({
    user_id: 99,
    user_email: 'LEGACY@MAIL.COM',
    user_name: 'Legacy User'
  });

  assert.equal(adapted.id, '99');
  assert.equal(adapted.email, 'legacy@mail.com');
  assert.equal(adapted.name, 'Legacy User');
});
