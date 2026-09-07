import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');

test('presentation PDF waits for the shared bootstrap and preserves 16:9 pages', async () => {
  const source = await readFile(path.join(root, 'scripts/export-pdf.mjs'), 'utf8');
  assert.match(source, /presentationReady === 'true'/);
  assert.match(source, /width:\s*'1280px'/);
  assert.match(source, /height:\s*'720px'/);
  assert.match(source, /preferCSSPageSize:\s*true/);
});
