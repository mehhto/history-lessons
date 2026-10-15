import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSlideDirectives, auditSlideContract } from '../scripts/slide-contract.mjs';
const dir = new URL('../classes/8/08-polskie-panstwo-podziemne/', import.meta.url);
const quote = 'W ostatnich 14 dniach zdarzyło się kilka bardzo niemiłych wypadków. I tak w Warszawie zaatakowano granatami ręcznymi policjantów, gdy przejeżdżali przez miasto; było kilku zabitych. W pobliżu Warszawy wpadł na miny pociąg wiozący urlopowników [żołnierzy niemieckich na urlopie] z frontu, przy czym lokomotywa wykoleiła się, a pociąg ostrzelano wtedy z karabinów maszynowych z odległości 8 m. Było 15 zabitych i 30 ciężej lub lżej rannych. Przed kilku dniami zastrzelono starszego radcę rządu i inspektora rządowego. Policja zareagowała energicznie na te wypadki. [...] Za zamach kolejowy stracono 150, a za obydwu urzędników niemieckich – 50 terrorystów polskich [...]. Należy zważyć, że przez rozstrzelanie 200 ludzi zostaje dotkniętych przynajmniej 3000 osób (z najbliższej rodziny). Osieroceni przypisali sprawcom zamachów odpowiedzialność za śmierć swoich krewnych.';
test('PPP: pełny cytat, pytania przed źródłem, chronologia i wszystkie notes', async () => {
  const slides = await readFile(new URL('slides.md', dir), 'utf8');
  const blocks = slides.split(/^\r?\n---\r?\n$/m);
  assert.equal(blocks.length, 28);
  assert.equal((slides.match(/^notes:$/gm) || []).length, blocks.length);
  assert.deepEqual(auditSlideContract(parseSlideDirectives(slides), {lessonType:'new-knowledge'}).errors, []);
  assert.equal(slides.match(/<blockquote class="frank">([\s\S]*?)<\/blockquote>/)?.[1], quote);
  assert.equal((quote.match(/\[\.\.\.\]/g) || []).length, 2);
  assert.ok(slides.indexOf('id="pytania-zrodlo"') < slides.indexOf('id="terror"'));
  const visible = blocks.map(b => b.split(/^notes:$/m)[0]).join('\n');
  for (const token of ['27 IX 1939','13 XI 1939','14 II 1942','30 VI 1943','7/8 X 1942','26 III 1943','1 II 1944','Hubal','Departament Informacji i Prasy','Departament Oświaty i Kultury','V-1','V-2','GL WRN','Narodowe Siły Zbrojne','Jan Karski']) assert.ok(visible.includes(token), token);
  assert.ok(!visible.includes('grudzień 1939'));
  for (const photo of ['hubal.jpg','rudy.jpg','kutschera.jpg','tajne-komplety.jpg']) {
    assert.ok(visible.includes(`assets/${photo}`), photo);
    assert.ok((await readFile(new URL(`assets/${photo}`,dir))).length > 0, photo);
  }
  const metadata = JSON.parse(await readFile(new URL('metadata.json',dir),'utf8'));
  assert.equal(metadata.teacher_reviewed,false); assert.equal(metadata.source_reviewed,false); assert.equal(metadata.pdf_exported,false);
  const sources = await readFile(new URL('sources.md',dir),'utf8');
  for(const url of ['https://zpe.gov.pl/b/polskie-panstwo-podziemne/P1CB3ziaQ','https://zpe.gov.pl/a/polskie-panstwo-podziemne-komunisci-w-czasie-okupacji/DqEzrlI4a']) assert.ok(sources.includes(url));
  const worksheet = await readFile(new URL('worksheet.md',dir),'utf8');
  assert.ok(!worksheet.includes('Klucz odpowiedzi'));
});
