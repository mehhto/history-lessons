import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const showroom = new URL('../classes/6/katalog-komponentow-prezentacji/slides.md', import.meta.url);
const layouts = ['hero-source', 'statement-centered', 'map-focus', 'source-split', 'photo-pair', 'timeline-band', 'argument', 'task-board', 'comparison', 'impact-flow'];

test('showroom demonstrates every documentary atlas layout', async () => {
  const slides = await readFile(showroom, 'utf8');
  for (const layout of layouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  assert.match(slides, /data-fit="contain"/);
  assert.match(slides, /data-task-role="criterion"/);
});
