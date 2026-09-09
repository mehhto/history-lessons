import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('./fixtures/documentary-1939-critical-slides.json', import.meta.url), 'utf8'));
const slides = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/slides.md', import.meta.url), 'utf8');
const sources = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/sources.md', import.meta.url), 'utf8');
const teacherGuide = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/teacher-guide.md', import.meta.url), 'utf8');

test('September dossier uses its required documentary layouts and critical slides', () => {
  for (const layout of fixture.requiredLayouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  for (const id of fixture.requiredIds) assert.match(slides, new RegExp(`id="${id}"`), id);
});

test('September dossier uses semantic gallery and a learner-facing task brief', () => {
  assert.match(slides, /<lesson-gallery[^>]*>[\s\S]*data-gallery-item/);
  assert.match(slides, /data-task-role="prompt"/);
  assert.match(slides, /data-task-role="time"/);
  assert.doesNotMatch(slides, /data-task-role="(?:product|criterion)"/);
  assert.doesNotMatch(slides, /(?:Kryterium sukcesu|Efekt pracy|Produkt)/i);
  assert.doesNotMatch(slides, /<div class="lesson-gallery"/);
});

test('September dossier uses concise, natural learner-facing Polish', () => {
  assert.match(slides, /^## Pierwsze dni$/m);
  assert.match(slides, /^## Przyczyny klęski Polski$/m);
  assert.match(slides, /\*\*Co przesądziło o klęsce Polski w kampanii 1939 roku\?\*\*/);
  assert.match(slides, /<p class="source-method"><strong>Zobacz\. Opisz\.<\/strong><\/p>/);
  assert.doesNotMatch(slides, /daty, które trzeba połączyć|nazwij ograniczenie|Język dowodu|mów konkretnie|Co porządkuje tę lekcję/i);
  assert.doesNotMatch(teacherGuide, /z których stron Polska była atakowana po 17 września|wskazuje ograniczenie każdego z nich/i);
});

test('prewar situation and campaign timeline have distinct teaching roles', () => {
  const prewarSlide = slides.match(/id="polozenie"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.match(prewarSlide, /23 sierpnia/);
  assert.match(prewarSlide, /układy sojusznicze/);
  assert.doesNotMatch(prewarSlide, /3 września|17 września|skuteczn[a-ząćęłńóśźż]* ofensyw/iu);
});

test('September dossier shows the campaign map once and keeps rights in source records', () => {
  assert.equal((slides.match(/mapa-kampanii-polskiej-1939\.png/g) || []).length, 1);
  assert.doesNotMatch(slides, /<figcaption>[^<]*(?:CC BY|domena publiczna|licencj)/i);
  assert.match(sources, /CC BY-SA 3\.0/);
  assert.match(sources, /domena publiczna/);
  assert.match(slides, /<ol class="campaign-timeline">/);
  assert.doesNotMatch(slides, /<div class="timeline-band">/);
});
