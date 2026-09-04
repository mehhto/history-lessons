import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';

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

const root = path.resolve(process.cwd());
const lessonDirectory = path.resolve(root, lesson);
if (!lessonDirectory.startsWith(root)) throw new Error('Lekcja musi znajdować się w tym repozytorium.');
const outputPath = path.resolve(lessonDirectory, output || 'presentation-backup.pdf');
const mimeTypes = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.md': 'text/markdown', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2' };

const server = http.createServer(async (request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
  const resolved = path.resolve(root, `.${requestPath}`);
  if (!resolved.startsWith(root)) return response.writeHead(403).end();
  try {
    const details = await stat(resolved);
    const file = details.isDirectory() ? path.join(resolved, 'index.html') : resolved;
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
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
