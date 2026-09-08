import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
test('every declared layout has a shared CSS selector', async () => {
  const css = await readFile(path.join(root, 'template/presentation/patterns.css'), 'utf8');
  for (const layout of ['statement', 'split', 'matrix', 'process', 'plain', 'equation', 'activity-brief', 'takeaways', 'evidence']) assert.match(css, new RegExp(`data-layout="${layout}"`), layout);
});
