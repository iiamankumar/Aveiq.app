import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, extname } from 'node:path';

const root = process.cwd();
const ignored = new Set(['.git', 'node_modules']);
const files = [];

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (ignored.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (extname(fullPath) === '.js' || extname(fullPath) === '.mjs') {
      files.push(fullPath);
    }
  }
}

walk(root);
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
}

console.log(`Lint complete: ${files.length} files checked.`);
