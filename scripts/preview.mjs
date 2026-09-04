import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';
import { isAllowedPreviewFile, isLessonPackageDirectory } from './preview-scope.mjs';

function argument(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const lesson = argument('--lesson');
const host = argument('--host', '127.0.0.1');
const port = Number(argument('--port', '8090'));
if (!lesson) throw new Error('Użycie: npm run preview -- --lesson classes/6/temat [--host 127.0.0.1|0.0.0.0] [--port 8090]');
if (!['127.0.0.1', '0.0.0.0'].includes(host)) throw new Error('Host podglądu musi być 127.0.0.1 albo 0.0.0.0.');
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Port musi być liczbą od 0 do 65535.');

const root = await realpath(process.cwd());
const classesDirectory = await realpath(path.join(root, 'classes'));
const lessonDirectory = await realpath(resolveWithin(root, lesson));
if (!isLessonPackageDirectory(lessonDirectory, classesDirectory)) {
  throw new Error('Podgląd wymaga katalogu pojedynczej lekcji: classes/<klasa>/<temat>.');
}

const publicLessonPath = path.relative(root, lessonDirectory).split(path.sep).map(encodeURIComponent).join('/');
const scope = {
  lessonDirectory,
  revealDirectory: await realpath(path.join(root, 'template/reveal')),
  componentsDirectory: await realpath(path.join(root, 'template/components')),
  themePath: await realpath(path.join(root, 'template/theme.css')),
};
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.md': 'text/markdown', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2' };

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeRequestPath(request.url);
    if (requestPath === '/') {
      response.writeHead(302, { Location: `/${publicLessonPath}/` }).end();
      return;
    }

    const requested = resolveWithin(root, `.${requestPath}`);
    const details = await stat(requested);
    const candidate = details.isDirectory() ? path.join(requested, 'index.html') : requested;
    const file = await realpath(candidate);
    resolveWithin(root, file);
    if (!(await stat(file)).isFile() || !isAllowedPreviewFile(file, scope)) throw new Error('Blocked');

    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(403).end('Forbidden');
  }
});

await new Promise((resolve) => server.listen(port, host, resolve));
const { port: activePort } = server.address();
console.log(`Preview ready: http://${host}:${activePort}/${publicLessonPath}/`);
console.log('Stop preview with Ctrl+C.');

process.on('SIGINT', () => server.close(() => process.exit(0)));
process.on('SIGTERM', () => server.close(() => process.exit(0)));
