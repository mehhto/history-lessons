import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { catalog } from '../template/presentation/catalog.mjs';
import { resolveAppearance, validateAppearanceAsset } from '../template/presentation/appearance.mjs';

test('resolves a catalogued style and its default palette', () => {
  assert.deepEqual(resolveAppearance({ style: 'atlas' }, catalog), {
    style: 'atlas',
    palette: 'land-sea',
    background: null,
  });
});

test('resolves every registered visual grammar without conflating style and palette', () => {
  for (const style of ['museum', 'editorial', 'atlas', 'chronicle', 'source-lab', 'reportage']) {
    const appearance = resolveAppearance({ style }, catalog);
    assert.equal(appearance.style, style);
    assert.equal(appearance.palette, catalog.styles[style].defaultPalette);
    assert.ok(catalog.styles[style].palettes.includes(appearance.palette));
  }
});

test('each style changes composition or evidence treatment beyond its palette', async () => {
  const signatures = new Map([
    ['museum', /object-fit: contain/],
    ['editorial', /\[data-layout="matrix"\][\s\S]*\.split-grid > \* \{[^}]*border-top/],
    ['atlas', /grid-template-columns: minmax\(0, 3\.4fr\)/],
    ['chronicle', /lesson-timeline:not\(\[orientation="vertical"\]\)::before/],
    ['source-lab', /lesson-stat small \{[^}]*border-bottom:/],
    ['reportage', /aspect-ratio: 4 \/ 5/],
  ]);
  for (const [style, signature] of signatures) {
    const stylesheet = catalog.styles[style].stylesheet;
    const css = await readFile(new URL(`../template/presentation/styles/${stylesheet}`, import.meta.url), 'utf8');
    assert.match(css, signature, style);
  }
});

test('new lessons default to a curated neutral palette while old museum metadata remains valid', () => {
  assert.deepEqual(resolveAppearance(undefined, catalog), {
    style: 'museum',
    palette: 'evidence-grey',
    background: null,
  });
  assert.equal(resolveAppearance({ style: 'museum', palette: 'sand' }, catalog).palette, 'sand');
});

test('rejects an unknown style and palette combination', () => {
  assert.throws(() => resolveAppearance({ style: 'missing' }, catalog), /Nieznany styl/);
  assert.throws(() => resolveAppearance({ style: 'atlas', palette: 'sand' }, catalog), /nie obsługuje palety/);
});

test('accepts a local lesson background but rejects URLs and path escapes', () => {
  assert.deepEqual(validateAppearanceAsset('assets/mapa-tlo.webp'), { asset: 'assets/mapa-tlo.webp' });
  for (const asset of ['https://example.test/mapa.webp', 'data:image/png;base64,abc', '/tmp/mapa.webp', '../mapa.webp']) {
    assert.throws(() => validateAppearanceAsset(asset), /Tło/);
  }
});

test('only accepts documented background scopes', () => {
  assert.deepEqual(resolveAppearance({
    style: 'museum',
    palette: 'sand',
    background: { asset: 'assets/tlo.jpg', scope: 'opening-and-sections' },
  }, catalog), {
    style: 'museum',
    palette: 'sand',
    background: { asset: 'assets/tlo.jpg', scope: 'opening-and-sections' },
  });
  assert.throws(() => resolveAppearance({
    style: 'museum',
    background: { asset: 'assets/tlo.jpg', scope: 'everywhere' },
  }, catalog), /Zakres tła/);
});
