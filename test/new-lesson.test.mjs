import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');

test('new lesson replaces title and grade placeholders in every learner and teacher document', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '6', '--title', 'Próba jakości'], { cwd: directory });
    const lesson = path.join(directory, 'classes/6/proba-jakosci');
    for (const name of ['lesson.md', 'slides.md', 'teacher-guide.md', 'student-summary.md', 'worksheet.md']) {
      const content = await readFile(path.join(lesson, name), 'utf8');
      assert.equal(content.includes('__TITLE__'), false, `${name} still contains title placeholder`);
      assert.equal(content.includes('__GRADE__'), false, `${name} still contains grade placeholder`);
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
