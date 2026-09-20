import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { resolveLessonAction } from '../scripts/lesson-actions.mjs';

test('returns the teacher PDF that the print exporter actually creates', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lesson-actions-'));
  try {
    const lesson = 'classes/6/01-test';
    await mkdir(path.join(root, lesson), { recursive: true });
    await writeFile(path.join(root, lesson, 'metadata.json'), '{}\n');

    const action = await resolveLessonAction({ repoRoot: root, lesson, action: 'teacher' });

    assert.equal(action.artifact, 'classes/6/01-test/teacher-guide.pdf');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects a normalized path that is not a lesson package under classes', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lesson-actions-'));
  try {
    await mkdir(path.join(root, 'template/lesson'), { recursive: true });
    await writeFile(path.join(root, 'template/lesson/metadata.json'), '{}\n');

    await assert.rejects(
      resolveLessonAction({ repoRoot: root, lesson: 'classes/../template/lesson', action: 'teacher' }),
      /Nieprawidłowa lekcja/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects a lesson symlink that escapes the classes directory', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'lesson-actions-'));
  const outside = await mkdtemp(path.join(os.tmpdir(), 'lesson-actions-outside-'));
  try {
    await mkdir(path.join(root, 'classes/6'), { recursive: true });
    await writeFile(path.join(outside, 'metadata.json'), '{}\n');
    await symlink(outside, path.join(root, 'classes/6/01-test'));

    await assert.rejects(
      resolveLessonAction({ repoRoot: root, lesson: 'classes/6/01-test', action: 'teacher' }),
      /Nieprawidłowa lekcja/,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
