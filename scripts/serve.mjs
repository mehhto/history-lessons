import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';

const root = await realpath(process.cwd());
const port = Number(process.env.PORT || process.argv[2] || 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeRequestPath(request.url);
    const requested = resolveWithin(root, `.${requestPath}`);
    const details = await stat(requested);
    const candidate = details.isDirectory() ? path.join(requested, 'index.html') : requested;
    const file = await realpath(candidate);
    resolveWithin(root, file);
    const fileDetails = await stat(file);
    if (!fileDetails.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch (error) {
    const status = error.message?.includes('poza dozwolonym katalogiem') ? 403 : 404;
    response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' }).end(status === 403 ? 'Forbidden' : 'Nie znaleziono pliku.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Lekcje lokalnie: http://127.0.0.1:${port}/`);
  console.log('Zatrzymaj serwer: Ctrl+C');
});
