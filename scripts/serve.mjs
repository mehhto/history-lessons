import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(process.cwd());
const port = Number(process.env.PORT || process.argv[2] || 8080);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8', '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const server = http.createServer(async (request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  const resolved = path.resolve(root, `.${requestPath}`);
  if (!resolved.startsWith(root)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const details = await stat(resolved);
    const file = details.isDirectory() ? path.join(resolved, 'index.html') : resolved;
    const fileDetails = await stat(file);
    if (!fileDetails.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Nie znaleziono pliku.');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Lekcje lokalnie: http://127.0.0.1:${port}/`);
  console.log('Zatrzymaj serwer: Ctrl+C');
});
