import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const fixture = JSON.parse(await readFile(new URL('./fixtures/documentary-1939-critical-slides.json', import.meta.url), 'utf8'));
const slides = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/slides.md', import.meta.url), 'utf8');
const sources = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/sources.md', import.meta.url), 'utf8');
const teacherGuide = await readFile(new URL('../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/teacher-guide.md', import.meta.url), 'utf8');
const learnerAndTeacherPackage = (await Promise.all([
  'slides.md',
  'lesson.md',
  'teacher-guide.md',
  'worksheet.md',
  'student-summary.md',
  'assessment.md',
].map((file) => readFile(new URL(`../classes/8/wojna-obronna-polski-we-wrzesniu-1939-roku/${file}`, import.meta.url), 'utf8')))).join('\n');

test('September dossier uses its required documentary layouts and critical slides', () => {
  for (const layout of fixture.requiredLayouts) assert.match(slides, new RegExp(`data-layout="${layout}"`), layout);
  for (const id of fixture.requiredIds) assert.match(slides, new RegExp(`id="${id}"`), id);
});

test('September dossier turns claims into visible comparative evidence', () => {
  const forceSlide = slides.match(/id="przewaga-sil"[\s\S]*?\n---/u)?.[0] ?? '';
  const metrics = forceSlide.match(/data-force-metric=/g) || [];
  assert.equal(metrics.length, 3);
  for (const category of ['żołnier', 'czołg', 'samolot']) assert.match(forceSlide, new RegExp(category, 'iu'));
  assert.equal((forceSlide.match(/data-side="germany"/g) || []).length, 3);
  assert.equal((forceSlide.match(/data-side="poland"/g) || []).length, 3);

  const quote = slides.match(/id="glos-epoki"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.match(quote, /<blockquote>/);
  assert.match(quote, /<figcaption>/);
  assert.match(quote, /5 (?:maja|V) 1939/iu);
  assert.match(quote, /Jaką decyzję Polski/);
  assert.doesNotMatch(quote, /czego nie mówi|szans(?:a|ach) obrony|granica źródła/iu);
});

test('September dossier uses concrete soldier and civilian case studies without photo-analysis disclaimers', () => {
  const soldier = slides.match(/id="bohaterstwo-zolnierzy"[\s\S]*?\n---/u)?.[0] ?? '';
  const civilians = slides.match(/id="bohaterstwo-cywilow"[\s\S]*?\n---/u)?.[0] ?? '';
  for (const block of [soldier, civilians]) {
    for (const role of ['place', 'date', 'action', 'meaning']) assert.match(block, new RegExp(`data-case-role="${role}"`));
    assert.match(block, /<img[^>]+src="assets\//);
    assert.doesNotMatch(block, /granica (?:źródła|fotografii)|nie dowodzi|niemieckiej perspektywy|już po walce/iu);
  }
});

test('September dossier does not reuse a photograph as a substitute for new evidence', () => {
  const imageSources = [...slides.matchAll(/<img[^>]+src="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(imageSources).size, imageSources.length);
});

test('September dossier keeps the learner-facing task brief concise', () => {
  assert.match(slides, /data-task-role="prompt"/);
  assert.match(slides, /data-task-role="time"/);
  assert.doesNotMatch(slides, /data-task-role="(?:product|criterion)"/);
  assert.doesNotMatch(slides, /(?:Kryterium sukcesu|Efekt pracy|Produkt)/i);
});

test('September dossier presents resistance as a campaign sequence, not a card catalogue', () => {
  const resistance = slides.match(/id="opor"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.match(resistance, /<ol class="resistance-route">/);
  assert.doesNotMatch(resistance, /comparison-grid/);
  for (const place of ['Westerplatte', 'Bzura', 'Warszawa', 'Kock']) assert.match(resistance, new RegExp(place));
});

test('September dossier keeps questions answerable without revealing the answer in the same slide', () => {
  const mapSlide = slides.match(/id="mapa-kampanii"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.doesNotMatch(mapSlide, /Dwa kierunki agresji|Z ilu (?:stron|kierunków)/iu);
  assert.match(mapSlide, /Wskaż na mapie obszary/iu);

  const taskSlide = slides.match(/id="chronologia"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.match(taskSlide, /części 3 karty pracy/iu);
  assert.doesNotMatch(taskSlide, /task-tags|Ułóżcie pięć kart/iu);
});

test('cause explanation and synthesis use different structures and jobs', () => {
  const causes = slides.match(/id="dlaczego-kleska"[\s\S]*?\n---/u)?.[0] ?? '';
  const synthesis = slides.match(/id="synteza"[\s\S]*?\n---/u)?.[0] ?? '';
  assert.match(causes, /cause-grid/);
  assert.doesNotMatch(synthesis, /cause-grid|synthesis-grid|argument-evidence/);
  assert.match(synthesis, /synthesis-contrast/);
});

test('September dossier uses concise, natural learner-facing Polish', () => {
  assert.match(slides, /^## Trzy daty, które zmieniły kampanię$/m);
  assert.match(slides, /^## Dlaczego obrona zakończyła się klęską\?$/m);
  assert.match(slides, /Jaką decyzję Polski/);
  assert.doesNotMatch(learnerAndTeacherPackage, /Znaczenie i granica źródła|granica (?:fotografii|źródła)|ograniczeni(?:e|a) fotografii|czego nie mówi o szansach obrony|niemieckiej perspektywy/iu);
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
  assert.match(slides, /<ol class="resistance-route">/);
  assert.doesNotMatch(slides, /<div class="timeline-band">/);
});
