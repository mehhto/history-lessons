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
    assert.equal(await page.evaluate(() => Reveal.getTotalSlides()), 14);

    const opening = await rect(page, '#otwarcie .hero-source-image');
    assert.ok(opening.width >= 1200 && opening.height >= 680, `opening media ${opening.width}x${opening.height}`);
    const openingText = await page.$eval('#otwarcie', (slide) => slide.innerText);
    assert.doesNotMatch(openingText, /(^|\n)#+\s/);
    const openingPanel = await page.$eval('#otwarcie .hero-copy', (copy) => getComputedStyle(copy).backgroundColor);
    assert.match(openingPanel, /^rgba\(8, 19, 31, 0\.9/);
    const openingCaption = await page.$eval('#otwarcie .source-label', (caption) => {
      const style = getComputedStyle(caption);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, borderLeftWidth: style.borderLeftWidth };
    });
    assert.equal(await page.$$eval('img[src="assets/mapa-kampanii-polskiej-1939.png"]', (images) => images.length), 1);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#mapa-kampanii')).h));
    const map = await rect(page, '#mapa-kampanii img');
    assert.ok(map.width >= 500 && map.height >= 420, `map ${map.width}x${map.height}`);
    assert.ok(map.width / map.height < 1.15, `map element must follow the source aspect ratio, got ${map.width / map.height}`);
    const mapBackground = await page.$eval('#mapa-kampanii img', (image) => getComputedStyle(image).backgroundColor);
    assert.equal(mapBackground, 'rgba(0, 0, 0, 0)');
    const mapCaption = await page.$eval('#mapa-kampanii figcaption', (caption) => {
      const style = getComputedStyle(caption);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, borderLeftWidth: style.borderLeftWidth };
    });
    assert.deepEqual(openingCaption, mapCaption);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#pierwsze-dni')).h));
    const timeline = await page.$eval('#pierwsze-dni .campaign-timeline', (element) => {
      const box = element.getBoundingClientRect();
      const rail = getComputedStyle(element, '::before');
      const scale = box.width / element.offsetWidth;
      const railTop = box.top + parseFloat(rail.top) * scale;
      const transparentItems = [...element.children].every((item) => getComputedStyle(item).backgroundColor === 'rgba(0, 0, 0, 0)');
      const contentClearsRail = [...element.children].every((item) => {
        const date = item.querySelector('time').getBoundingClientRect();
        const description = item.querySelector('span').getBoundingClientRect();
        return date.bottom < railTop - 10 && description.top > railTop + 10;
      });
      return { width: box.width, railWidth: parseFloat(rail.width), transparentItems, contentClearsRail };
    });
    assert.ok(timeline.width >= 900 && timeline.railWidth >= 800, `timeline rail ${timeline.railWidth}/${timeline.width}`);
    assert.equal(timeline.transparentItems, true);
    assert.equal(timeline.contentClearsRail, true);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#opor')).h));
    const resistance = await page.$eval('#opor .resistance-route', (route) => {
      const box = route.getBoundingClientRect();
      const items = [...route.children].map((item) => item.getBoundingClientRect());
      return {
        width: box.width,
        itemCount: items.length,
        ordered: items.every((item, index) => index === 0 || item.left > items[index - 1].left),
        fits: items.every((item) => item.right <= box.right + 1 && item.bottom <= box.bottom + 1),
      };
    });
    assert.ok(resistance.width >= 900, `resistance width ${resistance.width}`);
    assert.equal(resistance.itemCount, 4);
    assert.equal(resistance.ordered, true);
    assert.equal(resistance.fits, true);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#przewaga-sil')).h));
    const metrics = await page.$$eval('#przewaga-sil [data-force-metric]', (items) => items.map((item) => {
      const box = item.getBoundingClientRect();
      const values = [...item.querySelectorAll('strong')].map((value) => value.getBoundingClientRect());
      return { width: box.width, height: box.height, valuesFit: values.every((value) => value.right <= box.right && value.bottom <= box.bottom) };
    }));
    assert.equal(metrics.length, 3);
    assert.ok(metrics.every((item) => item.width >= 250 && item.height >= 170 && item.valuesFit), JSON.stringify(metrics));

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#glos-epoki')).h));
    const quote = await rect(page, '#glos-epoki blockquote');
    assert.ok(quote.width >= 480 && quote.height >= 120, `quote ${quote.width}x${quote.height}`);

    for (const id of ['bohaterstwo-zolnierzy', 'bohaterstwo-cywilow']) {
      await page.evaluate((slideId) => Reveal.slide(Reveal.getIndices(document.querySelector(`#${slideId}`)).h), id);
      const image = await rect(page, `#${id} img`);
      assert.ok(image.width >= 600 && image.height >= 360, `${id} image ${image.width}x${image.height}`);
      const factBlocks = await page.$$eval(`#${id} [data-case-role]`, (items) => items.map((item) => {
        const box = item.getBoundingClientRect();
        return { width: box.width, height: box.height, scrollWidth: item.scrollWidth, scrollHeight: item.scrollHeight };
      }));
      assert.equal(factBlocks.length, 4);
      assert.ok(factBlocks.every((item) => item.scrollWidth <= item.width + 1 && item.scrollHeight <= item.height + 1), JSON.stringify(factBlocks));
    }

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#synteza')).h));
    const synthesisPanels = await page.$$eval('#synteza .synthesis-contrast article', (panels) => panels.map((panel) => {
      const box = panel.getBoundingClientRect();
      const label = panel.querySelector('strong');
      const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = (rgb) => {
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      };
      const foreground = luminance(parse(getComputedStyle(label).color));
      const background = luminance(parse(getComputedStyle(panel).backgroundColor));
      return {
        width: box.width,
        height: box.height,
        contrast: (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05),
      };
    }));
    assert.equal(synthesisPanels.length, 2);
    assert.ok(synthesisPanels.every((panel) => panel.width >= 400 && panel.height >= 250), JSON.stringify(synthesisPanels));
    assert.ok(synthesisPanels.every((panel) => panel.contrast >= 4.5), `synthesis contrast ${JSON.stringify(synthesisPanels)}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
