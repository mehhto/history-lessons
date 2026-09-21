import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio } from '../template/presentation/contrast.mjs';

const library = JSON.parse(await readFile(new URL('../design/presentation-palettes-v1.json', import.meta.url), 'utf8'));

test('shared palette library contains only composed multi-hue schemes with readable ink', () => {
  assert.equal(library.palettes.length, 14);
  for (const palette of library.palettes) {
    assert.ok(['qualitative', 'diverging'].includes(palette.source.class), palette.id);
    assert.notEqual(palette.roles.accent, palette.roles.evidence, palette.id);
    assert.notEqual(palette.roles.evidence, palette.roles.signal, palette.id);
    assert.ok(contrastRatio(palette.roles.ink, palette.roles.canvas) >= 4.5, palette.id);
  }
});
