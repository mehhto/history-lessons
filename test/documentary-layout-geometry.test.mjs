import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const css = await readFile(path.join(root, 'template/presentation/patterns.css'), 'utf8');
const layouts = ['hero-source', 'statement-centered', 'map-focus', 'source-split', 'photo-pair', 'timeline-band', 'argument', 'task-board', 'comparison', 'impact-flow'];

test('documentary atlas declares all narrative layouts without auto-fit', () => {
  for (const layout of layouts) assert.match(css, new RegExp(`data-layout="${layout}"`), layout);
  assert.doesNotMatch(css, /auto-fit/);
});

test('map focus, photo pair and task board own predictable geometry contracts', () => {
  assert.match(css, /data-layout="map-focus"[\s\S]*?grid-template-columns:\s*minmax\(0,\s*2\.8fr\)\s+minmax\(15rem,\s*1fr\)/);
  assert.match(css, /data-layout="photo-pair"[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /data-layout="task-board"[\s\S]*?\.student-task/);
});
