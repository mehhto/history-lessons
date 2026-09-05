import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';

export function renderIssues({ consoleErrors, overflow }) {
  return [
    ...consoleErrors.map((message) => `Błąd konsoli: ${message}`),
    ...overflow.map((selector) => `Przepełnienie: ${selector}`),
  ];
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function startServer(root) {
  const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.md': 'text/markdown', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
  const server = http.createServer(async (request, response) => {
    try {
      const requested = resolveWithin(root, `.${decodeRequestPath(request.url)}`);
      const details = await stat(requested);
      const file = await realpath(details.isDirectory() ? path.join(requested, 'index.html') : requested);
      resolveWithin(root, file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      createReadStream(file).pipe(response);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const lesson = argument('--lesson');
  if (!lesson) throw new Error('Użycie: npm run check:render -- --lesson classes/6/temat');
  const root = await realpath(process.cwd());
  const lessonDirectory = await realpath(resolveWithin(root, lesson));
  const relative = path.relative(root, lessonDirectory).split(path.sep).map(encodeURIComponent).join('/');
  const server = await startServer(root);
  const errors = [];
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto(`http://127.0.0.1:${server.address().port}/${relative}/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.Reveal?.isReady());
    const overflow = await page.evaluate(() => [...document.querySelectorAll('.slides section')]
      .filter((section) => section.scrollHeight > section.clientHeight + 2 || section.scrollWidth > section.clientWidth + 2)
      .map((section, index) => section.id ? `#${section.id}` : `slajd ${index + 1}`));
    const issues = renderIssues({ consoleErrors: errors, overflow });
    if (issues.length) { console.error(issues.map((issue) => `· ${issue}`).join('\n')); process.exitCode = 1; } else console.log(`Render OK: ${relative} (kontrola techniczna; wymagana osobna ocena wizualna).`);
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
}
