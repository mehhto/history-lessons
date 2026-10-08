import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const dir = path.resolve('classes/8/07-polacy-na-frontach');
test('eight short photographic inquiries, one pupil map/card, ordered key and 35-minute script', async () => {
 const text=await readFile(path.join(dir,'dossiers.md'),'utf8');
 const pages=text.trim().split(/\n<!-- page -->\n/);
 assert.equal(pages.length,8);
 const names=['Dywizjon 303','1. Dywizja Pancerna Maczka','Armia Andersa','Polska Marynarka Wojenna','Armia Berlinga','Spadochroniarze Sosabowskiego','Strzelcy Karpaccy','Strzelcy Podhalańscy'];
 const photos=[];
 for(let i=0;i<8;i++) {
  assert.ok(pages[i].startsWith(`# ${i+1}. ${names[i]}`));
  for(const heading of ['Fotografia','Dowódca','Opis walk','Pytanie śledczych','Na mapie'])assert.ok(pages[i].includes(`## ${heading}`));
  assert.match(pages[i],/Nie cytat ani relacja świadka/);
  const words=pages[i].match(/<div class="history-text">([\s\S]+?)<\/div>/)[1].trim().split(/\s+/).length;
  assert.ok(words>=100&&words<=120,`${i+1}: ${words} words`);
  const images=[...pages[i].matchAll(/assets\/([a-z0-9.-]+\.jpg)/g)];assert.equal(images.length,1);photos.push(images[0][1]);
 }
 assert.equal(new Set(photos).size,8);
 assert.doesNotMatch(text,/Błędny meldunek|Dowód [AB]|dwa dowody|120 potwierdzonych|gen\. Witold|kpt\. Witold/);
 assert.match(pages[4],/1\. Dywizję Piechoty/);assert.match(pages[4],/Natarcie nie przyniosło oczekiwanego przełamania/);
 assert.doesNotMatch(pages[4],/1945|Popławski|Berlin(?:\s|[,.])|Wał Pomorski/);
 const worksheet=await readFile(path.join(dir,'worksheet.md'),'utf8');
 assert.equal((worksheet.match(/class="answer-field/g)||[]).length,5);
 for(let n=1;n<=5;n++)assert.ok(worksheet.includes(`<strong>${n}.`));
 assert.match(worksheet,/assets\/mapa-do-oznaczania.svg/);assert.equal(worksheet.split('<!-- page -->').length,1);
 const teacher=await readFile(path.join(dir,'teacher-guide.md'),'utf8');
 assert.equal(teacher.split('<!-- page -->').length,4);assert.ok((teacher.match(/\*\*Powiedz/g)||[]).length>=10);
 assert.equal([4,3,13,7,5,3].reduce((a,b)=>a+b),35);assert.equal(8*30/60,4);
 const key=await readFile(path.join(dir,'assessment.md'),'utf8');
 for(let n=1;n<=8;n++)assert.ok(key.includes(`## ${n}.`));
 const metadata=JSON.parse(await readFile(path.join(dir,'metadata.json'),'utf8'));
 assert.equal(metadata.presentation_mode,'none');assert.equal(metadata.duration_minutes,35);assert.equal(metadata.pdf_exported,false);
 const sources=await readFile(path.join(dir,'sources.md'),'utf8');
 for(const url of ['https://zpe.gov.pl/a/polacy-na-frontach-ii-wojny-swiatowej/DXascISS7','https://zpe.gov.pl/a/polacy-na-frontach-ii-wojny-swiatowej/D8fD0YF6l','https://www.tomaszewska.com.pl/polacy.na.frontach.pdf','https://stutzfamily.com/mrstutz/ww2/europemap.html'])assert.ok(sources.includes(url));
 const provenance=JSON.parse(await readFile(path.join(dir,'assets/asset-provenance.json'),'utf8'));
 assert.deepEqual(provenance.filter(a=>a.file.endsWith('.jpg')).map(a=>a.file),photos);
 for(const asset of provenance){assert.ok(asset.licence);assert.equal(createHash('sha256').update(await readFile(path.join(dir,'assets',asset.file))).digest('hex'),asset.sha256,asset.file);if(asset.file.endsWith('.jpg'))for(const field of ['source_page','url','author','title','date','archive'])assert.ok(asset[field]);}
 const map=JSON.parse(await readFile(path.join(dir,'assets/map-provenance.json'),'utf8'));
 assert.deepEqual(map.bounds,[-12,37,30,71]);assert.equal(map.points.length,9);
 assert.equal(new Set(map.points.map(p=>p.unit)).size,8);
 for(const asset of map.files)assert.equal(createHash('sha256').update(await readFile(path.join(dir,'assets',asset.file))).digest('hex'),asset.sha256);
 const blank=await readFile(path.join(dir,'assets/mapa-do-oznaczania.svg'),'utf8');
 assert.match(blank,/NIE granice wojenne/);assert.doesNotMatch(blank,/<text[^>]*class="answer"/);
});
