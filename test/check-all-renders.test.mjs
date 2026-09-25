import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { activeLessonDirectories } from '../scripts/check-all-renders.mjs';

test('render-all excludes lessons whose presentation mode is none', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lesson-renders-'));
  try {
    const slides = path.join(root, 'classes/4/01-slides');
    const noSlides = path.join(root, 'classes/4/02-no-slides');
    await mkdir(slides, { recursive: true });
    await mkdir(noSlides, { recursive: true });
    await writeFile(path.join(slides, 'metadata.json'), '{"presentation_mode":"slides"}');
    await writeFile(path.join(noSlides, 'metadata.json'), '{"presentation_mode":"none"}');

    assert.deepEqual(await activeLessonDirectories(root), ['classes/4/01-slides']);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
