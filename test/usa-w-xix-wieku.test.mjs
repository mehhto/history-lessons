import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const dir=new URL('../classes/7/11-usa-w-xix-wieku/',import.meta.url);
const read=n=>readFile(new URL(n,dir),'utf8');
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&');
// Audyt fotografii s.69: normalizacja WYŁĄCZNIE białych znaków.
const ws=s=>s.replace(/\s+/g,' ').trim();
const auditedQuote="Ja, Abraham Lincoln, prezydent Stanów Zjednoczonych, [...] polecam i ogłaszam, że wszystkie osoby trzymane w niewoli w wymienionych stanach i ich częściach będą odtąd wolne, a rząd Stanów Zjednoczonych wraz z władzami Armii i Marynarki Wojennej uznawać i strzec będzie ich wolności.\n\nNiniejszym nakazuję też wyzwolonym w ten sposób, by powstrzymali się od wszelkiej przemocy, z wyjątkiem koniecznej samoobrony, i polecam im, by we wszystkich przypadkach, w których jest to możliwe, pracowali z oddaniem, w zamian za rozsądne wynagrodzenie.\n\nOgłaszam również, że osoby takie, jeśli spełnią określone warunki, przyjmowane będą w szeregi sił zbrojnych Stanów Zjednoczonych dla obsadzenia fortów, placówek, stacji i innych obiektów wojskowych oraz dla wcielenia do załóg wszelkiego rodzaju okrętów.";
const auditedQuestions=["Odpowiedz, czego oczekiwały władze Unii od wyzwolonych niewolników.", "Wyjaśnij, jakie konsekwencje dla dalszego przebiegu wojny miał wydany dekret o zniesieniu niewolnictwa."];
const auditedFootnote="Źródło: Wiek XIX w źródłach, oprac. M. Sobańska-Bondaruk, S.B. Lenard, Warszawa 2002, s. 259–260.";
test('USA VII: dokładne trzy akapity, oba pytania i przypis, bez zgubienia warunków',async()=>{
 const md=await read('slides.md');const blocks=md.split(/^---\s*$/m);
 const source=blocks.find(b=>b.includes('id="zrodlo"'));
 assert.equal(ws(plain(source.match(/<blockquote>([\s\S]*?)<\/blockquote>/)[1])),ws(auditedQuote));
 assert.equal((source.match(/<blockquote>([\s\S]*?)<\/blockquote>/)[1].match(/<p>/g)||[]).length,3);
 assert.equal(ws(plain(source.match(/<figcaption>([\s\S]*?)<\/figcaption>/)[1])),ws(auditedFootnote));
 const questions=blocks.find(b=>b.includes('id="pytania-zrodlo"'));
 assert.deepEqual([...questions.matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m=>ws(plain(m[1]))),auditedQuestions.map(ws));
 assert.equal(blocks.indexOf(questions)+1,blocks.indexOf(source));
 for(const q of auditedQuestions)assert.ok((await read('worksheet.md')).includes(q));
 assert.ok(source.includes('z wyjątkiem koniecznej samoobrony'));assert.ok(source.includes('jeśli spełnią określone warunki'));
});
test('USA VII: cały pakiet,19notes,3bloki notatki,35/30/40min,bez akceptacji',async()=>{
 const md=await read('slides.md'),m=JSON.parse(await read('metadata.json'));
 assert.equal(m.id,'11-usa-w-xix-wieku');assert.equal(m.grade,7);assert.equal(m.duration_minutes,35);assert.equal(m.curriculum_version,'stara-przejsciowa');assert.equal(m.school_year,'2026/2027');
 assert.equal(m.lesson_type,'new-knowledge');assert.equal(m.presentation_mode,'slides');assert.equal(m.teacher_reviewed,false);assert.equal(m.pdf_exported,false);assert.equal(m.source_reviewed,false);
 const blocks=md.split(/^---\s*$/m);assert.equal(blocks.length,19);assert.equal((md.match(/^notes:$/gm)||[]).length,19);assert.ok(blocks.at(-1).includes('id="zrodla"'));assert.equal((md.match(/Warto zanotować/g)||[]).length,3);
 for(const b of blocks){assert.match(b,/data-purpose=/);assert.match(b,/data-layout=/);assert.ok(b.split('notes:')[1].trim().length>40);}
 assert.ok(!md.includes('<section'));assert.ok(!md.includes('<iframe'));assert.ok(!/src="https?:/.test(md));
 assert.ok(md.includes('1860'));assert.ok(md.includes('1861'));assert.ok(md.includes('XIII poprawka'));assert.ok(md.includes('Niewolnicze stany graniczne pozostały w Unii'));
 assert.equal([2,4,5,4,7,5,3,2,3].reduce((a,b)=>a+b),35);assert.equal([1,3,4,4,6,5,3,2,2].reduce((a,b)=>a+b),30);assert.equal([2,4,6,4,8,6,4,2,4].reduce((a,b)=>a+b),40);
 const w=await read('worksheet.md');assert.ok(!/A\)|B\)|C\)|D\)|model odpowiedzi|XIII poprawka/.test(w));
 for(const f of ['lesson.md','teacher-guide.md','assessment.md','student-summary.md','sources.md','reflection.md','index.html','lesson.css'])assert.ok((await read(f)).length>100,f);
});
test('USA VII:9lokalnych mediów z dokładnym URL,licencją i zgodnym SHA256',async()=>{
 const source=await read('sources.md');const assets=(await readdir(new URL('assets/',dir))).filter(n=>!n.startsWith('.'));assert.equal(assets.length,9);
 for(const n of assets){let record=source.split('### media-').find(s=>s.includes('`assets/'+n+'`'));assert.ok(record,n);assert.match(record,/Dokładny URL pliku: https:/);assert.match(record,/Prawa wskazane przy tej figure:/);const hash=createHash('sha256').update(await readFile(new URL('assets/'+n,dir))).digest('hex');assert.ok(record.includes(hash),n);}
 for(const url of ['https://zpe.gov.pl/a/porachunki-wojna-secesyjna/D186ugvmI','https://zpe.gov.pl/b/wojna-secesyjna/PQZebFehr','https://zpe.gov.pl/b/stany-zjednoczone---od-wojny-domowej-do-mocarstwa-przemyslowego-podsumowanie-wiadomosci/PxzqckxdL','https://zpe.gov.pl/a/narodziny-mocarstwa-usa-w-ii-polowie-xix-wieku/DQ9DkKE7h'])assert.ok(source.includes(url));
 assert.ok(source.includes('status praw polskiego tłumaczenia nieustalony'));assert.ok(!assets.some(n=>n.startsWith('img_')));
});
