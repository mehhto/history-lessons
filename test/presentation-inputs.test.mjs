import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { presentationInputPaths, presentationInputs } from '../scripts/presentation-inputs.mjs';

const root = path.resolve(import.meta.dirname, '..');
const lesson = path.join(root, 'classes/5/01-od-epoki-kamienia-do-epoki-zelaza');

test('declares every shared presentation dependency once', () => {
  const names = presentationInputPaths({ repoRoot: root, lessonDirectory: lesson }).map(([name]) => name);
  for (const name of ['slides.md', 'template/presentation/boot.mjs', 'template/components/lesson-components.js', 'scripts/slide-contract.mjs', 'scripts/export-pdf.mjs']) assert.ok(names.includes(name), name);
  assert.equal(new Set(names).size, names.length);
});

test('includes every local asset and vendored Reveal runtime in the render revision', async () => {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'presentation-inputs-'));
  const lessonDirectory = path.join(temporaryRoot, 'classes/5/01-test');
  try {
    for (const [, source] of presentationInputPaths({ repoRoot: temporaryRoot, lessonDirectory })) {
      await mkdir(path.dirname(source), { recursive: true });
      await writeFile(source, 'source');
    }
    await mkdir(path.join(lessonDirectory, 'assets/maps'), { recursive: true });
    await writeFile(path.join(lessonDirectory, 'assets/opening.svg'), '<svg>one</svg>');
    await writeFile(path.join(lessonDirectory, 'assets/maps/region.txt'), 'first');

    const first = await presentationInputs({ repoRoot: temporaryRoot, lessonDirectory, artifact: false });
    await writeFile(path.join(lessonDirectory, 'assets/maps/region.txt'), 'second');
    const second = await presentationInputs({ repoRoot: temporaryRoot, lessonDirectory, artifact: false });

    assert.ok(first['assets/opening.svg']);
    assert.ok(first['assets/maps/region.txt']);
    assert.notEqual(first['assets/maps/region.txt'], second['assets/maps/region.txt']);
    assert.ok(first['template/reveal/reveal.js']);
    assert.ok(first['template/reveal/plugin/markdown.js']);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
