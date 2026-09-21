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
    assert.deepEqual(await config.json(), { readOnly: true, feedbackEnabled: false });
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

test('feedback endpoint writes a bounded entry inside the selected lesson directory', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-feedback-'));
  const root = path.join(parent, 'repo');
  const lesson = path.join(root, 'classes', '4', '01-feedback');
  await mkdir(lesson, { recursive: true });
  await writeFile(path.join(lesson, 'metadata.json'), JSON.stringify({ id: '01-feedback', title: 'Feedback', grade: 4 }));
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true, feedbackEnabled: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson: 'classes/4/01-feedback',
        understood: 'Mapa pomogła rozpoznać zasięg okupacji.',
        unclear: 'Trzeba doprecyzować pojęcie getta.',
        timing: 'Brakło dwóch minut na syntezę.',
        nextChange: 'Skrócić wprowadzenie.',
      }),
    });
    assert.equal(response.status, 201);
    const entry = JSON.parse((await readFile(path.join(lesson, 'feedback.jsonl'), 'utf8')).trim());
    assert.equal(entry.lesson, 'classes/4/01-feedback');
    assert.equal(entry.understood, 'Mapa pomogła rozpoznać zasięg okupacji.');
    assert.equal(entry.unclear, 'Trzeba doprecyzować pojęcie getta.');
    assert.equal(entry.timing, 'Brakło dwóch minut na syntezę.');
    assert.equal(entry.nextChange, 'Skrócić wprowadzenie.');
    assert.match(entry.createdAt, /^\d{4}-\d{2}-\d{2}T/);
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('feedback endpoint rejects an empty or oversized reflection', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-feedback-validation-'));
  const root = path.join(parent, 'repo');
  const lesson = path.join(root, 'classes', '4', '01-feedback');
  await mkdir(lesson, { recursive: true });
  await writeFile(path.join(lesson, 'metadata.json'), JSON.stringify({ id: '01-feedback', title: 'Feedback', grade: 4 }));
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true, feedbackEnabled: true });
  try {
    for (const body of [
      { lesson: 'classes/4/01-feedback', understood: '', unclear: '', timing: '', nextChange: '' },
      { lesson: 'classes/4/01-feedback', understood: 'x'.repeat(1001), unclear: '', timing: '', nextChange: '' },
    ]) {
      const response = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
    }
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('feedback endpoint rejects a technical directory not listed as a lesson', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-feedback-scope-'));
  const root = path.join(parent, 'repo');
  const scratch = path.join(root, 'classes', '4', 'scratch');
  await mkdir(scratch, { recursive: true });
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true, feedbackEnabled: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson: 'classes/4/scratch', understood: 'Nie powinno się zapisać.', unclear: '', timing: '', nextChange: '' }),
    });
    assert.equal(response.status, 404);
    await assert.rejects(readFile(path.join(scratch, 'feedback.jsonl'), 'utf8'));
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('feedback endpoint does not follow a feedback log symlink or disclose its path', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-feedback-link-'));
  const root = path.join(parent, 'repo');
  const lesson = path.join(root, 'classes', '4', '01-feedback');
  const secret = path.join(parent, 'secret.jsonl');
  await mkdir(lesson, { recursive: true });
  await writeFile(path.join(lesson, 'metadata.json'), JSON.stringify({ id: '01-feedback', title: 'Feedback', grade: 4 }));
  await writeFile(secret, 'secret');
  await symlink(secret, path.join(lesson, 'feedback.jsonl'));
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true, feedbackEnabled: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/feedback`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson: 'classes/4/01-feedback', understood: 'Nie podążaj za symlinkiem.', unclear: '', timing: '', nextChange: '' }),
    });
    assert.equal(response.status, 500);
    assert.deepEqual(await response.json(), { error: 'Nie można bezpiecznie zapisać feedbacku.' });
    assert.equal(await readFile(secret, 'utf8'), 'secret');
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
});

test('serves the catalog book glyph from the approved presentation-glyphs directory', async () => {
  const parent = await mkdtemp(path.join(os.tmpdir(), 'history-ui-glyph-'));
  const root = path.join(parent, 'repo');
  const glyph = path.join(root, 'template', 'assets', 'presentation-glyphs', 'book-open.svg');
  await mkdir(path.dirname(glyph), { recursive: true });
  await writeFile(glyph, '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const { server, port } = await createUiServer({ repoRoot: root, port: 0, host: '127.0.0.1', readOnly: true });
  try {
    const response = await fetch(`http://127.0.0.1:${port}/template/assets/presentation-glyphs/book-open.svg`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/svg+xml');
  } finally {
    await stop(server);
    await rm(parent, { recursive: true, force: true });
  }
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
  assert.match(compose, /UI_FEEDBACK_ENABLED: "1"/);
  assert.match(compose, /history-lessons[^}]*}\/classes:\/workspace\/classes:rw/);
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
    const lessonTab = page.getByRole('tab', { name: 'Lekcje' });
    const testTab = page.getByRole('tab', { name: 'Kartkówki' });
    assert.equal(await testTab.locator('img').evaluate((image) => image.complete && image.naturalWidth > 0), true);
    assert.equal(await lessonTab.getAttribute('aria-selected'), 'true');
    assert.equal(await testTab.getAttribute('tabindex'), '-1');
    await testTab.click();
    assert.equal(await testTab.getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#catalog').getAttribute('aria-labelledby'), 'show-tests');
    await testTab.press('ArrowLeft');
    assert.equal(await lessonTab.getAttribute('aria-selected'), 'true');
    assert.equal(await lessonTab.evaluate((tab) => document.activeElement === tab), true);
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

test('read-only browser UI opens a full-slide lightbox inside the presentation iframe', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await page.locator('#catalog .lesson').filter({ hasText: 'Polityka okupacyjna III Rzeszy' }).click();
    await page.waitForFunction(() => document.querySelector('iframe.preview')?.contentDocument?.documentElement?.dataset.presentationReady === 'true');
    const preview = page.frames().find((frame) => frame.url().includes('/classes/8/03-polityka-okupacyjna-iii-rzeszy/'));
    assert.ok(preview, 'presentation iframe');
    await preview.evaluate(() => Reveal.slide(Reveal.getIndices(document.querySelector('#polska-mapa')).h));
    await preview.locator('#polska-mapa .map-link').click();
    assert.equal(await preview.locator('dialog.lesson-image-lightbox').evaluate((dialog) => dialog.open), true);
  } finally {
    await browser.close();
    await stop(server);
  }
});

test('reflection UI sends structured observations through its modal', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true, feedbackEnabled: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    let request;
    await page.route('**/api/feedback', async (route) => {
      request = route.request().postDataJSON();
      await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ createdAt: '2026-09-17T12:00:00.000Z' }) });
    });
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await page.locator('#catalog .lesson').first().click();
    const title = await page.locator('#workspace h2').textContent();
    await page.getByRole('button', { name: 'Dodaj refleksję' }).click();
    await page.locator('#reflection-understood').fill('Uczniowie rozpoznali zasięg okupacji na mapie.');
    await page.locator('#reflection-next-change').fill('Skrócić wyjaśnienie przed zadaniem.');
    await page.getByRole('button', { name: 'Zapisz refleksję' }).click();
    await page.waitForFunction(() => !document.querySelector('#feedback-modal')?.open);
    assert.deepEqual(request, {
      lesson: 'classes/4/01-poznajemy-przeszlosc',
      understood: 'Uczniowie rozpoznali zasięg okupacji na mapie.',
      unclear: '',
      timing: '',
      nextChange: 'Skrócić wyjaśnienie przed zadaniem.',
    });
    assert.match(await page.locator('#status').textContent(), /Zapisano refleksję do lekcji/);
    assert.equal(await page.locator('#feedback-lesson').textContent(), title);
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
