import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

export async function validateSite(directory) {
  const root = path.resolve(directory);
  async function walk(folder) {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const file = path.join(folder, entry.name);
      if (entry.isDirectory()) { await walk(file); continue; }
      if (!/\.(html|css|js)$/.test(entry.name)) continue;
      const source = await readFile(file, 'utf8');
      const matches = entry.name.endsWith('.html') ? source.matchAll(/(?:src|href)="([^"]+)"/g)
        : entry.name.endsWith('.css') ? source.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)
        : source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g);
      for (const [, reference] of matches) {
        if (/^(?:https?:|data:|#)/.test(reference)) continue;
        if (entry.name.endsWith('.js') && !reference.startsWith('.')) throw new Error(`Unsupported browser import: ${reference}`);
        const target = fileURLToPath(new URL(reference, pathToFileURL(file)));
        const relative = path.relative(root, target);
        if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) throw new Error(`Reference escapes output: ${reference}`);
        const asset = await stat(target);
        if (!asset.isFile() || !asset.size) throw new Error(`Missing or empty reference: ${reference}`);
      }
    }
  }
  await walk(root);
}
