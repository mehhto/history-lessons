import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { decodeRequestPath, resolveWithin } from './safe-paths.mjs';
import { findCanvasIssues, inspectPresentation } from './render-probe.mjs';

export function renderIssues({ consoleErrors, overflow, canvasIssues = [] }) {
  return [
    ...consoleErrors.map((message) => `Błąd konsoli: ${message}`),
    ...overflow.map((selector) => `Przepełnienie: ${selector}`),
    ...canvasIssues,
  ];
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function startServer(root) {
  const types = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.md': 'text/markdown', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2' };
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

async function inspectEverySlide(page) {
  await page.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' }));
  const targets = await page.evaluate(() => Reveal.getSlides()
    .filter((slide) => slide.hasAttribute('data-slide-canvas'))
    .map((slide) => Reveal.getIndices(slide)));
  const output = [];
  for (const target of targets) {
    await page.evaluate((indices) => Reveal.slide(indices.h, indices.v ?? 0, -1), target);
    await page.waitForFunction((indices) => {
      const current = Reveal.getIndices();
      return current.h === indices.h && current.v === (indices.v ?? 0);
    }, target);
    await page.evaluate(() => Reveal.getCurrentSlide().querySelectorAll('.fragment').forEach((fragment) => fragment.classList.add('visible')));
    await page.waitForTimeout(20);
    const report = await inspectPresentation(page);
    const currentSlide = await awaitSlideName(page);
    output.push(...report.slides.filter((slide) => slide.slide === currentSlide));
  }
  return output;
}

async function awaitSlideName(page) {
  return page.evaluate(() => {
    const slide = Reveal.getCurrentSlide();
    return slide.id ? `#${slide.id}` : `slajd ${Reveal.getIndices().h + 1}`;
  });
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
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}/${relative}/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    const slides = await inspectEverySlide(page);
    const report = await inspectPresentation(page);
    const overflow = slides.filter((slide) => slide.content.some((node) => false)).map((slide) => slide.slide);
    const canvasIssues = slides.flatMap((slide) => findCanvasIssues({ ...slide, viewport: report.viewport }));
    const issues = renderIssues({ consoleErrors: errors, overflow, canvasIssues });
    if (issues.length) { console.error(issues.map((issue) => `· ${issue}`).join('\n')); process.exitCode = 1; }
    else console.log(`Render OK: ${relative} (pełne płótno i treść; wymagana osobna ocena wizualna).`);
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
}
