import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { listTests, studentTestMarkdown } from '../scripts/test-catalog.mjs';
import { resolveTestAction } from '../scripts/test-actions.mjs';

const sourceWithKey = '# Kartkówka\n\n## 1. Zadanie\n\nOdpowiedź\n\n<!-- teacher-key -->\n\n## Klucz odpowiedzi — dla nauczyciela\n\nPoprawna odpowiedź';

test('lists numbered Markdown tests by grade and uses their Markdown title', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'history-tests-'));
  try {
    await mkdir(path.join(root, 'tests', '5'), { recursive: true });
    await writeFile(path.join(root, 'tests', '5', '01-pierwsi-ludzie.md'), sourceWithKey.replace('# Kartkówka', '# Kartkówka — pierwsi ludzie'));
    await writeFile(path.join(root, 'tests', '5', 'notatka.md'), '# Nie kataloguj');
    const catalog = await listTests({ repoRoot: root });
    assert.equal(catalog.tests.length, 1);
    assert.equal(catalog.tests[0].directory, 'tests/5/01-pierwsi-ludzie.md');
    assert.equal(catalog.tests[0].title, 'Kartkówka — pierwsi ludzie');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('allows only one regular numbered Markdown file directly inside a test grade directory', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'history-test-actions-'));
  try {
    await mkdir(path.join(root, 'tests', '5', '01-pierwsi-ludzie'), { recursive: true });
    await writeFile(path.join(root, 'tests', '5', '01-pierwsi-ludzie.md'), sourceWithKey);
    const action = await resolveTestAction({ repoRoot: root, test: 'tests/5/01-pierwsi-ludzie.md', action: 'testPdf' });
    assert.equal(action.artifact, 'tests/5/01-pierwsi-ludzie.pdf');
    await assert.rejects(resolveTestAction({ repoRoot: root, test: 'tests/5/01-pierwsi-ludzie/../../../README.md', action: 'testPdf' }), /Nieprawidłowa kartkówka/);
    await writeFile(path.join(root, 'README.md'), '# Sekret');
    await symlink(path.join(root, 'README.md'), path.join(root, 'tests', '5', '02-lacznik.md'));
    await assert.rejects(resolveTestAction({ repoRoot: root, test: 'tests/5/02-lacznik.md', action: 'testPdf' }), /Nie znaleziono kartkówki/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('requires one explicit teacher-key marker and never leaks the teacher part to the student view', () => {
  const student = studentTestMarkdown(sourceWithKey);
  assert.match(student, /## 1\. Zadanie/);
  assert.doesNotMatch(student, /Klucz odpowiedzi|Poprawna odpowiedź/);
  assert.throws(() => studentTestMarkdown('# Kartkówka\n\n## Klucz odpowiedzi — dla nauczyciela\n\nOdpowiedź'), /teacher-key/);
  assert.throws(() => studentTestMarkdown(`${sourceWithKey}\n<!-- teacher-key -->\nDrugi klucz`), /teacher-key/);
});
