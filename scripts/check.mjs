import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
async function javascript(directory) {
  const files = [];
  for (const entry of await readdir(path.join(root, directory), { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await javascript(name));
    else if (/\.m?js$/.test(entry.name)) files.push(name);
  }
  return files;
}
const files = ['appHandler.js', ...await javascript('src'), ...await javascript('scripts'), ...await javascript('tests')].sort();
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
process.stdout.write(`Syntax checked ${files.length} JavaScript files.\n`);
