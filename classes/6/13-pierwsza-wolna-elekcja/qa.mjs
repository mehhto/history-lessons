import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {localChromiumExecutable} from '../../../test/support/local-chromium.mjs';
import {inspectPresentation,findCanvasIssues} from '../../../scripts/render-probe.mjs';
const D=path.dirname(fileURLToPath(import.meta.url)),R=path.resolve(D,'../../..');
const story=JSON.parse(await readFile(path.join(D,'storyboard.json'),'utf8')),md=await readFile(path.join(D,'slides.md'),'utf8');
assert.equal(story.slides.length,24);assert.equal(story.slides.reduce((n,s)=>n+s.minutes,0)+story.buffer_minutes,38);assert(!md.includes('@@'));
assert.equal(md.split('\nnotes:\n').length-1,24);assert(md.indexOf('id="pytanie-do-zrodla"')<md.indexOf('id="zrodlo-artykuly"'));
const ev=JSON.parse(await readFile(path.join(D,'source-evidence.json'),'utf8'));assert(md.includes(ev.classroom_literal_quotes[0].text));assert.equal(ev.rulers.length,12);
const media=[...new Set([...md.matchAll(/src="(assets\/[^"]+)"/g)].map(x=>x[1]))];for(const m of media)await readFile(path.join(D,m));
const base='https://ai-agent.tail53435f.ts.net/classes/6/13-pierwsza-wolna-elekcja/';
for(const f of ['index.html','slides.md','lesson.css','metadata.json','worksheet.html','teacher-guide.html',...media]){const r=await fetch(base+f);assert.equal(r.status,200,f);assert(Buffer.from(await r.arrayBuffer()).equals(await readFile(path.join(D,f))),f+' preview mismatch');}
const O=path.join(R,'.hermes/reviews/6',path.basename(D));await mkdir(O,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(R)});const errors=[],issues=[],checks=[];
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');await p.evaluate(()=>Promise.all([...document.querySelectorAll('.slides img')].map(i=>i.decode())));
 await p.evaluate(()=>Reveal.configure({transition:'none',backgroundTransition:'none'}));assert.equal(await p.locator('.slides section[data-slide-canvas]').count(),24);
 let lightboxes=0;
 for(let i=0;i<story.slides.length;i++){
  await p.evaluate(i=>Reveal.slide(i),i);await p.waitForTimeout(40);
  const r=await inspectPresentation(p),cur=r.slides.find(s=>s.slide==='#'+story.slides[i].id);issues.push(...findCanvasIssues({...cur,viewport:r.viewport}));
  await p.screenshot({path:path.join(O,String(i+1).padStart(2,'0')+'-'+story.slides[i].id+'.png')});
  const im=p.locator('.present .slide-content img');
  if(await im.count()){
   await im.first().focus();await p.keyboard.press('Enter');const d=p.locator('dialog[open]');await d.waitFor({state:'visible'});await d.locator('img').evaluate(x=>x.decode());assert.equal(await d.locator('.lesson-image-lightbox__caption').innerText(),'');await p.keyboard.press('Escape');lightboxes++;
  }
 }
 await p.evaluate(()=>Reveal.slide(1));await p.keyboard.press('s');assert(await p.evaluate(()=>!!Reveal.getConfig().showNotes));assert((await p.locator('.speaker-notes').innerText()).includes('Brak potomstwa'));await p.keyboard.press('s');
 await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>Reveal.getIndices().h),2);await p.keyboard.press('b');assert(await p.evaluate(()=>Reveal.isPaused()));await p.keyboard.press('b');
 for(const v of [{width:1024,height:768},{width:1920,height:1080}]){await p.setViewportSize(v);for(const id of ['otwarcie','kandydaci','krolowie','zrodlo-artykuly','zadanie-umowy']){await p.evaluate(id=>Reveal.slide(Reveal.getSlides().findIndex(s=>s.id===id)),id);const r=await inspectPresentation(p);issues.push(...findCanvasIssues({...r.slides.find(s=>s.slide==='#'+id),viewport:r.viewport}));}checks.push(v);}
 await p.setViewportSize({width:900,height:1200});await p.goto(base+'worksheet.html');await p.emulateMedia({media:'print'});
 const paper=await p.locator('body').evaluate(x=>({height:x.scrollHeight,width:x.getBoundingClientRect().width,limit:273/25.4*96,text:x.innerText}));assert(paper.height<=paper.limit,'worksheet exceeds A4: '+JSON.stringify(paper));assert(!paper.text.includes('Ocenianie i klucz'));
 await p.screenshot({path:path.join(O,'worksheet.png'),fullPage:true});
 await p.emulateMedia({media:'screen'});await p.goto(base+'teacher-guide.html');await p.screenshot({path:path.join(O,'teacher-guide.png')});assert.equal(await p.locator('h2').filter({hasText:/^Slajd \d/}).count(),24);
 assert.deepEqual(errors,[]);
 const report={live_url:base,slides:24,core_minutes:36,buffer_minutes:2,used_assets:media.length,literal_quote_verified:true,rulers:12,full_review_viewport:{width:1280,height:720},critical_slide_viewports:checks,lightboxes,worksheet:paper,errors,issues};await writeFile(path.join(D,'qa-report.json'),JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({slides:24,lightboxes,worksheet_height:paper.height,errors,issues},null,2));assert.deepEqual(issues,[]);
}finally{await browser.close();}
