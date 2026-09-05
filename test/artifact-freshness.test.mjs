import test from 'node:test';
import assert from 'node:assert/strict';
import { createArtifactManifest, isArtifactFresh } from '../scripts/artifact-freshness.mjs';

test('marks an artifact stale when any declared input changes', () => {
  const manifest = createArtifactManifest({
    'student-summary.md': 'Wersja 1',
    'template/print/print.css': 'css',
  });
  assert.equal(isArtifactFresh(manifest, {
    'student-summary.md': 'Wersja 1',
    'template/print/print.css': 'css',
  }), true);
  assert.equal(isArtifactFresh(manifest, {
    'student-summary.md': 'Wersja 2',
    'template/print/print.css': 'css',
  }), false);
});
