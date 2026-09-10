import { cp, mkdir, mkdtemp, rm, readFile, stat, rename } from 'node:fs/promises';
import path from 'node:path';
import { validateSite } from './validate-site.mjs';

export async function buildSite(directory) {
  const root = path.resolve(directory);
  const out = path.join(root, 'dist');
  const stage = await mkdtemp(path.join(root, '.build-'));
  const backup = stage + '.previous';
  const removeOwned = async target => {
    if (path.dirname(target) !== root || !path.basename(target).startsWith('.build-')) throw new Error('Invalid build cleanup path');
    await rm(target, { recursive: true, force: true });
  };
  let installed = false;
  try {
    await mkdir(path.join(stage, 'images'));
    for (const file of ['index.html', 'style.css', 'appHandler.js', 'src', 'fonts', 'images/invader.png', 'images/shooter.png', 'images/orbital.jpg']) {
      await cp(path.join(root, file), path.join(stage, file), { recursive: true });
    }
    for (const file of ['images/orbital.jpg', 'images/shooter.png', 'images/invader.png', 'fonts/space-grotesk-latin.woff2', 'fonts/ibm-plex-mono-latin.woff2']) {
      if (!(await stat(path.join(stage, file))).size) throw new Error(`Empty asset: ${file}`);
    }
    const html = await readFile(path.join(stage, 'index.html'), 'utf8');
    if (!html.includes('id="launch-button"')) throw new Error('Game entry point missing');
    await validateSite(stage);
    let backedUp = false;
    try { await rename(out, backup); backedUp = true; } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await rename(stage, out); installed = true; }
    catch (error) { if (backedUp) await rename(backup, out); throw error; }
  } finally {
    await removeOwned(stage);
    if (installed) await removeOwned(backup);
  }
}
