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
    assert.equal(await page.evaluate(() => Reveal.getTotalSlides()), 12);

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
    const cardContrast = await page.$eval('#opor .comparison-grid article strong', (label) => {
      const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = (rgb) => {
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      };
      const foreground = luminance(parse(getComputedStyle(label).color));
      const background = luminance(parse(getComputedStyle(label.closest('article')).backgroundColor));
      return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
    });
    assert.ok(cardContrast >= 4.5, `card heading contrast ${cardContrast}`);
    const cardLabelsFit = await page.$$eval('#opor .comparison-grid article', (cards) => cards.every((card) => {
      const cardBox = card.getBoundingClientRect();
      const labelBox = card.querySelector('strong').getBoundingClientRect();
      return labelBox.right <= cardBox.right && labelBox.bottom <= cardBox.bottom;
    }));
    assert.equal(cardLabelsFit, true);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#fotografie')).h));
    const photos = await page.$$eval('#fotografie [data-gallery-item] img', (images) => images.map((image) => {
      const box = image.getBoundingClientRect();
      return { width: box.width, height: box.height };
    }));
    assert.equal(photos.length, 2);
    for (const photo of photos) assert.ok(photo.width >= 480 && photo.height >= 320, `photo ${photo.width}x${photo.height}`);
    const photoCaption = await page.$eval('#fotografie figcaption', (caption) => {
      const style = getComputedStyle(caption);
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, borderLeftWidth: style.borderLeftWidth };
    });
    assert.deepEqual(photoCaption, mapCaption);
    assert.doesNotMatch(await page.$eval('#fotografie', (slide) => slide.innerText), /CC BY|domena publiczna|licencj/i);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#synteza')).h));
    const summaryContrasts = await page.$$eval('#synteza .argument-evidence strong', (labels) => {
      const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
      const luminance = (rgb) => {
        const linear = rgb.map((channel) => {
          const value = channel / 255;
          return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
        });
        return .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      };
      return labels.map((label) => {
        const foreground = luminance(parse(getComputedStyle(label).color));
        const background = luminance(parse(getComputedStyle(label.closest('article')).backgroundColor));
        return (Math.max(foreground, background) + .05) / (Math.min(foreground, background) + .05);
      });
    });
    assert.ok(summaryContrasts.every((ratio) => ratio >= 4.5), `summary contrast ${summaryContrasts}`);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});
