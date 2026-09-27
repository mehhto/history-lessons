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
    const lesson = path.join(directory, 'classes/6/01-proba-jakosci');
    for (const name of ['lesson.md', 'slides.md', 'teacher-guide.md', 'student-summary.md', 'worksheet.md']) {
      const content = await readFile(path.join(lesson, name), 'utf8');
      assert.equal(content.includes('__TITLE__'), false, `${name} still contains title placeholder`);
      assert.equal(content.includes('__GRADE__'), false, `${name} still contains grade placeholder`);
    }
    const metadata = JSON.parse(await readFile(path.join(lesson, 'metadata.json'), 'utf8'));
    assert.equal(metadata.school_year, '[DECYZJA NAUCZYCIELA]');
    assert.equal(metadata.curriculum_version, '[DECYZJA NAUCZYCIELA]');
    assert.deepEqual(metadata.goalContract, { version: '1.0' });
    assert.match(await readFile(path.join(lesson, 'lesson.md'), 'utf8'), /\*\*G1\*\*/);
    assert.match(await readFile(path.join(lesson, 'assessment.md'), 'utf8'), /Sprawdzane cele:\s*G1/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new practice lesson omits the optional student summary', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '6', '--title', 'Ćwiczenie jakości', '--type', 'practice'], { cwd: directory });
    const lesson = path.join(directory, 'classes/6/01-cwiczenie-jakosci');
    const metadata = JSON.parse(await readFile(path.join(lesson, 'metadata.json'), 'utf8'));
    assert.equal(metadata.lesson_type, 'practice');
    await assert.rejects(readFile(path.join(lesson, 'student-summary.md'), 'utf8'), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new lesson can be commissioned without a presentation', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '6', '--title', 'Lekcja stacyjna', '--type', 'practice', '--presentation', 'none'], { cwd: directory });
    const lesson = path.join(directory, 'classes/6/01-lekcja-stacyjna');
    const metadata = JSON.parse(await readFile(path.join(lesson, 'metadata.json'), 'utf8'));
    assert.equal(metadata.lesson_type, 'practice');
    assert.equal(metadata.presentation_mode, 'none');
    for (const name of ['slides.md', 'index.html', 'lesson.css']) {
      await assert.rejects(readFile(path.join(lesson, name), 'utf8'), { code: 'ENOENT' });
    }
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new lesson records a validated presentation style and curated palette', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '6', '--title', 'Motyw jakości', '--style', 'chronicle', '--palette', 'conflict-map'], { cwd: directory });
    const metadata = JSON.parse(await readFile(path.join(directory, 'classes/6/01-motyw-jakosci/metadata.json'), 'utf8'));
    assert.deepEqual(metadata.appearance, { style: 'chronicle', palette: 'conflict-map' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new lesson rejects a legacy palette that remains valid for existing metadata', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await assert.rejects(
      run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '6', '--title', 'Paleta legacy', '--style', 'museum', '--palette', 'sand'], { cwd: directory }),
      (error) => error.code === 1 && error.stderr.includes('wyłącznie palet z biblioteki'),
    );
    await assert.rejects(readFile(path.join(directory, 'classes/6/01-paleta-legacy/metadata.json'), 'utf8'), { code: 'ENOENT' });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('new lessons use the next number and accept a shorter explicit slug', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-lesson-'));
  try {
    await cp(path.join(root, 'template'), path.join(directory, 'template'), { recursive: true });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '5', '--title', 'Pierwsza bardzo długa nazwa', '--slug', 'pierwszy-temat'], { cwd: directory });
    await run(process.execPath, [path.join(root, 'scripts/new-lesson.mjs'), '--class', '5', '--title', 'Druga bardzo długa nazwa', '--slug', 'drugi-temat'], { cwd: directory });
    const first = JSON.parse(await readFile(path.join(directory, 'classes/5/01-pierwszy-temat/metadata.json'), 'utf8'));
    const second = JSON.parse(await readFile(path.join(directory, 'classes/5/02-drugi-temat/metadata.json'), 'utf8'));
    assert.equal(first.id, '01-pierwszy-temat');
    assert.equal(second.id, '02-drugi-temat');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
