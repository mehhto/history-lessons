import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { clearReviewOutput } from '../scripts/review-output.mjs';

test('clears stale generated review artifacts without removing notes', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-review-output-'));
  try {
    await Promise.all([
      writeFile(path.join(directory, '01-opening.png'), 'old slide'),
      writeFile(path.join(directory, '21-stale.png'), 'stale slide'),
      writeFile(path.join(directory, 'contact-sheet-current.png'), 'stale sheet'),
      writeFile(path.join(directory, 'index.html'), 'stale index'),
      writeFile(path.join(directory, 'notes.txt'), 'keep me'),
    ]);

    await clearReviewOutput(directory);

    assert.deepEqual(await readdir(directory), ['notes.txt']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
