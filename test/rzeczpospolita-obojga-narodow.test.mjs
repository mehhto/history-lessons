import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { localChromiumExecutable } from './support/local-chromium.mjs';
import { parseSlideDirectives, auditSlideContract } from '../scripts/slide-contract.mjs';
import { parseLessonMetadata, inspectGoalContract, unresolvedMarkers } from '../scripts/lesson-quality.mjs';
import { compositionIssues, slideBlocks } from '../scripts/check-slide-composition.mjs';
import { startServer, inspectEverySlide } from '../scripts/render-check.mjs';
import { findCanvasIssues } from '../scripts/render-probe.mjs';
import { buildPortablePresentation } from '../scripts/export-portable.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const relative = 'classes/6/11-rzeczpospolita-obojga-narodow';
const directory = path.join(root, relative);
const read = name => readFile(path.join(directory, name), 'utf8');
const plain = s => s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const ws = s => s.replace(/\s+/g, ' ').trim();
const intro = 'W dokumencie, który zawierał postanowienia unii realnej z 1569 roku, opisano zasady połączenia Polski i Litwy. Wśród zapisów znalazły się ustalenia dotyczące wyboru władcy oraz obowiązków nowego monarchy.';
const excerpt = [
 '3. Iż już Korona i Wielkie Księstwo Litewskie jest jedno nierozdzielone i nieróżne ciało, a także nieróżna, ale jedna spólna [wspólna] Rzeczpospolita, która się ze dwu państw i narodów w jeden lud zniosła i spoiła.',
 '4. A temu obojem narodowi, żeby już wiecznymi czasy jedna głowa, jeden pan i jeden król spólny rozkazował, który spólnymi głosy od Polaków i od Litwy obran [wybrany], a miejsce obierania w Polszcze, a po tym na Królestwo Polskie pomazan [namaszczony] i koronowan w Krakowie będzie [...].',
 '7. A przy koronacji nowego króla mają być przez króla koronowanego poprzysiężone i zaraz konfirmowane [zatwierdzone] na jednym liście [...] na wieczne czasy prawa, przywileje i wolności poddanych wszystkich obojga narodów i państw tak złączonych.',
];
const credit = 'Źródło: Ustrój Polski w XVI–XVIII wieku, [w:] Teksty źródłowe do nauczania historii w szkole, z. 20, Warszawa 1960, s. 7.';
const questions = ['Opowiedz, w którym mieście miał być koronowany nowo wybrany król.', 'Powiedz, jaki obowiązek spoczywał na każdym władcy podczas koronacji.'];
const urls = ['https://www.youtube.com/watch?v=kLcFetVAoQQ','https://www.youtube.com/watch?v=bAekBrZvPcs','https://zpe.gov.pl/a/rzeczpospolita-obojga-narodow/D1Fn6YhVv','https://zpe.gov.pl/a/droga-do-unii-realnej/D1D2imFmD','https://zpe.gov.pl/b/unia-lubelska-a-ustroj-rzeczypospolitej-obojga-narodow/P1adCaAoW','https://zpe.gov.pl/b/rzeczpospolita-obojga-narodow---ludnosc-i-terytorium/PmKshWnsf'];

test('RON VI: pełne granice źródła3/4/7, intro, kredyt i dwa wcześniejsze pytania', async () => {
 const slides = await read('slides.md'), blocks = slides.split(/\n---\n/);
 const source = blocks.find(b => b.includes('id="akt-zrodlo"')).split('\nnotes:')[0];
 assert.equal(plain(source.match(/class="source-intro">([\s\S]*?)<\/p>/)[1]), intro);
 assert.deepEqual([...source.match(/class="act-text">([\s\S]*?)<\/div>/)[1].matchAll(/<p>([\s\S]*?)<\/p>/g)].map(m => plain(m[1])), excerpt);
 assert.equal(plain(source.match(/class="source-credit">([\s\S]*?)<\/p>/)[1]), credit);
 const prompt = blocks.find(b => b.includes('id="pytania-zrodlo"')).split('\nnotes:')[0];
 assert.deepEqual([...prompt.matchAll(/<li>(.*?)<\/li>/g)].map(m => plain(m[1])), questions);
 assert.ok(slides.indexOf('id="pytania-zrodlo"') < slides.indexOf('id="akt-zrodlo"'));
 assert.doesNotMatch(prompt, /Kraków|konfirmowane|Poprzysiężenie/);
});

test('RON VI: kompletny pakiet,16notes, aktywna podstawa, cele i zaakceptowany czas', async () => {
 const slides = await read('slides.md'), metadata = parseLessonMetadata(await read('metadata.json'));
 const parsed = parseSlideDirectives(slides);
 assert.equal(parsed.length,16); assert.equal((slides.match(/^notes:/gm)||[]).length,16);
 assert.deepEqual(auditSlideContract(parsed).errors, []);
 assert.deepEqual(slideBlocks(slides).flatMap(compositionIssues), []);
 assert.deepEqual(inspectGoalContract({metadata,lessonMarkdown:await read('lesson.md'),assessmentMarkdown:await read('assessment.md'),slides:parsed}).errors, []);
 assert.equal(metadata.grade,6);assert.equal(metadata.duration_minutes,38);assert.equal(metadata.school_year,'2026/2027');
 assert.equal(metadata.curriculum_version,'stara-przejsciowa');assert.match(metadata.curriculum_requirement,/7\) przedstawia okoliczności zawarcia unii realnej/);
 assert.equal(metadata.teacher_reviewed,true);assert.equal(metadata.pdf_exported,false);
 assert.equal([2,4,6,7,5,8,4,2].reduce((a,b)=>a+b),38);
 for(const f of ['lesson.md','worksheet.md','assessment.md','teacher-guide.md','student-summary.md','sources.md','reflection.md','storyboard.md','index.html','lesson.css']) {
  const text=await read(f); assert.ok(text.length>100,f);assert.deepEqual(unresolvedMarkers(text),[],f);
 }
 for(const b of slides.split(/\n---\n/)) assert.match(b.split('\nnotes:')[0],/<img\b/);
 const sources=await read('sources.md');for(const u of urls)assert.ok(sources.includes(u),u);
 assert.doesNotMatch(slides,/<iframe|lesson-video|src="https?:/);
 assert.deepEqual(parsed.slice(4,8).map(s=>s.id),['lublin','diagram-praca','wspolne','odrebne']);
 const diagramTask=slides.split(/\n---\n/).find(b=>b.includes('id="diagram-praca"')).split('\nnotes:')[0];
 assert.match(diagramTask,/Przeczytaj na s\. 67/);
 assert.doesNotMatch(diagramTask,/Sprawdź własny|Samodzielnie sprawdź/);
 assert.match(await read('worksheet.html'),/Przeczytaj fragment na s\. 67/);
 assert.ok(slides.indexOf('id="diagram-praca"') < slides.indexOf('id="diagram-model"'));
 assert.match(await read('teacher-guide.md'),/Pełny wariant bez prezentacji/);
 assert.equal(parsed.at(-1).id,'bilet');
 assert.ok(parsed.some(s=>s.id==='zrodla'));
 assert.ok(parsed.some(s=>s.id==='mapa-jezykow'));
 assert.match(slides,/granice w1618/);
 assert.match(slides,/gminy w miastach/);
 assert.match(slides,/Lwów i Kamieniec Podolski/);
 assert.match(await read('teacher-guide.md'),/6 par i trójka przy 15/);
});

test('RON VI: Venn4+4+4, pustyB&W bez odpowiedzi, źródłowe godła i spójne hashe', async () => {
 const blank=await read('assets/venn-blank-bw.svg'), model=await read('assets/venn-model.svg');
 for(const s of ['władca','sejm','polityka','moneta','urzędy','wojsko','skarb','sądownictwo'])assert.doesNotMatch(blank,new RegExp('>'+s+'<'));
 for(const s of ['urzędy','wojsko','skarb','sądownictwo'])assert.equal((model.match(new RegExp('>'+s+'<','g'))||[]).length,2);
 for(const s of ['władca','sejm','polityka','zagraniczna','moneta'])assert.equal((model.match(new RegExp('>'+s+'<','g'))||[]).length,1);
 assert.equal((blank.match(/<image /g)||[]).length,2);assert.match(blank,/grayscale\(1\)/);assert.equal((blank.match(/data-common-field=/g)||[]).length,4);
 assert.match(await read('worksheet.css'),/size:A4 landscape/);
 assert.doesNotMatch(await read('worksheet.html'),/model-bw|A\)|B\)|C\)|D\)/);
 const records=JSON.parse(await read('assets/provenance.json'));
 const files=(await readdir(path.join(directory,'assets'))).filter(n=>n!=='provenance.json');
 assert.equal(files.length,records.length);
 for(const r of records)assert.equal(createHash('sha256').update(await readFile(path.join(directory,r.file))).digest('hex'),r.sha256,r.file);
 for(const f of ['orzel-1560.jpg','pogon-1560.jpg']) assert.equal(records.find(r=>r.file==='assets/'+f).derived_from,'assets/arras-1560.jpg');
 for(const [,asset] of (await read('slides.md')).matchAll(/src="([^"]+)"/g))assert.ok(files.includes(asset.replace('assets/','')));
});

test('RON VI: wszystkie slajdy3viewports, live/offline, lightboxy, klawisze, notatki i kartaA4', {timeout:180000}, async () => {
 const output=path.join(root,'.hermes/reviews/6/11-rzeczpospolita-obojga-narodow/qa');await mkdir(output,{recursive:true});
 const isolated=await mkdtemp(path.join(output,'isolated-'));
 const portable=await buildPortablePresentation({repoRoot:root,lessonDirectory:directory});
 const file=path.join(isolated,'review-portable.html');await writeFile(file,portable);
 const server=process.env.RON_LIVE_URL ? null : await startServer(root);
 const live=process.env.RON_LIVE_URL || `http://127.0.0.1:${server.address().port}/${relative}/`;
 const browser=await chromium.launch({executablePath:await localChromiumExecutable(root)});
 const report={slides:16,viewports:[],lightboxes:[],worksheets:[],errors:[]};
 try {
  for(const [mode,url] of [['live',live],['offline',pathToFileURL(file).href]]) {
   const page=await browser.newPage();const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   await page.goto(url);await page.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');
   if(mode==='live') {
    for(const name of ['slides.md','lesson.css','metadata.json']) assert.equal(await (await page.request.get(new URL(name,url).href)).text(),await read(name),`live revision: ${name}`);
   }
   await page.evaluate(()=>Promise.all([...document.querySelectorAll('.slides img')].map(i=>i.decode())));
   assert.equal(await page.locator('.slides aside.notes').count(),16);
   assert.ok(await page.locator('.slides img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)));
   for(const viewport of [{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]) {
    await page.setViewportSize(viewport);await page.evaluate(()=>Reveal.layout());
    const slides=await inspectEverySlide(page);assert.equal(slides.length,16);
    const issues=slides.flatMap(s=>findCanvasIssues({...s,viewport}));assert.deepEqual(issues,[],mode+JSON.stringify(viewport));
    for(let h=0;h<16;h++){await page.evaluate(h=>Reveal.slide(h),h);await page.screenshot({path:path.join(output,`${mode}-${viewport.width}-${String(h+1).padStart(2,'0')}.png`)});}
    report.viewports.push({mode,...viewport,slides:slides.length,issues});
   }
   // Every image is exercised in the real presentation tab, including both arms.
   await page.setViewportSize({width:1280,height:720});
   for(let h=0;h<16;h++) {
    await page.evaluate(h=>Reveal.slide(h),h);
    const images=page.locator('.slides section.present .slide-content img');
    for(let i=0;i<await images.count();i++) {
     const image=images.nth(i);await image.focus();await image.press('Enter');
     const dialog=page.locator('dialog.lesson-image-lightbox');await dialog.waitFor({state:'visible'});
     assert.equal((await dialog.locator('.lesson-image-lightbox__caption').innerText()).trim(),'');
     await dialog.locator('img').evaluate(i=>i.decode());
     if((h===7&&i===0)||h===10||h===11) await page.screenshot({path:path.join(output,`${mode}-lightbox-${h}-${i}.png`)});
     await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getIndices().h),h);
     await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
     assert.equal(await image.evaluate(i=>document.activeElement===i),true);
     report.lightboxes.push({mode,h,image:i});
    }
   }
   await page.evaluate(()=>Reveal.slide(0));await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getIndices().h),1);
   await page.keyboard.press('s');assert.equal(await page.evaluate(()=>Reveal.getConfig().showNotes),'inline');
   await page.waitForFunction(()=>document.querySelector('.speaker-notes')?.getBoundingClientRect().width>0);
   for(const viewport of [{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]) {
    await page.setViewportSize(viewport);await page.evaluate(()=>Reveal.layout());
    const rect=await page.evaluate(()=>Reveal.getCurrentSlide().getBoundingClientRect().toJSON());
    assert.ok(rect.left>=0&&rect.top>=0&&rect.right<=viewport.width&&rect.bottom<=viewport.height,'notes mode canvas contained');
   }
   await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>Reveal.layout());
   await page.screenshot({path:path.join(output,`${mode}-notes.png`)});await page.keyboard.press('s');
   await page.keyboard.press('b');assert.equal(await page.evaluate(()=>Reveal.isPaused()),true);await page.keyboard.press('b');
   await page.keyboard.press('f');await page.waitForFunction(()=>!!document.fullscreenElement);await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);
   assert.deepEqual(errors,[],mode);if(mode==='offline')assert.deepEqual(requests,[]);
   const sourceSize=await page.locator('#akt-zrodlo .act-text p').first().evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.ok(sourceSize>=22&&sourceSize<=28);
   await page.close();
  }
  const page=await browser.newPage({viewport:{width:1200,height:850}});
  for(const name of ['worksheet.html','worksheet-teacher.html']) {
   await page.goto(new URL(name,live).href);await page.locator('img').evaluate(i=>i.decode());await page.emulateMedia({media:'print'});
   const geometry=await page.locator('main').evaluate(main=>({width:main.getBoundingClientRect().width,height:main.getBoundingClientRect().height,scroll:main.scrollHeight,children:[...main.children].map(e=>({bottom:e.getBoundingClientRect().bottom,top:e.getBoundingClientRect().top}))}));
   assert.ok(geometry.width<=277*96/25.4+.5);assert.ok(geometry.height<=190*96/25.4+.5);assert.ok(geometry.children.every(c=>c.bottom<=geometry.height+1));assert.ok(geometry.scroll<=geometry.height+1);
   await page.screenshot({path:path.join(output,name.replace('.html','-a4.png'))});report.worksheets.push({name,...geometry});
  }
  await page.close();await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log(`RON QA evidence: ${output}; ${report.lightboxes.length} lightboxes; isolated file: ${file}`);
 } finally {await browser.close();if(server)await new Promise(r=>server.close(r));}
});
