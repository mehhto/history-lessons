import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../template/presentation/catalog.mjs';
import { resolveAppearance, validateAppearanceAsset } from '../template/presentation/appearance.mjs';

test('resolves a catalogued style and its default palette', () => {
  assert.deepEqual(resolveAppearance({ style: 'atlas' }, catalog), {
    style: 'atlas',
    palette: 'marine',
    background: null,
  });
});

test('resolves the Grade IV cutout direction as a reusable appearance', () => {
  assert.deepEqual(resolveAppearance({ style: 'cutout' }, catalog), {
    style: 'cutout',
    palette: 'grade4',
    background: null,
  });
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
