import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSite } from './build-site.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
await buildSite(root);
process.stdout.write('Built dependency-free site in dist/\n');
