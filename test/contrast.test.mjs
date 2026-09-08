import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../template/presentation/catalog.mjs';
import { contrastRatio, paletteContrastIssues } from '../template/presentation/contrast.mjs';

test('calculates WCAG contrast ratios', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.ok(contrastRatio('#777777', '#ffffff') < 4.5);
});

test('every presentation palette keeps normal text, headings and muted text readable on canvas', () => {
  for (const [name, palette] of Object.entries(catalog.palettes)) assert.deepEqual(paletteContrastIssues(palette), [], name);
});
