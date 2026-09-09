import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { startServer } from '../scripts/render-check.mjs';

const root = await realpath(path.resolve(import.meta.dirname, '..'));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(root, '.playwright-browsers');
const { chromium } = await import('playwright');

async function rect(page, selector) {
  return page.$eval(selector, (element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  });
}

test('September dossier gives archival media projector-scale visual dominance', async () => {
  const server = await startServer(root);
  const browser = await chromium.launch({ executablePath: path.join(root, '.playwright-browsers/chromium-1234/chrome-linux64/chrome') });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');

    const opening = await rect(page, '#otwarcie .hero-source-image');
    assert.ok(opening.width >= 1200 && opening.height >= 680, `opening media ${opening.width}x${opening.height}`);
    const openingText = await page.$eval('#otwarcie', (slide) => slide.innerText);
    assert.doesNotMatch(openingText, /(^|\n)#+\s/);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#mapa-kampanii')).h));
    const map = await rect(page, '#mapa-kampanii img');
    assert.ok(map.width >= 690 && map.height >= 420, `map ${map.width}x${map.height}`);
    const mapBackground = await page.$eval('#mapa-kampanii img', (image) => getComputedStyle(image).backgroundColor);
    assert.equal(mapBackground, 'rgba(0, 0, 0, 0)');

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#fotografie')).h));
    const photos = await page.$$eval('#fotografie [data-gallery-item] img', (images) => images.map((image) => {
      const box = image.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    assert.equal(photos.length, 2);
    for (const photo of photos) assert.ok(photo.width >= 480 && photo.height >= 320, `photo ${photo.width}x${photo.height}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
