import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('./fixtures/encounter-atlas-critical-slides.json', import.meta.url), 'utf8'));
const slides = await readFile(new URL('../classes/6/skutki-wypraw-geograficznych-i-ameryka-przed-kolumbem/slides.md', import.meta.url), 'utf8');

test('encounter atlas uses its critical layouts and sources', () => {
  for (const layout of fixture.requiredLayouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  for (const id of fixture.requiredIds) assert.match(slides, new RegExp(`id="${id}"`), id);
  assert.match(slides, /przed 1492[\s\S]*po 1492/i);
});

test('encounter atlas task gives a time, product and success criterion', () => {
  for (const role of ['prompt', 'time', 'product', 'criterion']) assert.match(slides, new RegExp(`data-task-role="${role}"`));
});
