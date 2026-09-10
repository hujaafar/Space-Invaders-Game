import { cp, mkdir, rm, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
if (path.dirname(out) !== root || path.basename(out) !== 'dist') throw new Error('Invalid build directory');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(path.join(out, 'images'), { recursive: true });
for (const file of ['index.html', 'style.css', 'appHandler.js', 'src', 'fonts', 'images/invader.png', 'images/shooter.png', 'images/orbital.jpg']) {
  await cp(path.join(root, file), path.join(out, file), { recursive: true });
}
// Missing assets fail the build instead of silently shipping a broken start screen.
for (const file of ['images/orbital.jpg', 'images/shooter.png', 'images/invader.png', 'fonts/space-grotesk-latin.woff2', 'fonts/ibm-plex-mono-latin.woff2']) {
  if (!(await stat(path.join(out, file))).size) throw new Error(`Empty asset: ${file}`);
}
const html = await readFile(path.join(out, 'index.html'), 'utf8');
if (!html.includes('id="launch-button"')) throw new Error('Game entry point missing');
process.stdout.write('Built dependency-free site in dist/\n');
