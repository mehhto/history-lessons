import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { listTests, studentTestMarkdown } from '../scripts/test-catalog.mjs';
import { resolveTestAction } from '../scripts/test-actions.mjs';
import { embedLocalImagesInHtml, markdownToHtml, printableHtml } from '../scripts/print-pack.mjs';
import { chromium } from 'playwright';
import { localChromiumExecutable } from './support/local-chromium.mjs';

const sourceWithKey = '# Kartkówka\n\n## 1. Zadanie\n\nOdpowiedź\n\n<!-- teacher-key -->\n\n## Klucz odpowiedzi — dla nauczyciela\n\nPoprawna odpowiedź';

test('lists numbered Markdown tests by grade and uses their Markdown title', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'history-tests-'));
  try {
    await mkdir(path.join(root, 'tests', '5'), { recursive: true });
    await writeFile(path.join(root, 'tests', '5', '01-pierwsi-ludzie.md'), sourceWithKey.replace('# Kartkówka', '# Kartkówka — pierwsi ludzie'));
    await writeFile(path.join(root, 'tests', '5', '01-pierwsi-ludzie.docx'), 'word');
    const catalog = await listTests({ repoRoot: root });
    assert.equal(catalog.tests.length, 1);
    assert.equal(catalog.tests[0].directory, 'tests/5/01-pierwsi-ludzie.md');
    assert.equal(catalog.tests[0].title, 'Kartkówka — pierwsi ludzie');
    assert.equal(catalog.tests[0].docxAvailable, true);
    await rm(path.join(root, 'tests', '5', '01-pierwsi-ludzie.docx'));
  assert.equal((await listTests({ repoRoot: root })).tests[0].docxAvailable, false);
    await writeFile(path.join(root, 'tests', '5', 'notatka.md'), '# Nie kataloguj');
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
  assert.equal(studentTestMarkdown(sourceWithKey.replaceAll(String.fromCharCode(10), String.fromCharCode(13, 10))), student);
  assert.throws(() => studentTestMarkdown('# Kartkówka\n\n## Klucz odpowiedzi — dla nauczyciela\n\nOdpowiedź'), /teacher-key/);
  assert.throws(() => studentTestMarkdown(`${sourceWithKey}\n<!-- teacher-key -->\nDrugi klucz`), /teacher-key/);
});

test('exam maps render offline and lettered options stay on separate lines', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const catalog = await listTests({ repoRoot: root });
  for (const item of catalog.tests.filter((entry) => entry.title.startsWith('Sprawdzian'))) {
    const markdown = studentTestMarkdown(await readFile(path.join(root, item.directory), 'utf8'));
    const html = await embedLocalImagesInHtml(markdownToHtml(markdown), path.dirname(path.join(root, item.directory)));
    assert.match(html, /<img src="data:image\/(?:jpeg|png);base64,[^"]+"/u, item.directory);
    assert.doesNotMatch(html, /Klucz odpowiedzi|Oczekiwana odpowiedź/u);
    assert.doesNotMatch(markdown, /^.*(?:[A-E]\. [^\n]+){2,}$/gmu, item.directory);
  }
});

test('student exam PDFs fit exactly two A4 pages', async () => {
  const root = path.resolve(import.meta.dirname, '..');
  const css = (await readFile(path.join(root, 'template/print/print.css'), 'utf8')) + '\n' + (await readFile(path.join(root, 'template/print/test.css'), 'utf8'));
  const catalog = await listTests({ repoRoot: root });
  const browser = await chromium.launch({ executablePath: await localChromiumExecutable(root) });
  try {
    for (const item of catalog.tests.filter((entry) => entry.title.startsWith('Sprawdzian'))) {
      const source = path.join(root, item.directory);
      const markdown = studentTestMarkdown(await readFile(source, 'utf8'));
      const page = await browser.newPage();
      try {
        await page.setContent(await embedLocalImagesInHtml(printableHtml({ title: item.title, audience: 'student', sections: [{ markdown }] }), path.dirname(source)), { waitUntil: 'load' });
        await page.locator('body').evaluate((body, exam) => { body.dataset.exam = exam; }, path.basename(source, '.md'));
        await page.addStyleTag({ content: css });
        await page.emulateMedia({ media: 'print' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
        assert.equal((pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length, 2, item.directory);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
