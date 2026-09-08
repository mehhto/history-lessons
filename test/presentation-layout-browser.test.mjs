import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const root = path.resolve(import.meta.dirname, '..');
const css = await readFile(path.join(root, 'template/presentation/patterns.css'), 'utf8');

for (const [layout, wrapper] of [['split', 'split-grid'], ['matrix', 'matrix-grid']]) test(`${layout} places panels in its wrapper without moving heading or instruction`, async () => {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
    await page.setContent(`<div class="reveal"><section data-slide-canvas data-layout="${layout}"><div class="slide-content"><h2>Heading</h2><div class="${wrapper}"><article>One</article><article>Two</article></div><p>Instruction</p></div></section></div>`);
    await page.addStyleTag({ content: css });
    const result = await page.evaluate((selector) => {
      const rect = (element) => element.getBoundingClientRect();
      const content = document.querySelector('.slide-content'); const heading = document.querySelector('h2'); const wrapper = document.querySelector(selector); const [one, two] = wrapper.children; const instruction = document.querySelector('p');
      return { content: getComputedStyle(content).gridTemplateColumns, wrapper: getComputedStyle(wrapper).display, one: rect(one).toJSON(), two: rect(two).toJSON(), heading: rect(heading).toJSON(), instruction: rect(instruction).toJSON() };
    }, `.${wrapper}`);
    assert.equal(result.content, 'none');
    assert.equal(result.wrapper, 'grid');
    assert.ok(Math.abs(result.one.y - result.two.y) < 1);
    assert.notEqual(result.one.x, result.two.x);
    assert.ok(result.heading.y < result.one.y && result.instruction.y > result.one.y);
  } finally { await browser.close(); }
});
