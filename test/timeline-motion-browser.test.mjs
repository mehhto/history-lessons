import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import { startServer } from '../scripts/render-check.mjs';
import { localChromiumExecutable } from './support/local-chromium.mjs';

const root = await realpath(path.resolve(import.meta.dirname, '..'));
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(root, '.playwright-browsers');
const { chromium } = await import('playwright');

async function withCatalog(run, { reducedMotion = 'no-preference' } = {}) {
  const server = await startServer(root);
  let browser;
  try {
    browser = await chromium.launch({ executablePath: await localChromiumExecutable(root), headless: true });
    const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
    await page.emulateMedia({ reducedMotion });
    await page.goto(`http://127.0.0.1:${server.address().port}/classes/6/katalog-komponentow-prezentacji/`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    await run(page);
  } finally {
    await browser?.close();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function moveToTimeline(page) {
  await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#timeline-pozioma')).h));
  await page.waitForFunction(() => {
    const timeline = document.querySelector('#timeline-pozioma lesson-timeline');
    return timeline?.dataset.axisRun || timeline?.dataset.axisState === 'complete';
  });
}

test('opt-in timeline draws and replays its axis as the learner returns to the slide', async () => {
  await withCatalog(async (page) => {
    await moveToTimeline(page);
    const firstRun = await page.$eval('#timeline-pozioma lesson-timeline', (timeline) => ({
      run: Number(timeline.dataset.axisRun),
      active: timeline.classList.contains('is-axis-revealing'),
      delays: [...timeline.querySelectorAll('lesson-event')].map((event) => event.style.getPropertyValue('--timeline-event-delay')),
    }));
    assert.ok(firstRun.run >= 1);
    assert.equal(firstRun.active, true);
    assert.deepEqual(firstRun.delays, ['0ms', '100ms', '200ms', '300ms']);

    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#timeline-pionowa')).h));
    await page.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#timeline-pozioma')).h));
    await page.waitForFunction((previousRun) => Number(document.querySelector('#timeline-pozioma lesson-timeline').dataset.axisRun) > previousRun, firstRun.run);
  });
});

test('timeline motion is complete and static when the learner prefers reduced motion', async () => {
  await withCatalog(async (page) => {
    await moveToTimeline(page);
    const state = await page.$eval('#timeline-pozioma lesson-timeline', (timeline) => ({
      state: timeline.dataset.axisState,
      active: timeline.classList.contains('is-axis-revealing'),
      opacity: getComputedStyle(timeline.querySelector('lesson-event')).opacity,
    }));
    assert.equal(state.state, 'complete');
    assert.equal(state.active, false);
    assert.equal(state.opacity, '1');
  }, { reducedMotion: 'reduce' });
});
