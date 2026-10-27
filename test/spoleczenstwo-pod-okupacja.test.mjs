import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { localChromiumExecutable } from './support/local-chromium.mjs';
import { parseSlideDirectives, auditSlideContract } from '../scripts/slide-contract.mjs';
import { parseLessonMetadata, inspectGoalContract, unresolvedMarkers } from '../scripts/lesson-quality.mjs';
import { inspectEverySlide } from '../scripts/render-check.mjs';
import { findCanvasIssues } from '../scripts/render-probe.mjs';
import { buildPortablePresentation } from '../scripts/export-portable.mjs';
import { slideBlocks, compositionIssues } from '../scripts/check-slide-composition.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = path.join(root, 'classes/8/09-spoleczenstwo-pod-okupacja');
const read = n => readFile(path.join(directory,n),'utf8');
const sketches = ['zagłada','terror','kultura','polska','gospodarka','wołyń'];
const quote = 'Najgorsze było PONIŻENIE! To, że nie traktowano cię jak istotę ludzką – zwłaszcza jeżeli byłeś Żydem i dlatego właśnie, że byłeś Żydem, nie traktowano ciebie nawet jak zwierzęcia, tylko jak insekt, jak wesz, jak gnidę, jak karalucha, jak pluskwę. […]';
const urls = ['https://zpe.gov.pl/a/wprowadzenie/Dd1m96AK5','https://zpe.gov.pl/a/eksterminacja-ludnosci-zydowskiej-przez-niemcy-na-okupowanych-ziemiach-polskich-podczas-ii-wojny-swiatowej/D17hpD55W','https://www.auschwitz.org/edukacja/materialy-dla-nauczycieli/','https://lekcja.auschwitz.org/1/'];

test('VIII: 40 minut, komplet, aktywna podstawa i sześć ostatnich sketchnotek', async()=>{
 const slides=await read('slides.md'), blocks=slides.split(/\n---\n/), parsed=parseSlideDirectives(slides);
 const metadata=parseLessonMetadata(await read('metadata.json'));
 assert.equal(metadata.grade,8);assert.equal(metadata.duration_minutes,40);
 assert.equal(metadata.curriculum_version,'stara-przejsciowa');assert.equal(metadata.school_year,'2026/2027');
 assert.equal(metadata.teacher_reviewed,false);assert.equal(metadata.pdf_exported,false);
 assert.equal(metadata.timing.reduce((a,b)=>a+b.minutes,0),40);
 assert.equal(parsed.length,22);assert.equal((slides.match(/^notes:/gm)||[]).length,22);
 assert.deepEqual(auditSlideContract(parsed).errors,[]);
 assert.deepEqual(slideBlocks(slides).flatMap(compositionIssues),[]);
 assert.deepEqual(inspectGoalContract({metadata,lessonMarkdown:await read('lesson.md'),assessmentMarkdown:await read('assessment.md'),slides:parsed}).errors,[]);
 assert.deepEqual(parsed.slice(-6).map(s=>s.id),sketches.map((_,i)=>`sketch-${i+1}`));
 for(let i=0;i<6;i++){
  const b=blocks.at(i-6).split('\nnotes:')[0];
  assert.match(b,new RegExp(`assets/sketch-0${i+1}-poprawiona\\.png`));
  assert.match(b,/Współczesna sketchnotka przygotowana z pomocą AI/);
 }
 for(const id of ['zrodla','bilet'])assert.ok(parsed.findIndex(s=>s.id===id)<16);
 assert.ok(slides.indexOf('id="pytania-relacja"')<slides.indexOf('id="relacja"'));
 assert.ok(slides.includes(quote));assert.match(slides,/19 IV–16 V 1943/);
 assert.ok((await read('teacher-guide.md')).includes(quote));
 for(const s of ['Żegota','Sendlerowa','Ulmowie','Pilecki','Karski','szmalcownictwo','Zamojszczyzna','OUN','UPA','samoobrona','Ukraińcy'])assert.ok(slides.includes(s),s);
 assert.doesNotMatch(slides,/<iframe|src="https?:/);
 for(const f of ['lesson.md','teacher-guide.md','teacher-guide.html','assessment.md','student-summary.md','sources.md','storyboard.md','reflection.md','worksheet.md','lesson.css','index.html','audyt-sketchnotek.md','quality-checklist.md']){
  const text=await read(f);assert.ok(text.length>100,f);assert.deepEqual(unresolvedMarkers(text),[],f);
 }
 for(const u of urls)assert.ok((await read('sources.md')).includes(u),u);
 const records=JSON.parse(await read('assets/provenance.json'));
 assert.equal(records.filter(r=>r.source==='user'&&r.file.endsWith('-oryginal.jpg')).length,6);
 assert.equal(records.filter(r=>r.source==='user'&&r.derived_from).length,6);
 for(const r of records.filter(r=>r.derived_from))assert.equal(r.source_sha256,records.find(s=>s.file===r.derived_from).sha256);
 for(const r of records)assert.equal(createHash('sha256').update(await readFile(path.join(directory,r.file))).digest('hex'),r.sha256,r.file);
});

test('VIII: pełny offline i prywatny live, geometria, obrazy, lightboxy i notatki', {timeout:240000}, async()=>{
 const output=path.join(root,'.hermes/reviews/8/09-spoleczenstwo-pod-okupacja/qa');await mkdir(output,{recursive:true});
 const isolated=await mkdtemp(path.join(output,'isolated-'));
 const file=path.join(isolated,'review-portable.html');await writeFile(file,await buildPortablePresentation({repoRoot:root,lessonDirectory:directory}));
 const modes=[['offline',pathToFileURL(file).href]];
 if(process.env.OCCUPATION_LIVE_URL)modes.push(['live',process.env.OCCUPATION_LIVE_URL]);
 const browser=await chromium.launch({executablePath:await localChromiumExecutable(root)});
 const report={viewports:[],lightboxes:[],errors:[],isolated:file};
 report.inputs=Object.fromEntries(await Promise.all(['slides.md','lesson.css','metadata.json','teacher-guide.html','assets/provenance.json'].map(async n=>[n,createHash('sha256').update(await read(n)).digest('hex')])));
 try{
  for(const [mode,url] of modes){
   const page=await browser.newPage();const errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   await page.goto(url);await page.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.slides img')].map(i=>i.decode()));Reveal.configure({transition:'none',backgroundTransition:'none'});});
   assert.equal(await page.locator('.slides aside.notes').count(),22);
   assert.ok(await page.locator('.slides img').evaluateAll(a=>a.every(i=>i.complete&&i.naturalWidth>0)));
   if(mode==='live')for(const n of ['slides.md','lesson.css','metadata.json'])assert.equal(await(await page.request.get(new URL(n,url).href)).text(),await read(n));
   for(const viewport of [{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);await page.evaluate(()=>Reveal.layout());
    const slides=await inspectEverySlide(page);assert.equal(slides.length,22);
    const issues=slides.flatMap(s=>findCanvasIssues({...s,viewport}));assert.deepEqual(issues,[],`${mode} ${viewport.width}`);
    for(let h=0;h<22;h++){
     await page.evaluate(h=>Reveal.slide(h),h);
     await page.screenshot({path:path.join(output,`${mode}-${viewport.width}-${String(h+1).padStart(2,'0')}.png`)});
    }
    report.viewports.push({mode,...viewport,slides:22,issues});
   }
   await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>Reveal.layout());
   for(const h of [0,2,9,16,17,18,19,20,21]){
    await page.evaluate(h=>Reveal.slide(h),h);const image=page.locator('.slides section.present .slide-content img').first();
    if(h>=16){const box=await image.boundingBox();assert.ok(box.width>800&&box.height>590,'sketchnotka duża, nie miniatura po kaskadzie CSS');}
    await image.focus();if(h===2)await image.click();else await image.press('Enter');const dialog=page.locator('dialog.lesson-image-lightbox');await dialog.waitFor({state:'visible'});
    await dialog.locator('img').evaluate(i=>i.decode());
    const rect=await dialog.boundingBox();assert.ok(rect.width>1000&&rect.height>500);
    await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getIndices().h),h);
    if(h===16||h===21)await page.screenshot({path:path.join(output,`${mode}-lightbox-${h+1}.png`)});
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.equal(await image.evaluate(i=>document.activeElement===i),true);
    report.lightboxes.push({mode,slide:h+1});
   }
   await page.evaluate(()=>Reveal.slide(0));await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getIndices().h),1);
   await page.keyboard.press('s');assert.equal(await page.evaluate(()=>Reveal.getConfig().showNotes),'inline');
   for(const viewport of [{width:1024,height:768},{width:1280,height:720},{width:1920,height:1080}]){
    await page.setViewportSize(viewport);await page.evaluate(()=>Reveal.layout());
    const r=await page.evaluate(()=>Reveal.getCurrentSlide().getBoundingClientRect().toJSON());
    assert.ok(r.left>=0&&r.top>=0&&r.right<=viewport.width&&r.bottom<=viewport.height,'notes contained');
   }
   await page.screenshot({path:path.join(output,`${mode}-notes.png`)});await page.keyboard.press('s');
   await page.keyboard.press('b');assert.ok(await page.evaluate(()=>Reveal.isPaused()));await page.keyboard.press('b');
   await page.keyboard.press('f');await page.waitForFunction(()=>!!document.fullscreenElement);await page.keyboard.press('f');await page.waitForFunction(()=>!document.fullscreenElement);
   const size=await page.locator('#relacja blockquote').evaluate(e=>parseFloat(getComputedStyle(e).fontSize));assert.ok(size>=22&&size<=28);
   assert.ok(await page.locator('#synteza .notebook li').evaluateAll(a=>a.every(e=>getComputedStyle(e).listStyleType==='decimal')),'cztery punkty notatki mają widoczną numerację');
   assert.deepEqual(errors,[],mode);if(mode==='offline')assert.deepEqual(requests,[]);
   await page.goto(pathToFileURL(path.join(directory,'teacher-guide.html')).href);assert.match(await page.locator('body').innerText(),/0:00|00:00/);
   await page.setViewportSize({width:1024,height:768});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'guide contains no horizontal overflow');
   await page.screenshot({path:path.join(output,`${mode}-teacher-guide.png`)});
   assert.deepEqual(errors,[],'standalone guide');if(mode==='offline')assert.deepEqual(requests,[],'guide offline');await page.close();
  }
  await writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(`Occupation QA: ${output}; isolated offline ${file}`);
 }finally{await browser.close();}
});
