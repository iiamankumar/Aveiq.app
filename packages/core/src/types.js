export function createUser(input) {
  if (!input?.id || !input?.email) {
    throw new Error('User requires id and email');
  }

  return {
    id: String(input.id),
    email: String(input.email).toLowerCase(),
    name: input.name ? String(input.name) : ''
  };
}
