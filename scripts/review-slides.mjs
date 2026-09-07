import { mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { resolveWithin } from './safe-paths.mjs';
import { startServer } from './render-check.mjs';

const arg = (name) => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;
const lesson = arg('--lesson');
if (!lesson) throw new Error('Użycie: npm run review:slides -- --lesson classes/5/temat');
const root = await realpath(process.cwd());
const directory = await realpath(resolveWithin(root, lesson));
const relative = path.relative(root, directory).split(path.sep).map(encodeURIComponent).join('/');
const output = path.join(root, '.hermes', 'reviews', path.relative(path.join(root, 'classes'), directory));
await mkdir(output, { recursive: true });
const server = await startServer(root);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${server.address().port}/${relative}/`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
  await page.evaluate(() => Reveal.configure({ transition: 'none', backgroundTransition: 'none' }));
  const targets = await page.evaluate(() => Reveal.getSlides().filter((slide) => slide.hasAttribute('data-slide-canvas')).map((slide) => ({ indices: Reveal.getIndices(slide), id: slide.id, purpose: slide.dataset.purpose, layout: slide.dataset.layout })));
  const cards = [];
  for (let i = 0; i < targets.length; i += 1) {
    const target = targets[i];
    await page.evaluate((indices) => Reveal.slide(indices.h, indices.v ?? 0, -1), target.indices);
    await page.waitForTimeout(40);
    await page.evaluate(() => Reveal.getCurrentSlide().querySelectorAll('.fragment').forEach((fragment) => fragment.classList.add('visible')));
    const name = `${String(i + 1).padStart(2, '0')}-${target.id || 'slide'}.png`;
    await page.screenshot({ path: path.join(output, name) });
    const metrics = await page.evaluate(() => {
      const slide = Reveal.getCurrentSlide();
      const text = slide.querySelector('.slide-content')?.innerText || '';
      const small = [...slide.querySelectorAll('figcaption,.source-label,.small')].some((el) => Number.parseFloat(getComputedStyle(el).fontSize) < 18);
      return { chars: text.length, small };
    });
    const warnings = [metrics.chars > 500 ? 'długi widoczny tekst — sprawdź hierarchię' : '', metrics.small ? 'mały podpis — sprawdź projekcję' : ''].filter(Boolean);
    cards.push({ ...target, name, warnings });
  }
  const escape = (value) => String(value || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const html = `<!doctype html><meta charset="utf-8"><title>Review: ${escape(lesson)}</title><style>body{font:16px system-ui;margin:24px;background:#f7f2e8;color:#1f2933}main{max-width:1300px;margin:auto}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:18px}.card{background:#fff;padding:12px;border-radius:12px;box-shadow:0 4px 12px #0002}.card img{width:100%;height:auto;border:1px solid #ddd}.meta{display:flex;gap:8px;flex-wrap:wrap}.tag{background:#e7eef4;padding:2px 7px;border-radius:999px}.warning{color:#8d3d10}</style><main><h1>Przegląd: ${escape(lesson)}</h1><p>Ręczny test: pierwsze 2 sekundy • zgodność obrazu i tekstu • czytelność map/etykiet • status rekonstrukcji • czas, produkt i dowód w zadaniu.</p><div class="grid">${cards.map((card, index) => `<article class="card"><img src="${escape(card.name)}" alt="Slajd ${index + 1}"><h2>${index + 1}. ${escape(card.id || 'bez id')}</h2><div class="meta"><span class="tag">${escape(card.purpose)}</span><span class="tag">${escape(card.layout)}</span></div>${card.warnings.map((warning) => `<p class="warning">⚠ ${escape(warning)}</p>`).join('')}</article>`).join('')}</div></main>`;
  await writeFile(path.join(output, 'index.html'), html, 'utf8');
  console.log(`Review: ${path.relative(root, path.join(output, 'index.html'))}`);
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
