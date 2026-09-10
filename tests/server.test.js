import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { createPreviewServer } from '../scripts/server.mjs';

async function fixture(t) {
  const temporary = await mkdtemp(path.join(tmpdir(), 'orbital-preview-'));
  const root = path.join(temporary, 'public'); await mkdir(root);
  await writeFile(path.join(root, 'index.html'), '<h1>Preview</h1>');
  await writeFile(path.join(root, '.env'), 'PRIVATE');
  const server = createPreviewServer(root); server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(async () => {
    server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
    assert.equal(path.dirname(temporary), path.resolve(tmpdir()));
    assert.ok(path.basename(temporary).startsWith('orbital-preview-'));
    await rm(temporary, { recursive: true, force: true });
  });
  return { root, temporary, url: `http://127.0.0.1:${server.address().port}` };
}
test('preview serves HTML but blocks hidden and missing files', async t => {
  const { url } = await fixture(t);
  const response = await fetch(url); assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.equal((await fetch(url + '/.env')).status, 404);
  assert.equal((await fetch(url + '/missing')).status, 404);
  assert.equal((await fetch(url + '/%E0%A4%A')).status, 404);
});
test('a junction to an outside directory cannot expose its contents', async t => {
  const { root, temporary, url } = await fixture(t);
  const secret = path.join(temporary, 'private'); await mkdir(secret);
  await writeFile(path.join(secret, 'secret.txt'), 'PRIVATE');
  await symlink(secret, path.join(root, 'escape'), 'junction');
  assert.equal((await fetch(url + '/escape/secret.txt')).status, 404);
});
