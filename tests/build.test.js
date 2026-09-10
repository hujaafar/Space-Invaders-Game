import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { buildSite } from '../scripts/build-site.mjs';
async function fixture(t, complete = true) {
  const root = await mkdtemp(path.join(tmpdir(), 'orbital-build-'));
  t.after(async () => {
    assert.equal(path.dirname(root), path.resolve(tmpdir())); assert.ok(path.basename(root).startsWith('orbital-build-'));
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'dist')); await writeFile(path.join(root, 'dist/index.html'), 'Previous good build');
  if (complete) {
    for (const dir of ['src', 'fonts', 'images']) await mkdir(path.join(root, dir));
    for (const file of ['style.css', 'appHandler.js', 'src/engine.js', 'fonts/space-grotesk-latin.woff2', 'fonts/ibm-plex-mono-latin.woff2', 'images/orbital.jpg', 'images/shooter.png', 'images/invader.png']) await writeFile(path.join(root, file), 'fixture');
    await writeFile(path.join(root, 'index.html'), '<button id="launch-button">Launch</button>');
  }
  return root;
}
test('a failed build preserves the previous output and cleans its staging directory', async t => {
  const root = await fixture(t, false); await assert.rejects(buildSite(root));
  assert.equal(await readFile(path.join(root, 'dist/index.html'), 'utf8'), 'Previous good build');
  assert.deepEqual(await readdir(root), ['dist']);
});
test('a valid build replaces old output and does not package repository files', async t => {
  const root = await fixture(t); await writeFile(path.join(root, '.env'), 'PRIVATE');
  await buildSite(root); assert.match(await readFile(path.join(root, 'dist/index.html'), 'utf8'), /launch-button/);
  assert.ok(!(await readdir(path.join(root, 'dist'))).includes('.env'));
  assert.ok(!(await readdir(root)).some(file => file.startsWith('.build-')));
});
