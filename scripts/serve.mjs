import path from 'node:path';
import { createPreviewServer } from './server.mjs';

const root = path.resolve(process.argv[2] || '.');
const port = Number(process.env.PORT || 4173);
createPreviewServer(root).listen(port, '127.0.0.1', () => process.stdout.write(`Local: http://localhost:${port}\n`));
