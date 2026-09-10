import path from 'node:path';
import { stat } from 'node:fs/promises';
import { createPreviewServer } from './server.mjs';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.env.PORT ?? 4173);
try {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT must be an integer from 0 to 65535.');
  if (!(await stat(path.join(root, 'index.html'))).isFile()) throw new Error('No index.html in the preview directory.');
  const server = createPreviewServer(root);
  server.on('error', error => {
    process.stderr.write(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to another number.\n` : `Preview failed: ${error.message}\n`);
    process.exitCode = 1;
  });
  server.listen(port, '127.0.0.1', () => process.stdout.write(`Local: http://localhost:${server.address().port}\n`));
} catch (error) {
  process.stderr.write(error.code === 'ENOENT' ? 'Preview files are missing. Run npm run build before npm run preview.\n' : `${error.message}\n`);
  process.exitCode = 1;
}
