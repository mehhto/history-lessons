import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog } from '../template/presentation/catalog.mjs';
import { componentContrastIssues } from '../template/presentation/contrast.mjs';

const roles = ['canvas', 'surface', 'text', 'muted', 'heading', 'accent', 'border', 'evidence', 'danger', 'regionA', 'regionB', 'connection', 'mutedSurface', 'textOnAccent'];

test('documentary palettes expose every semantic visual role', () => {
  for (const name of ['documentary-1939', 'encounter-atlas']) {
    const palette = catalog.palettes[name];
    assert.ok(palette, name);
    for (const role of roles) assert.match(palette[role], /^#[0-9a-f]{6}$/i, `${name}: ${role}`);
  }
});

test('documentary palette component foreground/background combinations meet AA', () => {
  for (const name of ['documentary-1939', 'encounter-atlas']) assert.deepEqual(componentContrastIssues(catalog.palettes[name]), [], name);
});
