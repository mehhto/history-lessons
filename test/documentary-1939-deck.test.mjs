import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('./fixtures/documentary-1939-critical-slides.json', import.meta.url), 'utf8'));
const slides = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/slides.md', import.meta.url), 'utf8');

test('September dossier uses its required documentary layouts and critical slides', () => {
  for (const layout of fixture.requiredLayouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  for (const id of fixture.requiredIds) assert.match(slides, new RegExp(`id="${id}"`), id);
});

test('September dossier uses semantic gallery and complete task board markup', () => {
  assert.match(slides, /<lesson-gallery[^>]*>[\s\S]*data-gallery-item/);
  for (const role of ['prompt', 'time', 'product', 'criterion']) assert.match(slides, new RegExp(`data-task-role="${role}"`));
  assert.doesNotMatch(slides, /<div class="lesson-gallery"/);
});
