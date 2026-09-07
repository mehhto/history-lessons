import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { presentationInputPaths } from '../scripts/presentation-inputs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const lesson = path.join(root, 'classes/5/od-epoki-kamienia-do-epoki-zelaza');

test('declares every shared presentation dependency once', () => {
  const names = presentationInputPaths({ repoRoot: root, lessonDirectory: lesson }).map(([name]) => name);
  for (const name of ['slides.md', 'template/presentation/boot.mjs', 'template/components/lesson-components.js', 'scripts/slide-contract.mjs', 'scripts/export-pdf.mjs']) assert.ok(names.includes(name), name);
  assert.equal(new Set(names).size, names.length);
});
