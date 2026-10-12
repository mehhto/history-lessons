import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { parseSlideDirectives, auditSlideContract } from '../scripts/slide-contract.mjs';
const root = new URL('../classes/5/05-sparta-i-wojny-z-persami/', import.meta.url);
const quote = 'Pisania uczyli się jako rzeczy przydatnej; zresztą całe wychowanie miało na celu karność, wytrwałość w trudach i waleczność. Z postępem wieku zaostrzano metodę hartowania, strzyżono do skóry, przyuczano chodzić boso […]. Od 12 roku życia stale już chodzili bez tuniki¹, otrzymywali jedno himation² na rok; skóra pozbawiona kąpieli i olejków twardniała im. Tylko kilka razy do roku dozwalano im tej uciechy, by mogli się wykąpać i natrzeć ciało. […] Wieczerza była skąpa, aby walka z niedostatkiem zmuszała ich do odwagi i przemyślności. […] Pieśni spartańskie, których nie mniej starannie uczono, sławiły przeważnie poległych za Spartę lub ganiły tchórzów, przedstawiając nędzę ich życia, oraz zawierały przyrzeczenie mężnej postawy w życiu dojrzałym lub wyraz dumy z powodu życia już minionego – stosownie do wieku.';
test('Sparta: full source, self-contained teaching and verified media references', async () => {
  const slides = await readFile(new URL('slides.md', root), 'utf8');
  const visible = slides.replace(/\nnotes:[\s\S]*?(?=\n---\n|$)/g, '');
  const records = parseSlideDirectives(slides);
  assert.equal(records.length, 24);
  assert.deepEqual(auditSlideContract(records, { lessonType: 'new-knowledge' }).errors, []);
  const source = visible.split(/\n---\n/).find(block => block.includes('id="wychowanie-zrodlo"'));
  assert.ok(source?.includes(quote), 'One slide must contain the exact complete supplied quotation');
  assert.ok(visible.indexOf('id="pytania-do-zrodla"') < visible.indexOf('id="wychowanie-zrodlo"'), 'Questions must precede the source');
  assert.match(visible, /Podczas czytania poszukasz/);
  for (const term of ['Spartańskie wychowanie','Spartańskie warunki','Lakoniczna odpowiedź / mowa','Wizna','Władysława Raginisa','7–10 września 1939','oporu wobec przewagi']) assert.ok(visible.includes(term), term);
  assert.ok(visible.indexOf('id="polskie-termopile"') > visible.indexOf('id="pamiec-termopil"'));
  assert.match(visible, /hoplita-strzalki\.png/);
  assert.ok(!source.includes('student-task'), 'Keep questions separate from quotation');
  for (const required of ['Lakonia', 'Peloponez', 'Lakonian', 'lakonicz', 'Spartiaci', 'Periojkowie', 'Heloci', 'dwóch królów', 'dwóch dynastii', 'danina', 'Mezopotami', 'Azj', 'Egipt', 'Dariusz', 'Kserkses', 'Miltiades', 'Leonidas', 'Temistokles', 'taran', 'nagolenniki', 'pancerz', 'włócznia', 'miecz', 'hoplon', 'falanga', 'górską ścieżką', 'padł martwy', 'poświęcenia']) assert.ok(visible.toLowerCase().includes(required.toLowerCase()), required);
  assert.match(visible, /Legenda[\s\S]*?brak pewnego potwierdzenia/i);
  assert.match(visible, /490[\s\S]*480[\s\S]*479/);
  assert.ok(!/przeczytaj[^\n]*(?:z podręcznika|w podręczniku)/i.test(visible));
  assert.ok(!visible.includes('assets/hoplite.png'), 'A bust is not the equipment illustration');
  const sources = await readFile(new URL('sources.md', root), 'utf8');
  for (const asset of new Set([...slides.matchAll(/(?:src|data-lightbox-src)="(assets\/[^"]+)"/g)].map(m => m[1]))) {
    await access(new URL(asset, root));
    assert.ok(sources.includes(asset), `Missing provenance: ${asset}`);
  }
  assert.ok(sources.includes('https://zpe.gov.pl/a/wojny-perskie/DIEuiF2Kg'));
  for (const file of ['lesson.md', 'teacher-guide.md', 'worksheet.md', 'student-summary.md', 'assessment.md']) {
    const text = await readFile(new URL(file, root), 'utf8');
    assert.ok(!/Przygotuj fragment|Przeczytaj fragment Plutarcha z podręcznika|faladze/.test(text), file);
  }
  const metadata = JSON.parse(await readFile(new URL('metadata.json', root)));
  assert.equal(metadata.duration_minutes, 45);
  assert.equal(metadata.teacher_reviewed, true);
  assert.equal(metadata.pdf_exported, false);
  const css = await readFile(new URL('lesson.css', root), 'utf8');
  assert.match(css, /grid-template-columns: 320px minmax\(0,1fr\); gap: 40px/);
  assert.match(css, /font-size: 26px; line-height: 1\.42/);
  const hashes = [...sources.matchAll(/\| `([^`]+)` \| `([a-f0-9]{64})` \|/g)];
  const { createHash } = await import('node:crypto');
  for (const [,asset,hash] of hashes) assert.equal(createHash('sha256').update(await readFile(new URL(asset, root))).digest('hex'), hash, asset);
});
