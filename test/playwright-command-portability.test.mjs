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

test('local Playwright runner preserves an explicit browser cache and otherwise uses its local cache', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'history-playwright-runner-'));
  const fixture = path.join(directory, 'probe.mjs');
  const configured = path.join(directory, 'configured-cache');
  await writeFile(fixture, "console.log(JSON.stringify({ browserPath: process.env.PLAYWRIGHT_BROWSERS_PATH, args: process.argv.slice(2) }));\n");

  try {
    const { stdout } = await execFileAsync(process.execPath, [runner, fixture, 'alpha', 'beta'], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: configured },
    });
    const result = JSON.parse(stdout.trim());
    assert.equal(result.browserPath, configured);
    assert.deepEqual(result.args, ['alpha', 'beta']);

    const defaults = await execFileAsync(process.execPath, [runner, fixture], {
      cwd: root,
      env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== 'PLAYWRIGHT_BROWSERS_PATH')),
    });
    assert.equal(JSON.parse(defaults.stdout.trim()).browserPath, path.join(root, '.playwright-browsers'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
