import { createReadStream } from 'node:fs';
import { lstat, realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const lesson = argument('--lesson');
const output = argument('--output');
if (!lesson) {
  console.error('Użycie: npm run export:pdf -- --lesson classes/6/temat [--output presentation-backup.pdf]');
  process.exit(1);
}

const root = await realpath(process.cwd());
const lessonDirectory = await realpath(resolveWithin(root, lesson));
resolveWithin(root, lessonDirectory);

const outputName = output || 'presentation-backup.pdf';
if (path.isAbsolute(outputName) || path.dirname(outputName) !== '.') {
  throw new Error('Nazwa pliku PDF musi wskazywać plik bezpośrednio w katalogu lekcji.');
}
const outputPath = resolveWithin(lessonDirectory, outputName);
try {
  if ((await lstat(outputPath)).isSymbolicLink()) {
    throw new Error('Plik PDF nie może być dowiązaniem symbolicznym.');
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.md': 'text/markdown', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2' };

const server = http.createServer(async (request, response) => {
  try {
    const requestPath = decodeRequestPath(request.url);
    const requested = resolveWithin(root, `.${requestPath}`);
    const details = await stat(requested);
    const candidate = details.isDirectory() ? path.join(requested, 'index.html') : requested;
    const file = await realpath(candidate);
    resolveWithin(root, file);
    if (!(await stat(file)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch (error) {
    response.writeHead(error.message?.includes('poza dozwolonym katalogiem') ? 403 : 404).end();
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const publicLessonPath = path.relative(root, lessonDirectory).split(path.sep).map(encodeURIComponent).join('/');
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.goto(`http://127.0.0.1:${port}/${publicLessonPath}/?print-pdf`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.Reveal && window.Reveal.isReady());
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: outputPath, format: 'A4', landscape: true, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  console.log(`Zapisano PDF: ${path.relative(root, outputPath)}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
