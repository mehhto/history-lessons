import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { catalog } from '../template/presentation/catalog.mjs';

const root = path.resolve(import.meta.dirname, '..');

test('template starts presentations through the shared fixed-canvas bootstrap', async () => {
  const html = await readFile(path.join(root, 'template/lesson/index.html'), 'utf8');
  assert.match(html, /presentation\/base\.css/);
  assert.match(html, /presentation\/canvas\.css/);
  assert.match(html, /presentation\/boot\.mjs/);
  assert.doesNotMatch(html, /Reveal\.initialize\s*\(/);
});

test('registered presentation styles are local, scoped, and free of gradients or forced capitals', async () => {
  const entries = Object.entries(catalog.styles);
  const styleSheets = await Promise.all(entries.map(async ([name, style]) => ({
    name,
    css: await readFile(path.join(root, 'template/presentation/styles', style.stylesheet), 'utf8'),
  })));
  const [theme, components, patterns] = await Promise.all([
    readFile(path.join(root, 'template/theme.css'), 'utf8'),
    readFile(path.join(root, 'template/components/lesson-components.css'), 'utf8'),
    readFile(path.join(root, 'template/presentation/patterns.css'), 'utf8'),
  ]);
  for (const { name, css } of styleSheets) {
    assert.ok(css.includes(`html[data-style="${name}"]`) || css.includes(`html[data-style='${name}']`), name);
    assert.equal(css.includes('gradient('), false, name);
  }
  for (const css of [...styleSheets.map(({ css }) => css), theme, components, patterns]) {
    assert.equal(css.includes('font-variant: small-caps'), false);
    assert.equal(css.includes('text-transform: uppercase'), false);
    assert.equal(css.includes('gradient('), false);
  }
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
