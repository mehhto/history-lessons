import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, cp, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { localChromiumExecutable } from '../../../test/support/local-chromium.mjs';
import { startServer, inspectEverySlide } from '../../../scripts/render-check.mjs';
import { findCanvasIssues } from '../../../scripts/render-probe.mjs';
import { parseSlideDirectives, auditSlideContract } from '../../../scripts/slide-contract.mjs';
import { presentationRevision } from '../../../scripts/presentation-inputs.mjs';
const root=process.cwd(),lesson='classes/8/13-poczatek-zimnej-wojny',dir=path.join(root,lesson);
const qa=path.join(dir,'qa'),privateDir='/opt/data/history-production/grade8/two-textbooks-2026-11-19/lesson13';
const output=path.join(privateDir,'current');await mkdir(output,{recursive:true});await mkdir(qa,{recursive:true});
for(const name of await readdir(output))if(name.endsWith('.png'))await rm(path.join(output,name));
await rm(path.join(qa,'opening-fullhd.png'),{force:true});
process.env.PLAYWRIGHT_BROWSERS_PATH=path.join(root,'.playwright-browsers');
const portableName='poczatek-zimnej-wojny-dwa-podreczniki-portable.html';
const changedIds=['zimna-wojna','berlin-blokada','nato','nato-artykul-5','mur-film-wprowadzenie','mur-1961'];
const oldPortable=path.join(dir,'poczatek-zimnej-wojny-przebudowany-portable.html');
const oldPortableHash=createHash('sha256').update(await readFile(oldPortable)).digest('hex');
const expectedIds=["otwarcie", "skutki", "poczdam", "cztery-d", "poczdam-decyzje", "strefy-niemiec", "sektory-berlina", "norymberga", "norymberga-wyroki", "onz-powstanie", "onz-organy", "prawa-czlowieka", "sowietyzacja", "europa-1949", "zimna-wojna", "fulton", "truman", "marshall", "berlin-blokada", "nato", "nato-artykul-5", "niemcy-1949-mapa", "niemcy-powstanie", "niemcy-systemy", "mur-film-wprowadzenie", "mur-1961", "mur-ucieczki-kryzys", "mur-solidarnosc", "mur-otwarcie", "synteza", "sprawdzenie"];
const md=await readFile(path.join(dir,'slides.md'),'utf8'),directives=parseSlideDirectives(md);
assert.deepEqual(directives.map(s=>s.id),expectedIds);assert.deepEqual(auditSlideContract(directives,{lessonType:'new-knowledge'}).errors,[]);
const blocks=md.split(/^\r?\n---\r?\n$/m),byId=Object.fromEntries(directives.map((s,i)=>[s.id,blocks[i]]));
const times=blocks.map(b=>Number(b.match(/notes:\s*([\d,]+) min/)[1].replace(',','.')));
const scenario=await readFile(path.join(dir,'lesson.md'),'utf8');
const tableTimes=[...scenario.matchAll(/^\| \d+ `[^`]+` \|[^|]+\| ([\d.]+) \|/gm)].map(m=>Number(m[1]));
const buffer=Number(scenario.match(/^\| Bufor[^|]+\|[^|]+\| ([\d.]+) \|/m)[1]);
assert.deepEqual(tableTimes,times);assert.equal(times.reduce((a,b)=>a+b,0)+buffer,45);assert.equal(times[expectedIds.indexOf('skutki')],7);assert.equal(times.at(-1),3);
const textbook=await readFile('/opt/data/history-production/2026-11-16/grade8/teacher-revision/research/evidence/textbook-101-transcription.md','utf8');
const normalize=s=>s.replace(/\s+/g,' ').trim();
const quote=byId.fulton.match(/<blockquote>([\s\S]*?)<\/blockquote>/)[1];assert.equal(normalize(quote),normalize(textbook.match(/^> (.+)$/m)[1]));assert(quote.includes('Wiedeń'));assert(!/\[\d+\]/.test(quote));
const coverage={skutki:['Demograficzne','Społeczne','Gospodarcze','Kulturowe','Polityczne'],poczdam:['17 VII–2 VIII 1945','Attlee','Truman','Stalin','Churchill'],'cztery-d':['Demilitaryzacja','Denazyfikacja','Demokratyzacja','Dekartelizacja'],'norymberga':['20 XI 1945–1 X 1946','Göring','Ribbentrop','Hansa Franka'],'norymberga-wyroki':['>12<','>3<','>4<','24 osoby','22'],'onz-powstanie':['26 VI 1945','24 X 1945','193','51'],'onz-organy':['11','15','Trygve Lie','1946','António Guterres','weto'],'prawa-czlowieka':['10 XII 1948','listopad 1949'],'europa-1949':['7 X 1949','Finlandia i Austria','1948'],'zimna-wojna':['5 III 1946','1947'],'truman':['12 III 1947','Grecja i Turcja'],'marshall':['1947: propozycja','od 1948','Polska nie uczestniczyła'],'berlin-blokada':['24 VI 1948–12 V 1949'],'nato':['4 IV 1949','12 założycieli'],'niemcy-powstanie':['23 V 1949','7 X 1949','Adenauer','Heuss','Grotewohl','Pieck','Bonn','Berlin Wschodni'],'niemcy-systemy':['SED','Inne partie'],'mur-1961':['12/13 VIII 1961','lato / jesień 1961','1948–1949: blokada dostaw','1961: zamknięcie drogi ucieczki'],'mur-ucieczki-kryzys':['Conrad Schumann','15 VIII 1961','27–28 X 1961','Checkpoint Charlie','USA i ZSRS'],'mur-solidarnosc':['26 VI 1963','12 VI 1987','Kennedy','Reagan','Gorbaczowa'],'mur-otwarcie':['9 XI 1989','3 X 1990']};
for(const [id,terms]of Object.entries(coverage))for(const term of terms)assert(byId[id].split('notes:')[0].includes(term),`${id}: ${term}`);
for(const term of ['Prokuratorzy przedstawiali dowody','Oskarżeni składali wyjaśnienia','trybunał ogłosił wyroki'])assert(byId.norymberga.split('notes:')[0].includes(term),`norymberga — przebieg: ${term}`);
for(const name of ['lesson.md','slides.md','worksheet.md','teacher-guide.md','student-summary.md','assessment.md','sources.md','reflection.md','README.md','index.html','lesson.css','metadata.json']){const text=await readFile(path.join(dir,name),'utf8');assert(!/\[(?:DECYZJA NAUCZYCIELA|DO UZUPEŁNIENIA|DO WERYFIKACJI)|__TITLE__/.test(text),name);assert(!/15 slajdów|Brak mapy|strony.*nie były dostępne|Textbook chapter not inspected/.test(text),name);}
assert(!/<(?:iframe|lesson-video)|youtube/.test(md.split(/notes:/)[0]));assert(!/porównaj.*osobą obok|porównacie|w parach/.test(md));assert(!/gradient/.test((await readFile(path.join(dir,'lesson.css'),'utf8')).replace(/\/\*[\s\S]*?\*\//g,'')));
let metadata=JSON.parse(await readFile(path.join(dir,'metadata.json'),'utf8'));assert.equal(metadata.teacher_reviewed,true);assert.equal(metadata.teacher_accepted,false);assert.equal(metadata.source_reviewed,false);assert.equal(metadata.duration_minutes,45);
const manifest=JSON.parse(await readFile(path.join(dir,'source-manifest.json'),'utf8'));
const media=[];for(const a of manifest.assets){const data=await readFile(path.join(dir,a.file));const sha=createHash('sha256').update(data).digest('hex');assert.equal(sha,a.sha256,a.file);assert.equal(data.length,a.bytes);assert.equal(a.publication_approval,false);if(a.file.endsWith('.svg'))assert(!/<!DOCTYPE|<!ENTITY|<script|<foreignObject|(?:href|src)=["']https?:/i.test(data.toString()));media.push({file:a.file,sha256:sha,bytes:data.length});}
assert.equal(new Set(media.map(a=>a.file)).size,media.length);
assert(!/136|140 ofiar/.test(changedIds.map(id=>byId[id]?.split('notes:')[0]||'').join(' ')));
const filmIndex=expectedIds.indexOf('mur-film-wprowadzenie');assert.equal(expectedIds[filmIndex+1],'mur-1961');assert.equal(times[filmIndex],3.5);assert.equal(times.slice(filmIndex,filmIndex+5).reduce((a,b)=>a+b,0),6.5);assert(md.includes('https://www.youtube.com/watch?v=jb5QR2cbdug'));assert(md.includes('data-video-src="https://www.youtube-nocookie.com/embed/jb5QR2cbdug?rel=0"'));assert.equal((md.match(/<lesson-video>/g)||[]).length,1);assert.equal(buffer,.5);
const article5=await readFile(path.join(privateDir,'article5-transcription.txt'),'utf8');assert.equal(normalize(byId['nato-artykul-5'].match(/<blockquote>([\s\S]*?)<\/blockquote>/)[1]),normalize(article5));assert.equal(expectedIds[expectedIds.indexOf('nato')+1],'nato-artykul-5');assert.equal(times[expectedIds.indexOf('nato-artykul-5')],1);assert.equal(times[expectedIds.indexOf('zimna-wojna')],1.5);assert(byId['berlin-blokada'].includes('wymiana starego pieniądza'));assert(byId['berlin-blokada'].includes('korytarzami lotniczymi'));
// Match the regenerated guide to the actual final notes, not merely their count.
const guide=await readFile(path.join(dir,'teacher-guide.md'),'utf8');
for(const block of blocks){const notes=block.split('notes:\n')[1].trim();const body=notes.replace(/^[\d,]+ min\.\s*/,'');assert(guide.includes(body),'guide/notes mismatch');}
assert(!/opcjonalne.*zjednoczenie|domknięcie 1989–1990:/.test(scenario));
const commands=[];
function run(name,args){const r=spawnSync('npm',['run',name,'--',...args],{cwd:root,env:process.env,encoding:'utf8',timeout:180000});const output=(r.stdout||'')+(r.stderr||'');console.log(name,r.status,output);commands.push({command:`npm run ${name} -- ${args.join(' ')}`,exit_code:r.status});return {status:r.status,output};}
for(const name of ['check:contract','check:composition']){const r=run(name,['--lesson',lesson]);await writeFile(path.join(qa,name.replace(':','-')+'.log'),r.output);assert.equal(r.status,0,name);if(name==='check:composition')assert(!r.output.includes('⚠'));}
let exp=run('export:portable',['--lesson',lesson,'--output',portableName]);assert.equal(exp.status,0);
const server=await startServer(root),browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(root)});let evidence={};
try {
 async function verify(url,label){
  const context=await browser.newContext({viewport:{width:1600,height:900},hasTouch:true,offline:label==='offline'});const page=await context.newPage();const errors=[],external=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
  await page.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)&&(label!=='live'||!u.startsWith(`http://127.0.0.1:${server.address().port}/`))){external.push(u);return route.abort();}return route.continue();});
  await page.goto(url,{waitUntil:'networkidle'});await page.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');
  await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.slides img')].map(i=>i.decode()));Reveal.configure({transition:'none',backgroundTransition:'none'});});
  const metrics=await page.evaluate(()=>({ids:Reveal.getSlides().map(s=>s.id),slides:Reveal.getTotalSlides(),notes:document.querySelectorAll('aside.notes').length,canvas:{width:Reveal.getConfig().width,height:Reveal.getConfig().height},font:document.fonts.check('700 44px "Cold Sans"'),images:[...document.querySelectorAll('.slides img')].map(i=>({id:i.closest('section').id,src:i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight}))}));
  assert.deepEqual(metrics.ids,expectedIds);assert.equal(metrics.notes,expectedIds.length);assert.deepEqual(metrics.canvas,{width:1280,height:720});assert(metrics.font);assert(metrics.images.every(i=>i.width>0&&i.height>0));
  const sources=await page.locator('#nato-artykul-5 blockquote, #fulton blockquote').evaluateAll(es=>es.map(e=>({id:e.closest('section').id,font:parseFloat(getComputedStyle(e).fontSize),text:e.textContent})));assert.equal(sources.length,2);assert(sources.every(q=>q.font>=22&&q.font<=28));
  const learner=await page.evaluate(()=>{const c=document.querySelector('.slides').cloneNode(true);c.querySelectorAll('aside.notes').forEach(n=>n.remove());return {text:c.textContent,links:[...c.querySelectorAll('a[href]')].map(a=>a.getAttribute('href'))};});assert(!/CC BY|licencj|©|bibliografia|credits/i.test(learner.text));assert.deepEqual(learner.links,['https://www.youtube.com/watch?v=jb5QR2cbdug']);
  assert.equal(await page.locator('lesson-video iframe').getAttribute('src'),null);
  const slideReports=await inspectEverySlide(page);const canvasIssues=slideReports.flatMap(s=>findCanvasIssues({...s,viewport:{width:1600,height:900}}));assert.deepEqual(canvasIssues,[],label);
  const paint=[];
  const luminance=rgb=>{const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>{n/=255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
  for(let i=0;i<expectedIds.length;i++){await page.evaluate(i=>Reveal.slide(i),i);const colors=await page.evaluate(()=>{const slide=Reveal.getCurrentSlide(),c=getComputedStyle(slide.querySelector('.ticket')||slide.querySelector('.slide-content'));return{fg:c.color,bg:c.backgroundColor};});assert(!colors.bg.endsWith(', 0)'),`${expectedIds[i]}: transparent reading surface`);const a=luminance(colors.fg),b=luminance(colors.bg),contrast=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);assert(contrast>=4.5,`${expectedIds[i]}: contrast ${contrast}`);paint.push({id:expectedIds[i],...colors,contrast});}
  await page.evaluate(()=>Reveal.slide(0));await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getCurrentSlide().id),'skutki');await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('s');assert.equal(await page.evaluate(()=>Reveal.getConfig().showNotes),'inline');assert((await page.locator('section.present aside.notes').innerText()).includes('0,5 min'));
  const notesGeometry=[];
  for(const [width,height]of [[1024,768],[1280,720],[1920,1080]]){await page.setViewportSize({width,height});await page.waitForTimeout(160);const g=await page.evaluate(()=>{const r=e=>{const x=e.getBoundingClientRect();return{x:x.x,y:x.y,w:x.width,h:x.height};};return{slide:r(Reveal.getCurrentSlide()),notes:r(document.querySelector('.speaker-notes'))};});assert(g.slide.x>=-1&&g.slide.y>=-1&&g.slide.x+g.slide.w<=width+1&&g.slide.y+g.slide.h<=height+1);assert(g.slide.x+g.slide.w<=g.notes.x+1||g.slide.y+g.slide.h<=g.notes.y+1);notesGeometry.push({width,height,...g});}
  await page.setViewportSize({width:1600,height:900});await page.keyboard.press('s');
  await page.keyboard.press('b');assert(await page.evaluate(()=>Reveal.isPaused()));await page.keyboard.press('b');
  const lightboxes=[];
  for(const [i,id]of expectedIds.entries()){
   await page.evaluate(i=>Reveal.slide(i,0,-1),i);await page.waitForFunction(id=>location.hash===`#/${id}`,id);await page.waitForTimeout(55);
   const images=page.locator(`#${id} img`);
   for(let j=0;j<await images.count();j++){
    const image=images.nth(j),src=await image.getAttribute('src');assert.equal(await image.getAttribute('tabindex'),'0');
    const modes=label==='live'?['click','Enter','tap']:['click'];
    for(const mode of modes){
     const beforeOpen=page.url();
     if(mode==='Enter'){await image.focus();await page.keyboard.press('Enter');}else if(mode==='tap')await image.tap();else await image.click();
     const modal=page.locator('dialog.lesson-image-lightbox');await modal.waitFor({state:'visible'});await modal.locator('img').evaluate(i=>i.decode());
     assert.equal(await modal.locator('.lesson-image-lightbox__caption').innerText(),'');assert(await modal.evaluate(d=>d.classList.contains('is-uncaptioned')));
     assert.equal(await modal.locator('img').getAttribute('src'),await image.evaluate(i=>i.currentSrc||i.src));
     const geometry=await modal.locator('img').evaluate(i=>{const r=i.getBoundingClientRect();return{fit:getComputedStyle(i).objectFit,natural:i.naturalWidth/i.naturalHeight,w:r.width,h:r.height,x:r.x,y:r.y};});assert.equal(geometry.fit,'contain');assert(geometry.natural>0);
     assert(geometry.x>=0&&geometry.y>=0&&geometry.x+geometry.w<=1601&&geometry.y+geometry.h<=901);
     const before=await page.evaluate(()=>Reveal.getCurrentSlide().id);await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getCurrentSlide().id),before);
     if(mode==='click'&&label==='live'&&changedIds.includes(id))await page.screenshot({path:path.join(output,`${id}-lightbox.png`)});
     await page.keyboard.press('Escape');assert.equal(await modal.evaluate(d=>d.open),false);assert(await image.evaluate(i=>document.activeElement===i));assert.equal(page.url(),beforeOpen);
    }
    lightboxes.push({id,src:src.startsWith('data:')?'embedded:'+createHash('sha256').update(src).digest('hex'):src,click:true,keyboard:label==='live',touch:label==='live',escape:true,focus_return:true});
   }
   if(label==='live'){await page.evaluate(()=>document.activeElement?.blur());await page.screenshot({path:path.join(output,`${String(i+1).padStart(2,'0')}-${id}.png`)});}
  }
  assert.equal(lightboxes.length,metrics.images.length);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);assert.deepEqual(httpErrors,[]);
  await context.close();return {...metrics,source_quotes:sources,images:metrics.images.map(i=>({...i,src:i.src.startsWith('data:')?'embedded':i.src})),lightboxes,paint,notesGeometry,canvas_issues:canvasIssues,errors,external_requests:external,http_errors:httpErrors};
 }
 evidence.live=await verify(`http://127.0.0.1:${server.address().port}/${lesson}/`,'live');
 evidence.offline=await verify(pathToFileURL(path.join(dir,portableName)).href,'offline');
 // Launcher verification uses intercepted transport, never claims video playback.
 const launcher=[];
 for(const mode of ['click','Enter']){
  const c=await browser.newContext({viewport:{width:1600,height:900}}),p=await c.newPage(),requests=[];
  await c.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)){requests.push(u);return route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>QA transport interception only — no video playback</title>'});}return route.continue();});
  await p.goto(pathToFileURL(path.join(dir,portableName)).href);await p.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');await p.evaluate(i=>Reveal.slide(i),expectedIds.indexOf('mur-film-wprowadzenie'));await p.waitForTimeout(120);
  assert.equal(await p.locator('lesson-video iframe').getAttribute('src'),null);assert.deepEqual(requests,[]);
  const frame=p.locator('lesson-video iframe'),button=p.locator('[data-video-play]');await button.waitFor({state:'visible'});
  if(mode==='Enter'){await button.focus();await p.keyboard.press('Enter');}else await button.click();
  const embed='https://www.youtube-nocookie.com/embed/jb5QR2cbdug?rel=0';await p.waitForFunction(u=>document.querySelector('lesson-video iframe').src===u,embed);assert.equal(await frame.getAttribute('src'),embed);assert.equal(await frame.isVisible(),true);assert.equal(await button.isVisible(),false);await p.waitForTimeout(120);assert.deepEqual(requests,[embed]);
  const fallback=p.locator('.film-alternative a');assert.equal(await fallback.getAttribute('target'),'_blank');assert.equal(await fallback.getAttribute('rel'),'noopener noreferrer');
  const popupPromise=p.waitForEvent('popup');await fallback.click();const popup=await popupPromise;await popup.waitForLoadState();assert.equal(popup.url(),'https://www.youtube.com/watch?v=jb5QR2cbdug');assert.equal(requests.at(-1),popup.url());
  launcher.push({mode,initial_iframe_src:null,initial_external_requests:[],activated_iframe_src:await frame.getAttribute('src'),requests,fallback_url:popup.url(),transport_intercepted:true,playback_verified:false});await c.close();
 }
 evidence.launcher=launcher;
 const cards=await Promise.all(expectedIds.map(async(id)=>{const i=expectedIds.indexOf(id);const file=path.join(output,`${String(i+1).padStart(2,'0')}-${id}.png`);return `<figure><img src="data:image/png;base64,${(await readFile(file)).toString('base64')}"><figcaption>${i+1}. ${id}</figcaption></figure>`;}));
 const page=await browser.newPage({viewport:{width:1600,height:550}});await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;font:17px sans-serif;background:#e1e6e8}.grid{display:grid;grid-template-columns:repeat(4,400px)}figure{margin:0;padding:5px}img{display:block;width:390px;height:219.375px}figcaption{padding:4px}</style><div class="grid">${cards.join('')}</div>`);await page.screenshot({path:path.join(output,'contact-sheet.png'),fullPage:true});await cp(path.join(output,'contact-sheet.png'),path.join(qa,'contact-sheet.png'));
}finally{await browser.close();await new Promise(r=>server.close(r));}
// Every slide is measured/captured; actual visual inspection and teacher acceptance are separate.
const revision=await presentationRevision({repoRoot:root,lessonDirectory:dir});
await writeFile(path.join(dir,'contract-review.json'),JSON.stringify({contractVersion:'1.0',presentationRevision:revision,browser:{completed:true,issues:[]},human:{completed:false,blockers:[],warnings:['Niezależny formalny przegląd i akceptacja nauczyciela pozostają otwarte.']}},null,2)+'\n');
const files=['slides.md','lesson.css','index.html','metadata.json','lesson.md','teacher-guide.md','student-summary.md','assessment.md','worksheet.md','README.md','reflection.md','sources.md','source-manifest.json','qa.mjs',portableName];
const hashes={};for(const f of files)hashes[f]=createHash('sha256').update(await readFile(path.join(dir,f))).digest('hex');
assert.equal(createHash('sha256').update(await readFile(oldPortable)).digest('hex'),oldPortableHash);
const modified=[];for(const name of [...files,'contract-review.json']){try{const previous=await readFile(path.join(privateDir,'baseline',name));if(!previous.equals(await readFile(path.join(dir,name))))modified.push(name);}catch(e){if(e.code==='ENOENT')modified.push(name);else throw e;}}
modified.push('qa/author-check.json','qa/contact-sheet.png','qa/check-contract.log','qa/check-composition.log');
const screenshotNames=(await readdir(output)).filter(n=>n.endsWith('.png'));
const sourceInputs=JSON.parse(await readFile(path.join(privateDir,'source-input-hashes.json'),'utf8'));
for(const [f,sha]of Object.entries({...sourceInputs.inputs,...sourceInputs.shared_read_only}))assert.equal(createHash('sha256').update(await readFile(f)).digest('hex'),sha,`read-only input changed: ${f}`);
const baseline=JSON.parse(await readFile(path.join(privateDir,'input-hashes.json'),'utf8'));
const oldExports=Object.entries(baseline.files).filter(([f])=>f.endsWith('-portable.html'));
for(const [f,sha]of oldExports)assert.equal(createHash('sha256').update(await readFile(f)).digest('hex'),sha,`old export changed: ${f}`);
const report={phase:'bounded-two-textbook-synthesis',generated_at:new Date().toISOString(),lesson_directory:dir,private_portable:path.join(dir,portableName),presentation_revision:revision,status:'automated_checks_passed_visual_review_separate',teacher_reviewed:true,teacher_accepted:false,source_reviewed:false,published:false,slide_count:expectedIds.length,note_count:evidence.live.notes,image_occurrences:evidence.live.images.length,unique_media_count:media.length,timing:{slide_minutes:times,core:times.reduce((a,b)=>a+b,0),wall_block:6.5,copying:6,individual_check:3,buffer,total:45,classroom_tested:false},quotes:{fulton_exact:true,article5_full_supplied_excerpt_exact:true},commands,browser:evidence,source_inputs:{baseline:path.join(privateDir,'input-hashes.json'),sources:path.join(privateDir,'source-input-hashes.json'),independent_extracts:path.join(privateDir,'independent-source-extracts.json')},media,sha256:hashes,screenshots:screenshotNames.map(n=>path.join(output,n)),contact_sheet:path.join(output,'contact-sheet.png'),review_screenshots:output,changed_slide_ids:changedIds,files_verified:files,files_modified:modified,scope:{instructional_changed:['berlin-blokada','nato-artykul-5'],timing_commentary_changed:['zimna-wojna','nato'],retained_film:'jb5QR2cbdug immediately before mur-1961',shared_runtime_changed:false,old_exports_preserved:oldExports,publication:false},visual_review:{completed:false,note:'Automatic run captures fresh screenshots only. Actual visual review is recorded separately after opening them; no inherited visual findings.'},limits:['No complete video audio review; earlier captions/image samples only.','Launcher requests intercepted: exact URL and fallback verified, not actual playback.','45-minute estimate is tight and not classroom tested.','No teacher acceptance or publication permission.']};
await writeFile(path.join(privateDir,'author-review.json'),JSON.stringify(report,null,2)+'\n');await writeFile(path.join(qa,'author-check.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.status,slides:report.slide_count,notes:report.note_count,media:report.unique_media_count,images:report.image_occurrences,offline_errors:evidence.offline.errors,offline_http:evidence.offline.external_requests,report:path.join(privateDir,'author-review.json')},null,2));
