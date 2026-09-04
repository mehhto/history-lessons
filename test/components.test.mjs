import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { clampPercentage, counterValueAtProgress, galleryNavigationIndex, isGalleryNavigationKey } from '../template/components/lesson-components-core.mjs';

test('counter helpers clamp progress and compare slider values', () => {
  assert.equal(clampPercentage(-3), 0);
  assert.equal(clampPercentage(47.5), 47.5);
  assert.equal(clampPercentage(140), 100);
  assert.equal(counterValueAtProgress(1200, .25), 300);
  assert.equal(counterValueAtProgress(-1200, .25), 0);
});

test('online embeds are deferred until the learner chooses to load them', async () => {
  const [components, showcase] = await Promise.all([
    readFile(new URL('../template/components/lesson-components.js', import.meta.url), 'utf8'),
    readFile(new URL('../classes/6/katalog-komponentow-prezentacji/slides.md', import.meta.url), 'utf8'),
  ]);
  assert.match(components, /iframe\[data-map-src\]/);
  assert.match(showcase, /data-map-open/);
  assert.match(showcase, /data-map-src="https:\/\/www\.google\.com/);
  assert.doesNotMatch(showcase, /<iframe[^>]*\ssrc="https:\/\/www\.google\.com/);
});

test('disclosures isolate Reveal navigation and map panels remain readable in print', async () => {
  const [components, css] = await Promise.all([
    readFile(new URL('../template/components/lesson-components.js', import.meta.url), 'utf8'),
    readFile(new URL('../template/components/lesson-components.css', import.meta.url), 'utf8'),
  ]);
  assert.match(components, /class LessonDisclosure/);
  assert.match(components, /\['lesson-disclosure', LessonDisclosure\]/);
  assert.match(components, /keepKeysInsideComponent\(summary\)/);
  assert.match(css.slice(css.indexOf('@media print')), /\[data-map-panel\]\[hidden\].*display: block !important/);
});

test('gallery keyboard navigation wraps at both ends', () => {
  assert.equal(galleryNavigationIndex(0, 'ArrowLeft', 3), 2);
  assert.equal(galleryNavigationIndex(2, 'ArrowRight', 3), 0);
});

test('gallery keyboard navigation supports first and last item', () => {
  assert.equal(galleryNavigationIndex(1, 'Home', 3), 0);
  assert.equal(galleryNavigationIndex(1, 'End', 3), 2);
  assert.equal(galleryNavigationIndex(1, 'Escape', 3), null);
});

test('gallery claims only its own interaction keys', () => {
  assert.equal(isGalleryNavigationKey('ArrowLeft'), true);
  assert.equal(isGalleryNavigationKey(' '), true);
  assert.equal(isGalleryNavigationKey('Escape'), true);
  assert.equal(isGalleryNavigationKey('a'), false);
});

test('gallery print styles clear the interactive visual state', async () => {
  const css = await readFile(new URL('../template/components/lesson-components.css', import.meta.url), 'utf8');
  const printStyles = css.slice(css.indexOf('@media print'));
  assert.match(printStyles, /filter: none/);
  assert.match(printStyles, /has-active-item \[data-gallery-item\]:not\(\.is-active\)/);
  assert.match(printStyles, /transform: none/);
  assert.match(printStyles, /flex: 1 1 0/);
});

test('gallery presents activation controls without a false toggle state', async () => {
  const components = await readFile(new URL('../template/components/lesson-components.js', import.meta.url), 'utf8');
  const galleryComponent = components.slice(components.indexOf('class LessonGallery'), components.indexOf('class LessonCounter'));
  assert.match(galleryComponent, /setAttribute\('role', 'button'\)/);
  assert.doesNotMatch(galleryComponent, /aria-pressed/);
});

test('PDF export serves ECMAScript modules as JavaScript', async () => {
  const exportScript = await readFile(new URL('../scripts/export-pdf.mjs', import.meta.url), 'utf8');
  assert.match(exportScript, /'\.mjs': 'text\/javascript/);
});

test('template loads the per-lesson stylesheet and local component assets', async () => {
  const index = await readFile(new URL('../template/lesson/index.html', import.meta.url), 'utf8');
  assert.match(index, /href="lesson\.css"/);
  assert.match(index, /href="\.\.\/\.\.\/\.\.\/template\/components\/lesson-components\.css"/);
  assert.match(index, /src="\.\.\/\.\.\/\.\.\/template\/components\/lesson-components\.js"/);
});
