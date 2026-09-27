import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { inflateRawSync } from 'node:zlib';
import { buildAssessmentDocx } from '../scripts/export-test-docx.mjs';
import { createUiServer } from '../scripts/ui-server.mjs';

const source = '# Kartkówka — test\n\n## Zadanie 1\n\nWybierz poprawną odpowiedź.\n\n- A. pierwsza\n- B. druga\n\n| Pojęcie | Opis |\n| --- | --- |\n| Źródło | Dokument |\n\n<!-- teacher-key -->\n\n## Klucz odpowiedzi — tylko dla nauczyciela\n\nTAJNE ROZWIĄZANIE';

function zipEntries(buffer) {
  const entries = new Map();
  for (let offset = 0; offset < buffer.length - 4;) {
    if (buffer.readUInt32LE(offset) !== 0x04034b50) { offset += 1; continue; }
    const size = buffer.readUInt32LE(offset + 18), nameLength = buffer.readUInt16LE(offset + 26), extra = buffer.readUInt16LE(offset + 28), start = offset + 30 + nameLength + extra;
    const name = buffer.toString('utf8', offset + 30, offset + 30 + nameLength), compressed = buffer.subarray(start, start + size);
    entries.set(name, inflateRawSync(compressed)); offset = start + size;
  }
  return entries;
}

test('creates editable assessment DOCX with student text, lists, tables and no teacher key', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'assessment-docx-'));
  try {
    const docx = await buildAssessmentDocx({ markdown: source, sourceDirectory: directory });
    assert.equal(docx.subarray(0, 2).toString(), 'PK');
    const document = zipEntries(docx).get('word/document.xml').toString();
    assert.match(document, /Wybierz poprawną odpowiedź/);
    assert.match(document, /ListBullet/);
    assert.match(document, /w:tbl/);
    assert.doesNotMatch(document, /Klucz odpowiedzi|TAJNE ROZWIĄZANIE/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('serves generated DOCX directly and blocks traversal in read-only mode', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'assessment-docx-ui-'));
  await mkdir(path.join(directory, 'tests/5'), { recursive: true });
  await writeFile(path.join(directory, 'tests/5/01-test.md'), source);
  const { server, port } = await createUiServer({ repoRoot: directory, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/test-docx?test=${encodeURIComponent('tests/5/01-test.md')}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /wordprocessingml\.document/);
    assert.match(response.headers.get('content-disposition'), /attachment/);
    assert.equal(Buffer.from(await response.arrayBuffer()).subarray(0, 2).toString(), 'PK');
    const invalid = await fetch(`http://127.0.0.1:${port}/api/test-docx?test=..%2FREADME.md`);
    assert.equal(invalid.status, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await rm(directory, { recursive: true, force: true });
  }
});