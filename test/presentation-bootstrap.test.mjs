import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

test('template starts presentations through the shared fixed-canvas bootstrap', async () => {
  const html = await readFile(path.join(root, 'template/lesson/index.html'), 'utf8');
  assert.match(html, /presentation\/base\.css/);
  assert.match(html, /presentation\/canvas\.css/);
  assert.match(html, /presentation\/boot\.mjs/);
  assert.doesNotMatch(html, /Reveal\.initialize\s*\(/);
});
