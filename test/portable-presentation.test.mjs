import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile as execFileCallback } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const root = path.resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(root, '.playwright-browsers');
const { chromium } = await import('playwright');
const { buildPortablePresentation, exportPortablePresentation } = await import('../scripts/export-portable.mjs');
const execFile = promisify(execFileCallback);
const browserExecutable = path.join(root, '.playwright-browsers/chromium-1234/chrome-linux64/chrome');
const lesson = path.join(root, 'classes/4/jak-poznajemy-przeszlosc-historia-i-zrodla-historyczne');
const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');

async function fixture({ slides, css = '' }) {
  const directory = await mkdtemp(path.join(root, '.portable-fixture-'));
  await mkdir(path.join(directory, 'assets'));
  await Promise.all([
    writeFile(path.join(directory, 'metadata.json'), `${JSON.stringify({ title: 'Próba przenośna', appearance: { style: 'museum', palette: 'sand' } })}\n`),
    writeFile(path.join(directory, 'lesson.css'), css),
    writeFile(path.join(directory, 'slides.md'), slides),
    writeFile(path.join(directory, 'assets/zażółć.png'), pixel),
  ]);
  return directory;
}

async function openPortable(browser, html) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'history-portable-'));
  const output = path.join(temporary, 'lekcja.html');
  await writeFile(output, html, 'utf8');
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  return { page, temporary, output };
}

test('portable presentation runs from file URL without server or network', async () => {
  const browser = await chromium.launch({ executablePath: browserExecutable });
  let opened;
  try {
    const html = await buildPortablePresentation({ repoRoot: root, lessonDirectory: lesson });
    assert.match(html, /Tryb przenośny: jeden plik HTML/);
    assert.match(html, /Content-Security-Policy/);
    opened = await openPortable(browser, html);
    const externalRequests = [];
    const browserErrors = [];
    opened.page.on('request', (request) => {
      if (/^https?:/.test(request.url())) externalRequests.push(request.url());
    });
    opened.page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
    opened.page.on('pageerror', (error) => browserErrors.push(error.message));
    await opened.page.goto(new URL(`file://${opened.output}`).href);
    await opened.page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');

    assert.equal(await opened.page.evaluate(() => Reveal.getTotalSlides()), 16);
    const images = await opened.page.locator('.reveal .slides img').evaluateAll((items) => items.map((image) => ({ src: image.currentSrc, loaded: image.complete && image.naturalWidth > 0 })));
    assert.ok(images.length > 0);
    assert.ok(images.every((image) => image.loaded && image.src.startsWith('data:image/')));
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(browserErrors, []);

    await opened.page.locator('#otwarcie img').click();
    assert.equal(await opened.page.locator('.lesson-image-lightbox').getAttribute('open'), '');
    await opened.page.keyboard.press('Escape');
    assert.equal(await opened.page.locator('.lesson-image-lightbox').getAttribute('open'), null);

    await opened.page.evaluate(() => Reveal.slide(3, 0, -1));
    const summary = opened.page.locator('#opowiesci summary').first();
    await summary.focus();
    await opened.page.keyboard.press('Space');
    assert.equal(await opened.page.locator('#opowiesci details').first().getAttribute('open'), '');
    assert.equal((await opened.page.evaluate(() => Reveal.getIndices())).h, 3);

    assert.equal(await opened.page.evaluate(() => Reveal.getConfig().showNotes), false);
    await opened.page.keyboard.press('s');
    assert.equal(await opened.page.evaluate(() => Reveal.getConfig().showNotes), 'inline');
  } finally {
    await opened?.page.close();
    if (opened) await rm(opened.temporary, { recursive: true, force: true });
    await browser.close();
  }
});

test('portable export resolves dot-relative Unicode assets and escapes raw-text closers case-insensitively', async () => {
  const directory = await fixture({
    slides: '<!-- .slide: id="test" class="opening-slide" data-purpose="opening" data-layout="statement-centered" -->\n## Próba\n<img src="./assets/zażółć.png" alt="Piksel">\n\nTekst </SCRIPT> pozostaje tekstem.\n',
    css: '/* </STYLE> pozostaje komentarzem */\n',
  });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  let opened;
  try {
    const html = await buildPortablePresentation({ repoRoot: root, lessonDirectory: directory });
    assert.ok(html.includes('<\\/script>'));
    assert.ok(html.includes('\\3c /STYLE>'));
    opened = await openPortable(browser, html);
    await opened.page.goto(new URL(`file://${opened.output}`).href);
    await opened.page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    const image = await opened.page.locator('.slides img').evaluate((element) => ({ src: element.currentSrc, loaded: element.complete && element.naturalWidth > 0 }));
    assert.equal(image.loaded, true);
    assert.match(image.src, /^data:image\/png;base64,/);
  } finally {
    await opened?.page.close();
    if (opened) await rm(opened.temporary, { recursive: true, force: true });
    await browser.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('portable export inlines raw HTML images from Windows CRLF Markdown', async () => {
  const directory = await fixture({
    slides: '<!-- .slide: id="test" class="opening-slide" data-purpose="opening" data-layout="statement-centered" -->\r\n<img src="assets/zażółć.png" alt="Piksel">\r\n<div>\r\n## Próba\r\n</div>\r\n',
  });
  try {
    const html = await buildPortablePresentation({ repoRoot: root, lessonDirectory: directory });
    assert.doesNotMatch(html, /src="assets\/zażółć\.png"/);
    assert.match(html, /src="data:image\/png;base64,/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('portable export rejects automatic network resources before creating HTML', async () => {
  const variants = [
    '<!-- .slide: id="test" class="source-slide" data-purpose="evidence" data-layout="source-focus" -->\n## Próba\n<img src="https://example.invalid/track.png" alt="Zewnętrzny obraz">\n',
    '<!-- .slide: id="test" class="source-slide" data-purpose="evidence" data-layout="source-focus" -->\n## Próba\n![Zewnętrzny obraz](https://example.invalid/track.png)\n',
  ];
  for (const slides of variants) {
    const directory = await fixture({ slides });
    try {
      await assert.rejects(
        buildPortablePresentation({ repoRoot: root, lessonDirectory: directory }),
        /Automatyczny zasób zewnętrzny nie jest przenośny/,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }
});

test('portable export leaves resource-looking code examples inert', async () => {
  const directory = await fixture({ slides: '<!-- .slide: id="test" class="source-slide" data-purpose="evidence" data-layout="source-focus" -->\n## Kod\n```html\n<img src="https://example.invalid/only-an-example.png">\n```\n' });
  const browser = await chromium.launch({ executablePath: browserExecutable });
  let opened;
  try {
    opened = await openPortable(browser, await buildPortablePresentation({ repoRoot: root, lessonDirectory: directory }));
    const externalRequests = [];
    opened.page.on('request', (request) => { if (/^https?:/.test(request.url())) externalRequests.push(request.url()); });
    await opened.page.goto(new URL(`file://${opened.output}`).href);
    await opened.page.waitForFunction(() => document.documentElement.dataset.presentationReady === 'true');
    assert.match(await opened.page.locator('code').textContent(), /example\.invalid/);
    assert.deepEqual(externalRequests, []);
  } finally {
    await opened?.page.close();
    if (opened) await rm(opened.temporary, { recursive: true, force: true });
    await browser.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test('documented CLI creates a default ignored artifact and rejects unsafe output names', async () => {
  const directory = await fixture({ slides: '<!-- .slide: id="test" class="opening-slide" data-purpose="opening" data-layout="statement-centered" -->\n## Próba\n' });
  const relativeLesson = path.relative(root, directory);
  const defaultOutput = path.join(directory, `${path.basename(directory)}-portable.html`);
  try {
    await execFile(process.execPath, ['scripts/export-portable.mjs', '--lesson', relativeLesson], { cwd: root });
    await access(defaultOutput);
    await execFile('git', ['check-ignore', '-q', path.relative(root, defaultOutput)], { cwd: root });
    await assert.rejects(
      execFile(process.execPath, ['scripts/export-portable.mjs', '--lesson', relativeLesson, '--output', 'lekcja.html'], { cwd: root }),
      /musi kończyć się na -portable\.html/,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('portable exporter refuses to overwrite an output symlink', async () => {
  const directory = await fixture({ slides: '<!-- .slide: id="test" class="opening-slide" data-purpose="opening" data-layout="statement-centered" -->\n## Próba\n' });
  const outside = path.join(os.tmpdir(), `history-portable-target-${process.pid}.html`);
  const outputName = 'symlink-portable.html';
  await writeFile(outside, 'nie zmieniaj', 'utf8');
  await symlink(outside, path.join(directory, outputName));
  try {
    await assert.rejects(
      exportPortablePresentation({ repoRoot: root, lesson: path.relative(root, directory), output: outputName }),
      /nie może być dowiązaniem symbolicznym/,
    );
    assert.equal(await readFile(outside, 'utf8'), 'nie zmieniaj');
  } finally {
    await rm(directory, { recursive: true, force: true });
    await rm(outside, { force: true });
  }
});
