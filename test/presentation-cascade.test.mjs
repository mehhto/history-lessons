import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const canvas = new URL('../template/presentation/canvas.css', import.meta.url);
const base = new URL('../template/presentation/base.css', import.meta.url);

test('canvas reset owns only fixed geometry, not semantic paint', async () => {
  const css = await readFile(canvas, 'utf8');
  assert.doesNotMatch(css, /border:\s*0\s*!important/);
  assert.doesNotMatch(css, /overflow:\s*visible\s*!important/);
  assert.match(css, /width:\s*var\(--slide-width\)\s*!important/);
  assert.match(css, /height:\s*var\(--slide-height\)\s*!important/);
});

test('purpose styles declare distinct opening, evidence, practice and exit rhythms', async () => {
  const css = await readFile(base, 'utf8');
  for (const purpose of ['opening', 'evidence', 'practice', 'exit-ticket']) {
    assert.match(css, new RegExp(`data-purpose="${purpose}"`), purpose);
  }
});
