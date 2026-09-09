import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { startServer } from '../scripts/render-check.mjs';

const root = await realpath(path.resolve(import.meta.dirname, '..'));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(root, '.playwright-browsers');
const { chromium } = await import('playwright');

async function withDeck(run) {
  const server = await startServer(root);
  const browser = await chromium.launch({ executablePath: path.join(root, '.playwright-browsers/chromium-1234/chrome-linux64/chrome') });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.goto(`http://127.0.0.1:${server.address().port}/classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    await run(page);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('clicking a presentation image opens and closes an accessible viewport lightbox', async () => {
  await withDeck(async (page) => {
    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#mapa-kampanii')).h));
    await page.click('#mapa-kampanii img');

    assert.equal(await page.$eval('dialog.lesson-image-lightbox', (dialog) => dialog.open), true);
    const overlay = await page.$eval('dialog.lesson-image-lightbox', (dialog) => {
      const box = dialog.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    assert.ok(overlay.width >= 1590 && overlay.height >= 890, `lightbox ${overlay.width}x${overlay.height}`);
    const enlarged = await page.$eval('dialog.lesson-image-lightbox img', (image) => {
      const box = image.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    assert.ok(enlarged.height >= 700, `enlarged image ${enlarged.width}x${enlarged.height}`);
    assert.match(await page.$eval('dialog.lesson-image-lightbox img', (image) => image.currentSrc), /mapa-kampanii-polskiej-1939\.png$/);
    assert.equal(await page.$eval('dialog.lesson-image-lightbox img', (image) => image.alt), 'Mapa kampanii polskiej 1939 roku z kierunkami działań wojennych');

    await page.click('dialog.lesson-image-lightbox img');
    assert.equal(await page.$eval('dialog.lesson-image-lightbox', (dialog) => dialog.open), false);
  });
});

test('lightbox supports keyboard opening and Escape without changing the slide', async () => {
  await withDeck(async (page) => {
    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#mapa-kampanii')).h));
    const before = await page.evaluate(() => Reveal.getIndices().h);
    await page.focus('#mapa-kampanii img');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('dialog.lesson-image-lightbox', (dialog) => dialog.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.$eval('dialog.lesson-image-lightbox', (dialog) => dialog.open), false);
    assert.equal(await page.evaluate(() => Reveal.getIndices().h), before);
  });
});
