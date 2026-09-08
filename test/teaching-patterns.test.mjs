import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
test('ships reusable history-thinking patterns', async () => {
  for (const name of ['source-analysis', 'comparison', 'cause-effect', 'map-question', 'retrieval']) {
    const content = await readFile(path.join(root, 'template/patterns', `${name}.md`), 'utf8');
    assert.ok(content.trim().length > 40, name);
  }
});
