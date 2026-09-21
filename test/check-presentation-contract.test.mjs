import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { presentationInputPaths } from '../scripts/presentation-inputs.mjs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const command = path.join(repoRoot, 'scripts/check-presentation-contract.mjs');

const metadata = {
  id: '01-test',
  title: 'Test',
  grade: 6,
  school_year: '2026/2027',
  curriculum_version: 'stara-przejsciowa',
  duration_minutes: 45,
  kind: 'lesson',
  lesson_type: 'new-knowledge',
  status: 'SZKIC',
  curriculum_requirement: 'Wymaganie',
  main_question: 'Pytanie?',
  source_reviewed: false,
  teacher_reviewed: false,
  offline_checked: false,
  pdf_exported: false,
  presentationContract: { version: '1.0' },
};

async function fixture({ fixtureMetadata = metadata, slidesMarkdown = '<!-- .slide: id="start" data-purpose="opening" data-layout="statement" -->\n# Start\n' } = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'presentation-contract-'));
  const lesson = path.join(root, 'classes/6/01-test');
  await mkdir(lesson, { recursive: true });
  for (const [, source] of presentationInputPaths({ repoRoot: root, lessonDirectory: lesson, artifact: false })) {
    await mkdir(path.dirname(source), { recursive: true });
    await writeFile(source, 'source');
  }
  await writeFile(path.join(lesson, 'metadata.json'), `${JSON.stringify(fixtureMetadata)}\n`);
  await writeFile(path.join(lesson, 'slides.md'), slidesMarkdown);
  return { root, lesson: 'classes/6/01-test' };
}

test('checks one opted-in lesson without running browser or export work', async () => {
  const temporary = await fixture();
  try {
    const { stdout, stderr } = await run(process.execPath, [command, '--lesson', temporary.lesson, '--json'], { cwd: temporary.root });
    const report = JSON.parse(stdout);

    assert.equal(stderr, '');
    assert.equal(report.applicable, true);
    assert.equal(report.static.status, 'pass');
    assert.equal(report.browser.status, 'pending');
    assert.equal(report.human.status, 'pending');
    assert.equal(report.readyForTeacher, false);
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
  }
});

test('rejects an element-scoped exception whose explicit target is absent from slides', async () => {
  const fixtureMetadata = {
    ...metadata,
    contractExceptions: [{
      rule: 'MEDIA-LIGHTBOX-001',
      contractVersion: '1.0',
      scope: { kind: 'element', slide: 'start', id: 'nie-ma' },
      reason: 'Sterowanie zapewnia inny komponent.',
      compensation: 'Pozostawiam opis tekstowy.',
    }],
  };
  const temporary = await fixture({ fixtureMetadata });
  try {
    await assert.rejects(
      run(process.execPath, [command, '--lesson', temporary.lesson, '--json'], { cwd: temporary.root }),
      (error) => {
        const report = JSON.parse(error.stdout);
        assert.equal(report.static.status, 'fail');
        assert.match(report.static.issues.join('\n'), /element.*nie istnieje/i);
        return true;
      },
    );
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
  }
});

test('rejects an element-scoped exception when the target belongs to another slide', async () => {
  const fixtureMetadata = {
    ...metadata,
    contractExceptions: [{
      rule: 'MEDIA-LIGHTBOX-001',
      contractVersion: '1.0',
      scope: { kind: 'element', slide: 'start', id: 'wspolny' },
      reason: 'Sterowanie zapewnia inny komponent.',
      compensation: 'Pozostawiam opis tekstowy.',
    }],
  };
  const slidesMarkdown = [
    '<!-- .slide: id="start" data-purpose="opening" data-layout="statement" -->\n# Start',
    '<!-- .slide: id="drugi" data-purpose="explanation" data-layout="statement" -->\n<div id="wspolny"></div>',
  ].join('\n\n---\n\n');
  const temporary = await fixture({ fixtureMetadata, slidesMarkdown });
  try {
    await assert.rejects(
      run(process.execPath, [command, '--lesson', temporary.lesson, '--json'], { cwd: temporary.root }),
      (error) => {
        const report = JSON.parse(error.stdout);
        assert.equal(report.static.status, 'fail');
        assert.match(report.static.issues.join('\n'), /element.*nie istnieje.*start/i);
        return true;
      },
    );
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
  }
});

test('exposes one npm command for the targeted contract check', async () => {
  const packageJson = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  assert.equal(packageJson.scripts['check:contract'], 'node scripts/check-presentation-contract.mjs');
});

test('rejects a lesson symlink whose resolved target escapes the working directory', async () => {
  const temporary = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'presentation-contract-outside-'));
  try {
    await writeFile(path.join(outside, 'metadata.json'), `${JSON.stringify(metadata)}\n`);
    await writeFile(path.join(outside, 'slides.md'), '<!-- .slide: id="start" data-purpose="opening" data-layout="statement" -->\n# Start\n');
    await symlink(outside, path.join(temporary.root, 'classes/6/escape'));

    await assert.rejects(
      run(process.execPath, [command, '--lesson', 'classes/6/escape', '--json'], { cwd: temporary.root }),
      (error) => {
        assert.match(error.stdout, /wskazuje poza dozwolonym katalogiem/i);
        return true;
      },
    );
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test('rejects a metadata file symlink whose resolved target escapes the working directory', async () => {
  const temporary = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'presentation-contract-outside-'));
  try {
    const externalMetadata = path.join(outside, 'metadata.json');
    await writeFile(externalMetadata, `${JSON.stringify(metadata)}\n`);
    await rm(path.join(temporary.root, temporary.lesson, 'metadata.json'));
    await symlink(externalMetadata, path.join(temporary.root, temporary.lesson, 'metadata.json'));

    await assert.rejects(
      run(process.execPath, [command, '--lesson', temporary.lesson, '--json'], { cwd: temporary.root }),
      (error) => {
        assert.match(error.stdout, /wskazuje poza dozwolonym katalogiem/i);
        return true;
      },
    );
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test('rejects a slides file symlink whose resolved target escapes the working directory', async () => {
  const temporary = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), 'presentation-contract-outside-'));
  try {
    const externalSlides = path.join(outside, 'slides.md');
    await writeFile(externalSlides, '<!-- .slide: id="start" data-purpose="opening" data-layout="statement" -->\n# Start\n');
    await rm(path.join(temporary.root, temporary.lesson, 'slides.md'));
    await symlink(externalSlides, path.join(temporary.root, temporary.lesson, 'slides.md'));

    await assert.rejects(
      run(process.execPath, [command, '--lesson', temporary.lesson, '--json'], { cwd: temporary.root }),
      (error) => {
        assert.match(error.stdout, /wskazuje poza dozwolonym katalogiem/i);
        return true;
      },
    );
  } finally {
    await rm(temporary.root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});
