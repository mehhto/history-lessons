import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(root, '.playwright-browsers');
const { chromium } = await import('playwright');
const { buildPortablePresentation } = await import('../scripts/export-portable.mjs');

const lesson = path.join(root, 'classes/4/jak-poznajemy-przeszlosc-historia-i-zrodla-historyczne');

test('portable presentation runs from file URL without server or network', async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'history-portable-'));
  const output = path.join(temporary, 'lekcja.html');
  const browser = await chromium.launch({ executablePath: path.join(root, '.playwright-browsers/chromium-1234/chrome-linux64/chrome') });
  try {
    const html = await buildPortablePresentation({ repoRoot: root, lessonDirectory: lesson });
    await writeFile(output, html, 'utf8');
    assert.match(html, /Tryb przenośny: jeden plik HTML/);
    assert.doesNotMatch(html, /(?:src|href)=["'](?:\.\.?\/|assets\/)/);

    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    const externalRequests = [];
    page.on('request', (request) => {
      if (/^https?:/.test(request.url())) externalRequests.push(request.url());
    });
    await page.goto(new URL(`file://${output}`).href);
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');

    assert.equal(await page.evaluate(() => Reveal.getTotalSlides()), 16);
    const images = await page.locator('.reveal .slides img').evaluateAll((items) => items.map((image) => ({ src: image.currentSrc, loaded: image.complete && image.naturalWidth > 0 })));
    assert.ok(images.length > 0);
    assert.ok(images.every((image) => image.loaded && image.src.startsWith('data:image/')));
    assert.deepEqual(externalRequests, []);

    await page.evaluate(() => Reveal.slide(3, 0, -1));
    const summary = page.locator('#opowiesci summary').first();
    await summary.focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#opowiesci details').first().getAttribute('open'), '');
    assert.equal((await page.evaluate(() => Reveal.getIndices())).h, 3);

    assert.equal(await page.evaluate(() => Reveal.getConfig().showNotes), false);
    await page.keyboard.press('s');
    assert.equal(await page.evaluate(() => Reveal.getConfig().showNotes), 'inline');
  } finally {
    await browser.close();
    await rm(temporary, { recursive: true, force: true });
  }
});
