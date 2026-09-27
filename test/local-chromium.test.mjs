import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { localChromiumExecutable } from './support/local-chromium.mjs';

test('uses an explicitly configured Playwright browser cache', async () => {
  const browserRoot = await mkdtemp(path.join(os.tmpdir(), 'history-browser-cache-'));
  const previous = process.env.PLAYWRIGHT_BROWSERS_PATH;
  try {
    const executable = path.join(browserRoot, 'chromium-1234', 'chrome-linux64', 'chrome');
    await mkdir(path.dirname(executable), { recursive: true });
    await writeFile(executable, '');
    process.env.PLAYWRIGHT_BROWSERS_PATH = browserRoot;
    assert.equal(await localChromiumExecutable('/workspace'), executable);
  } finally {
    if (previous === undefined) delete process.env.PLAYWRIGHT_BROWSERS_PATH;
    else process.env.PLAYWRIGHT_BROWSERS_PATH = previous;
    await rm(browserRoot, { recursive: true, force: true });
  }
});
