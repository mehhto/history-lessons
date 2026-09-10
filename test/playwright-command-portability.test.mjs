import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const runner = path.join(root, 'scripts/with-local-playwright.mjs');

const playwrightScripts = [
  'install:browser',
  'export:pdf',
  'export:print',
  'check:render',
  'check:render:all',
  'review:slides',
];

test('Playwright npm commands avoid shell-specific environment assignment', async () => {
  const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  for (const name of playwrightScripts) {
    const command = packageJson.scripts[name];
    assert.doesNotMatch(command, /(?:^|\s)PLAYWRIGHT_BROWSERS_PATH=/, name);
    assert.match(command, /^node scripts\/with-local-playwright\.mjs (?:scripts\/|node_modules\/playwright\/cli\.js)/, name);
  }
});

test('local Playwright runner sets the browser path before loading the target module', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-playwright-runner-'));
  const fixture = path.join(directory, 'probe.mjs');
  await writeFile(fixture, "console.log(JSON.stringify({ browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH, args: process.argv.slice(2) }));\n");

  try {
    const { stdout } = await execFileAsync(process.execPath, [runner, fixture, 'alpha', 'beta'], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: path.join(directory, 'unexpected-cache') },
    });
    const result = JSON.parse(stdout.trim());
    assert.equal(result.browserPath, path.join(root, '.playwright-browsers'));
    assert.deepEqual(result.args, ['alpha', 'beta']);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
