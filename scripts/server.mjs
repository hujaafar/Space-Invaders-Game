import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const inside = (root, file) => {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative);
};

export function createPreviewServer(directory) {
  const root = path.resolve(directory);
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      const relative = path.relative(root, file);
      if (!inside(root, file) || relative.split(path.sep).some(part => part.startsWith('.'))) throw new Error('Unavailable path');
      // Lexical path checks alone cannot contain a junction or symlink to another directory.
      const [realRoot, realFile] = await Promise.all([realpath(root), realpath(file)]);
      if (!inside(realRoot, realFile) || !(await stat(realFile)).isFile()) throw new Error('Unavailable file');
      const body = await readFile(realFile);
      res.writeHead(200, { 'Content-Type': types[path.extname(realFile)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(body);
    } catch {
      res.writeHead(404); res.end('Not found');
    }
  });
}
