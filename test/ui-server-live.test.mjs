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

test('sidecar healthcheck enables closed-list exports while only artifact directories are writable', async () => {
  const compose = await readFile(path.join(repoRoot, 'deploy/live-preview/compose.yaml'), 'utf8');
  assert.match(compose, /image: mcr\.microsoft\.com\/playwright:v1\.62\.1-noble/);
  assert.match(compose, /PLAYWRIGHT_BROWSERS_PATH: "\/ms-playwright"/);
  assert.match(compose, /HOME: "\/home\/chromium"/);
  assert.match(compose, /\/home\/chromium:size=64m,mode=1777/);
  assert.match(compose, /body\.status === 'ok' && body\.readOnly === false/);
  assert.match(compose, /UI_READ_ONLY: "0"/);
  assert.doesNotMatch(compose, /:\/opt\/data:rw/);
  assert.match(compose, /history-lessons[^}]*}:\/workspace:ro/);
  assert.match(compose, /history-lessons[^}]*}\/classes:\/workspace\/classes:rw/);
  assert.match(compose, /history-lessons[^}]*}\/tests:\/workspace\/tests:rw/);
  assert.match(compose, /UI_FEEDBACK_ENABLED: "1"/);
});

test('writable export UI restores portable and PDF actions for lessons and assessments', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: false });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    const lesson = await page.evaluate(async () => (await (await fetch('/api/lessons')).json()).lessons.find((item) => item.capabilities.presentation));
    await page.locator('#catalog .lesson').filter({ hasText: lesson.title }).click();
    await page.getByRole('button', { name: 'Portable HTML' }).waitFor();
    assert.ok(await page.getByRole('button', { name: 'PDF prezentacji' }).count());
    assert.ok(await page.getByRole('button', { name: 'Karta pracy PDF' }).count());
    await page.getByRole('tab', { name: 'Kartkówki' }).click();
    await page.locator('#catalog .lesson').first().click();
    assert.equal(await page.getByRole('link', { name: 'Pobierz DOCX' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: 'Drukuj / zapisz PDF' }).count(), 1);
    assert.deepEqual(pageErrors, []);
  } finally {
    await browser.close();
    await stop(server);
  }
});

test('read-only browser UI explains its mode and why an invalid lesson needs review', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    await page.route('**/api/lessons', async (route) => {
      const response = await route.fetch();
      const catalog = await response.json();
      const first = catalog.lessons[0];
      catalog.lessons[0] = { ...first, valid: false, issues: ['Katalog lekcji musi mieć nazwę NN-krotki-slug.'] };
      await route.fulfill({ response, body: JSON.stringify(catalog) });
    });
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await page.getByText('Tylko podgląd', { exact: true }).waitFor();
    await page.waitForFunction(() => [...document.querySelectorAll('#catalog .lesson small')].some((label) => label.textContent.includes('Wymaga kontroli')));
    const flagged = page.locator('#catalog .lesson').filter({ hasText: 'Wymaga kontroli' });
    assert.match(await flagged.locator('small').textContent(), /Wymaga kontroli:.*NN-krotki-slug/);
  } finally {
    await browser.close();
    await stop(server);
  }
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
    const search = page.getByRole('searchbox', { name: 'Szukaj' });
    assert.equal(await search.getAttribute('placeholder'), 'Szukaj....');
    assert.equal(await search.evaluate((input) => getComputedStyle(input).borderRadius), '999px');
    assert.equal(await page.locator('aside > label').count(), 0);
    for (const width of [1280, 390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      assert.equal(await page.locator('.catalog-switch').evaluate((tabs) => {
        const buttons = [...tabs.querySelectorAll('button')];
        const rowTop = buttons[0].getBoundingClientRect().top;
        return buttons.every((tab) => {
          const box = tab.getBoundingClientRect();
          const label = tab.querySelector('span').getBoundingClientRect();
          return box.top === rowTop && label.left >= box.left && label.right <= box.right
            && tab.querySelector('svg').getBoundingClientRect().bottom <= label.top;
        });
      }), true, `one row, icon above visible label at ${width}px`);
    }
    await page.setViewportSize({ width: 1280, height: 720 });
    const lessonTab = page.getByRole('tab', { name: 'Lekcje' });
    const testTab = page.getByRole('tab', { name: 'Kartkówki' });
    const glyphs = await Promise.all([lessonTab, testTab].map((tab) => tab.evaluate((element) => {
      const glyph = element.querySelector('svg');
      return { exists: Boolean(glyph), stroke: glyph && getComputedStyle(glyph).stroke, color: getComputedStyle(element).color };
    })));
    assert.deepEqual(glyphs, [
      { exists: true, stroke: 'rgb(0, 126, 255)', color: 'rgb(0, 126, 255)' },
      { exists: true, stroke: 'rgb(104, 113, 122)', color: 'rgb(104, 113, 122)' },
    ]);
    assert.equal(await lessonTab.getAttribute('aria-selected'), 'true');
    assert.equal(await testTab.getAttribute('tabindex'), '-1');
    await testTab.click();
    assert.equal(await testTab.getAttribute('aria-selected'), 'true');
    await page.waitForTimeout(200);
    const activeGlyphs = await Promise.all([lessonTab, testTab].map((tab) => tab.evaluate((element) => getComputedStyle(element.querySelector('svg')).stroke)));
    assert.deepEqual(activeGlyphs, ['rgb(104, 113, 122)', 'rgb(0, 126, 255)']);
    assert.equal(await page.locator('#catalog').getAttribute('aria-labelledby'), 'show-tests');
    await testTab.press('ArrowLeft');
    assert.equal(await lessonTab.getAttribute('aria-selected'), 'true');
    assert.equal(await lessonTab.evaluate((tab) => document.activeElement === tab), true);
    await page.locator('#catalog .lesson').filter({ hasText: 'Polityka okupacyjna III Rzeszy' }).click();
    assert.deepEqual(await page.locator('.tabs button').first().evaluate((tab) => {
      const style = getComputedStyle(tab);
      return [style.borderTopLeftRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius];
    }), ['16px', '0px', '0px']);
    const previewButtons = page.locator('.preview-head button');
    assert.deepEqual(await previewButtons.evaluateAll((buttons) => buttons.map((button) => ({
      label: button.getAttribute('aria-label'), tooltip: button.dataset.tooltip, icon: Boolean(button.querySelector('svg')),
      radius: getComputedStyle(button).borderRadius,
    }))), [
      { label: 'Odśwież podgląd', tooltip: 'Odśwież podgląd', icon: true, radius: '14px' },
      { label: 'Otwórz w nowej karcie', tooltip: 'Otwórz w nowej karcie', icon: true, radius: '14px' },
    ]);
    await previewButtons.first().hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.preview-head button'), '::after').opacity === '1');
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

test('SPE exam preview renders checkboxes and keeps maps within the scrollable pane', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    await page.getByRole('tab', { name: 'Sprawdziany' }).click();
    await page.locator('#catalog .lesson').filter({ hasText: 'pradzieje, pierwsze cywilizacje i starożytny Izrael (wersja dostosowana)' }).click();
    const frame = page.frameLocator('.exam-pages');
    await frame.locator('img').waitFor();
    assert.equal(await frame.locator('li').filter({ hasText: '[ ]' }).count(), 0);
    assert.ok(await frame.locator('li.check-item').count() > 0);
    const sizes = await frame.locator('body').evaluate((body) => ({
      image: body.querySelector('img').getBoundingClientRect().height,
      loaded: body.querySelector('img').naturalWidth > 0,
      columns: getComputedStyle(body.querySelector('main')).columnCount,
      width: document.documentElement.scrollWidth,
      lastX: body.querySelector('section').lastElementChild.getBoundingClientRect().x,
    }));
    assert.equal(sizes.loaded, true);
    assert.equal(sizes.columns, '2');
    assert.ok(sizes.image < 300 && sizes.lastX > 750 && sizes.width < 1650, JSON.stringify(sizes));
    const examButtons = page.locator('#catalog .lesson');
    const examCount = await examButtons.count();
    assert.ok(examCount >= 6);
    for (let index = 0; index < examCount; index += 1) {
      await examButtons.nth(index).click();
      const sheet = page.frameLocator('.exam-pages');
      await sheet.locator('h1').waitFor();
      const bounds = await sheet.locator('body').evaluate((body) => ({
        width: document.documentElement.scrollWidth,
        end: body.querySelector('section').lastElementChild.getBoundingClientRect().toJSON(),
        main: body.querySelector('main').getBoundingClientRect().toJSON(),
      }));
      assert.ok(bounds.width < 1650 && bounds.end.left > bounds.main.left + 700 && bounds.end.right <= bounds.main.right + 1, JSON.stringify(bounds));
    }
  } finally {
    await browser.close();
    await stop(server);
  }
});

test('exam collection is separate, printable preview hides key and tabs work on mobile', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/admin/`);
    for (const name of ['Lekcje', 'Kartkówki', 'Sprawdziany']) {
      await page.getByRole('tab', { name }).click();
      assert.deepEqual(await page.locator('#catalog .lesson').first().evaluate((item) => {
        const style = getComputedStyle(item);
        return [style.borderRadius, style.borderRightWidth];
      }), ['0px', '8px']);
    }
    const examTab = page.getByRole('tab', { name: 'Sprawdziany' });
    await examTab.click();
    assert.equal(await examTab.getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#catalog').getAttribute('aria-labelledby'), 'show-exams');
    assert.equal(await page.locator('#catalog .lesson').filter({ hasText: 'Kartkówka' }).count(), 0);
    assert.equal(await page.getByRole('link', { name: 'Pobierz DOCX' }).count(), 0);
    await page.locator('#catalog .lesson').filter({ hasText: 'Europa po kongresie wiedeńskim' }).click();
    await page.frameLocator('.exam-pages').locator('h1').waitFor();
    const preview = await page.frameLocator('.exam-pages').locator('body').textContent();
    assert.match(preview, /Wiosna Ludów/);
    assert.doesNotMatch(preview, /Klucz odpowiedzi|dla nauczyciela/);
    const examPdf = await page.request.get(`http://127.0.0.1:${port}/tests/7/01-europa-po-kongresie-i-rewolucja-przemyslowa.pdf`);
    assert.equal(await page.getByRole('link', { name: 'Pobierz PDF' }).count(), examPdf.ok() ? 1 : 0);
    assert.equal(await page.locator('.actions').count(), 0);
    for (const height of [800, 600]) {
      await page.setViewportSize({ width: 1280, height });
      assert.equal(await page.evaluate(() => {
        const preview = document.querySelector('.assessment-preview .exam-pages');
        return document.documentElement.scrollHeight <= innerHeight
          && preview.getBoundingClientRect().bottom <= innerHeight - 20
          && preview.getBoundingClientRect().height >= innerHeight - 200;
      }), true, `exam preview fits ${height}px viewport`);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await examTab.press('ArrowLeft');
    assert.equal(await page.getByRole('tab', { name: 'Kartkówki' }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.locator('#catalog .lesson').filter({ hasText: 'Europa po kongresie wiedeńskim' }).count(), 0);
    await page.locator('#catalog .lesson').first().click();
    await page.locator('.exam-pages').waitFor();
    const docxLink = page.getByRole('link', { name: 'Pobierz DOCX' });
    assert.equal(await docxLink.count(), 1);
    const docxDownload = page.waitForEvent('download');
    await docxLink.click();
    assert.match((await docxDownload).suggestedFilename(), /\.docx$/u);
    const pdfLink = page.getByRole('link', { name: 'Pobierz PDF' });
    assert.equal(await pdfLink.getAttribute('href'), '/tests/5/01-pierwsi-ludzie-i-pierwsze-cywilizacje.pdf');
    assert.equal(await pdfLink.locator('svg').count(), 1);
    assert.equal(await pdfLink.evaluate((link) => getComputedStyle(link).borderRadius), '14px');
    const pdfResponse = await page.request.get(`http://127.0.0.1:${port}${await pdfLink.getAttribute('href')}`);
    assert.equal(pdfResponse.status(), 200);
    assert.equal((await pdfResponse.body()).subarray(0, 5).toString(), '%PDF-');
    const download = page.waitForEvent('download');
    await pdfLink.click();
    assert.match((await download).suggestedFilename(), /\.pdf$/u);
    await page.setViewportSize({ width: 1280, height: 800 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight
      && document.querySelector('.exam-pages').getBoundingClientRect().bottom <= innerHeight - 20), true);
    assert.deepEqual(errors, []);
  } finally { await browser.close(); await stop(server); }
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
    assert.deepEqual(await page.locator('.preview-head button').evaluateAll((buttons) => buttons.map((button) => ({
      label: button.getAttribute('aria-label'), icon: Boolean(button.querySelector('svg')),
      radius: getComputedStyle(button).borderRadius,
    }))), [
      { label: 'Dodaj refleksję', icon: true, radius: '14px' },
      { label: 'Odśwież podgląd', icon: true, radius: '14px' },
      { label: 'Otwórz w nowej karcie', icon: true, radius: '14px' },
    ]);
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

test('CSP permits supported presentation fonts and opt-in video without allowing inline scripts', async () => {
  const { server, port } = await createUiServer({ repoRoot, port: 0, host: '127.0.0.1', readOnly: true });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  try {
    const page = await browser.newPage();
    const cspErrors = [];
    page.on('console', (message) => {
      if (/content security policy|violates.*frame-src|refused to load/i.test(message.text())) cspErrors.push(message.text());
    });
    await page.goto(`http://127.0.0.1:${port}/classes/8/04-wojna-poza-europa/`);
    await page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    await page.locator('[data-video-play]').first().evaluate((button) => button.click());
    await page.waitForFunction(() => document.querySelector('iframe[data-video-src]')?.getAttribute('src')?.startsWith('https://www.youtube-nocookie.com/embed/'));
    assert.deepEqual(cspErrors, []);
  } finally {
    await browser.close();
    await stop(server);
  }
});
