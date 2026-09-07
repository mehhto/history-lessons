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

test('shared styles preserve Polish lowercase characters instead of forcing small caps', async () => {
  const sharedStyles = await Promise.all([
    'template/theme.css',
    'template/components/lesson-components.css',
    'template/presentation/styles/museum.css',
    'template/presentation/styles/editorial.css',
    'template/presentation/styles/atlas.css',
  ].map((file) => readFile(path.join(root, file), 'utf8')));
  for (const stylesheet of sharedStyles) assert.doesNotMatch(stylesheet, /font-variant:\s*small-caps|text-transform:\s*uppercase/i);
});

test('shared bootstrap disables Reveal and CSS motion when the user prefers reduced motion', async () => {
  const [boot, css] = await Promise.all([
    readFile(path.join(root, 'template/presentation/boot.mjs'), 'utf8'),
    readFile(path.join(root, 'template/presentation/base.css'), 'utf8'),
  ]);
  assert.match(boot, /prefers-reduced-motion: reduce/);
  assert.match(boot, /transition: reducedMotion \? 'none' : 'slide'/);
  assert.match(boot, /backgroundTransition: reducedMotion \? 'none' : 'fade'/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
