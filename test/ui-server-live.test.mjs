import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import os from 'node:os';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { createUiServer } from '../scripts/ui-server.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.env.PLAYWRIGHT_BROWSERS_PATH ??= path.join(repoRoot, '.playwright-browsers');
const { chromium } = await import('playwright');
const browserExecutable = path.join(repoRoot, '.playwright-browsers/chromium-1234/chrome-linux64/chrome');

async function stop(server) {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

test('exposes a secured health endpoint and reports read-only mode', async () => {
  const { server, port, host } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    assert.equal(host, '127.0.0.1');
    const health = await fetch(`http://127.0.0.1:${port}/healthz`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: 'ok', readOnly: true });
    assert.equal(health.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(health.headers.get('referrer-policy'), 'no-referrer');
    const csp = health.headers.get('content-security-policy');
    assert.match(csp, /default-src 'self'/);
    assert.match(csp, /script-src 'self'(?:;|$)/);
    assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
    assert.match(csp, /font-src 'self' data:/);
    assert.match(csp, /frame-src 'self' https:\/\/www\.google\.com https:\/\/www\.youtube-nocookie\.com/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /base-uri 'none'/);
    assert.match(csp, /form-action 'self'/);

    const config = await fetch(`http://127.0.0.1:${port}/api/config`);
    assert.deepEqual(await config.json(), { readOnly: true });
  } finally { await stop(server); }
});

test('read-only mode rejects export jobs before resolving an action', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 403);
    assert.deepEqual(await response.json(), { error: 'Panel działa w trybie tylko do podglądu.' });
  } finally { await stop(server); }
});

test('static serving rejects a symlink that escapes its public directory', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-'));
  const root = path.join(parent, 'repo');
  await mkdir(path.join(root, 'ui'), { recursive: true });
  await writeFile(path.join(parent, 'secret.txt'), 'not public');
  await symlink(path.join(parent, 'secret.txt'), path.join(root, 'ui', 'leak.txt'));
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/admin/leak.txt`);
    assert.equal(response.status, 404);
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('document API rejects a lesson source symlink that escapes classes', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-api-'));
  const root = path.join(parent, 'repo');
  const lesson = path.join(root, 'classes', 'x');
  await mkdir(path.join(root, 'ui'), { recursive: true });
  await mkdir(lesson, { recursive: true });
  await writeFile(path.join(parent, 'secret.md'), 'TOP-SECRET-CONTENT');
  await symlink(path.join(parent, 'secret.md'), path.join(lesson, 'teacher-guide.md'));
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/document?kind=teacher&lesson=classes/x`);
    assert.equal(response.status, 404);
    assert.doesNotMatch(await response.text(), /TOP-SECRET-CONTENT/);
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('sidecar healthcheck requires the server to remain read-only', async () => {
  const compose = await readFile(path.join(repoRoot, 'deploy/live-preview/compose.yaml'), 'utf8');
  assert.match(compose, /body\.status === 'ok' && body\.readOnly === true/);
  assert.doesNotMatch(compose, /:\/opt\/data:ro/);
  assert.match(compose, /history-lessons[^}]*}:\/workspace:ro/);
});

test('read-only browser UI keeps previews and omits export controls', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    const cspErrors = [];
    page.on('console', (message) => {
      if (/content security policy|violates.*style-src|refused to load/i.test(message.text())) cspErrors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await page.locator('#catalog .lesson').first().click();
    const preview = page.locator('iframe.preview');
    await preview.waitFor();
    await page.waitForFunction(() => document.querySelector('iframe.preview')?.contentDocument?.documentElement?.dataset.presentationReady === 'true');
    assert.equal(await page.locator('.actions').count(), 0);
    assert.deepEqual(cspErrors, []);
  } finally {
    await browser.close();
    await stop(server);
  }
});

test('CSP permits supported presentation fonts and opt-in embeds without allowing inline scripts', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    const cspErrors = [];
    page.on('console', (message) => {
      if (/content security policy|violates.*frame-src|refused to load/i.test(message.text())) cspErrors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/classes/6/katalog-komponentow-prezentacji/`);
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    await page.locator('[data-map-open]').evaluate((button) => button.click());
    await page.locator('[data-video-play]').evaluate((button) => button.click());
    await page.waitForTimeout(200);
    assert.match(await page.locator('iframe[data-map-src]').getAttribute('src'), /^https:\/\/www\.google\.com\/maps/);
    assert.match(await page.locator('iframe[data-video-src]').getAttribute('src'), /^https:\/\/www\.youtube-nocookie\.com\/embed/);
    assert.deepEqual(cspErrors, []);
  } finally {
    await browser.close();
    await stop(server);
  }
});
