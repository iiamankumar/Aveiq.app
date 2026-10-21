import { existsSync } from 'node:fs';

const required = [
  'apps/api/src/index.js',
  'services/user-service/src/userService.js',
  'packages/config/src/env.js',
  'packages/core/src/types.js',
  'packages/compat/src/legacyUserAdapter.js'
];

for (const file of required) {
  if (!existsSync(file)) {
    throw new Error(`Missing required build artifact source: ${file}`);
  }
}

console.log('Build validation complete: architecture baseline files are present.');
