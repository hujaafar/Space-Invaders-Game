import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../', import.meta.url);
test('every local HTML, CSS, and module reference resolves to a nonempty file', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const css = await readFile(new URL('style.css', root), 'utf8');
  const js = await readFile(new URL('appHandler.js', root), 'utf8');
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g), ...css.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g), ...js.matchAll(/from '([^']+)'/g)].map(match => match[1]);
  for (const ref of new Set(refs.filter(value => !/^(https?:|#|data:)/.test(value)))) {
    const file = await stat(new URL(ref, root)); assert.ok(file.size > 0, `Missing or empty: ${ref}`);
  }
});
test('UI references match unique document IDs', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const js = await readFile(new URL('appHandler.js', root), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');
  for (const [, id] of js.matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `Unknown UI ID: ${id}`);
});
test('font binaries match their declared WOFF2 format', async () => {
  for (const file of ['space-grotesk-latin.woff2', 'ibm-plex-mono-latin.woff2']) {
    const bytes = await readFile(new URL(path.join('fonts', file), root)); assert.equal(bytes.toString('ascii', 0, 4), 'wOF2');
  }
});
