import { createUser } from '../../core/src/types.js';

export function adaptLegacyUser(payload) {
  return createUser({
    id: payload.user_id,
    email: payload.user_email,
    name: payload.user_name
  });
}
