import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const showcases = [
  new URL('../classes/6/04-ameryka-przed-kolumbem/slides.md', import.meta.url),
  new URL('../classes/4/01-poznajemy-przeszlosc/slides.md', import.meta.url),
];
const layouts = ['hero-source', 'statement-centered', 'map-focus', 'source-split', 'photo-pair', 'timeline-band', 'argument', 'task-board', 'comparison', 'impact-flow'];

test('active lessons demonstrate every documentary atlas layout', async () => {
  const slides = (await Promise.all(showcases.map((file) => readFile(file, 'utf8')))).join(' ');
  for (const layout of layouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  assert.match(slides, /data-fit="contain"/);
  assert.match(slides, /data-task-role="criterion"/);
});
