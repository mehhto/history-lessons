/* Adapted from ../13-pierwsza-wolna-elekcja/qa.mjs; shared render-probe is the geometry authority. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {localChromiumExecutable} from '../../../test/support/local-chromium.mjs';
import {inspectPresentation,findCanvasIssues} from '../../../scripts/render-probe.mjs';
import {compositionIssues,slideBlocks} from '../../../scripts/check-slide-composition.mjs';
const D=path.dirname(fileURLToPath(import.meta.url)),R=path.resolve(D,'../../..'),pilot=process.argv.includes('--pilot'),notesOnly=process.argv.includes('--notes-only');
const story=JSON.parse(await readFile(path.join(D,'storyboard.json'),'utf8')),md=await readFile(path.join(D,'slides.md'),'utf8');
assert.equal(story.slides.length,28);assert.equal(story.slides.reduce((n,s)=>n+s.minutes,0)+story.buffer_minutes,38);assert.equal(md.split('\nnotes:\n').length-1,28);
for(const b of md.split('\n---\n'))assert(/<img[^>]+src="assets\//.test(b.split('\nnotes:')[0]),'missing illustration');
assert.equal((md.match(/data-layout="task-board"/g)||[]).length,3);assert.equal((md.match(/class="notebook"/g)||[]).length,2);
assert.deepEqual(slideBlocks(md).flatMap(compositionIssues),[]);
const meta=JSON.parse(await readFile(path.join(D,'metadata.json'),'utf8'));assert.equal(meta.teacher_accepted,false);assert.equal(meta.pdf_exported,false);assert.equal(meta.publication_authorization.visibility,'public');assert.equal(meta.publication_authorization.unresolved_rights_acknowledged,true);
const media=[...new Set([...md.matchAll(/(?:src|data-lightbox-src)="(assets\/[^"]+)"/g)].map(x=>x[1]))];for(const m of media)await readFile(path.join(D,m));
const base='https://ai-agent.tail53435f.ts.net/classes/6/14-wojny-z-rosja/';
const readback=[];
for(const f of ['index.html','slides.md','lesson.css','metadata.json','lesson.md','worksheet.md','sources.md','assessment.md','reflection.md','storyboard.json','source-evidence.json','assets/manifest.json','teacher-guide.md','teacher-guide.html','student-summary.md','student-summary.html',...media]){const r=await fetch(base+f);assert.equal(r.status,200,f);assert(Buffer.from(await r.arrayBuffer()).equals(await readFile(path.join(D,f))),f+' preview mismatch');readback.push(f);}
const O=path.join(R,'.hermes/reviews/6',path.basename(D));await mkdir(O,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(R)});const errors=[],issues=[],checks=[],lightboxes=[],fonts=[],notes=[],overflows=[];
let summaryPaper=null;
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
 const requests=[];p.on('request',r=>{if(!r.url().startsWith('https://ai-agent.tail53435f.ts.net/'))requests.push(r.url())});
 await p.goto(base,{waitUntil:'networkidle'});await p.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');await p.evaluate(()=>Promise.all([...document.querySelectorAll('.slides img')].map(i=>i.decode())));
 await p.evaluate(()=>Reveal.configure({transition:'none',backgroundTransition:'none'}));assert.equal(await p.locator('.slides section[data-slide-canvas]').count(),28);
 const vv=pilot?[{width:1280,height:720}]:[{width:1280,height:720},{width:1024,height:768},{width:1920,height:1080}];
 for(const v of vv){await p.setViewportSize(v);const targets=notesOnly?story.slides.filter(s=>['notatka-1','notatka-2'].includes(s.id)):pilot?story.slides.filter(s=>['otwarcie','baltyk','notatka-1','wladyslaw','trzy-zdania','najwieksza'].includes(s.id)):story.slides;
  for(const s of targets){
   await p.evaluate(i=>Reveal.slide(i),s.number-1);await p.waitForTimeout(55);
   const r=await inspectPresentation(p),cur=r.slides.find(x=>x.slide==='#'+s.id);issues.push(...findCanvasIssues({...cur,viewport:r.viewport}).map(t=>`${v.width}: ${t}`));
   const ov=await p.locator('.present .slide-content').evaluate(x=>[...x.querySelectorAll('p,h1,h2,h3,li,figcaption,summary,div')].filter(n=>n.clientWidth>0&&n.clientHeight>0&&getComputedStyle(n).display!=='inline'&&(n.scrollWidth>n.clientWidth+2||n.scrollHeight>n.clientHeight+2)).map(n=>({tag:n.tagName,class:n.className,scroll:[n.scrollWidth,n.scrollHeight],client:[n.clientWidth,n.clientHeight]})));if(ov.length)overflows.push({viewport:v,id:s.id,nodes:ov});
   const badImages=await p.locator('.present .slide-content img').evaluateAll(ii=>ii.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(badImages,[]);
   if(v.width===1280)await p.screenshot({path:path.join(O,String(s.number).padStart(2,'0')+'-'+s.id+'.png')});
   if(!pilot){
    const ims=p.locator('.present .slide-content img');for(let j=0;j<await ims.count();j++){
     const im=ims.nth(j);await im.focus();await p.keyboard.press('Enter');const dialog=p.locator('dialog[open]');await dialog.waitFor({state:'visible'});await dialog.locator('img').evaluate(x=>x.decode());assert.equal(await dialog.locator('.lesson-image-lightbox__caption').innerText(),'');
     const rect=await dialog.boundingBox();assert(rect.x>=-1&&rect.y>=-1&&rect.x+rect.width<=v.width+1&&rect.y+rect.height<=v.height+1);const index=await p.evaluate(()=>Reveal.getIndices().h);await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>Reveal.getIndices().h),index);
     if(v.width===1280&&['baltyk','wyprawy','dywilino','najwieksza','notatka-1','notatka-2'].includes(s.id))await p.screenshot({path:path.join(O,s.id+'-lightbox.png')});
     await p.keyboard.press('Escape');assert.equal(await p.locator('dialog[open]').count(),0);assert(await im.evaluate(x=>document.activeElement===x));lightboxes.push({viewport:v.width,id:s.id,image:j});
    }
   }
   checks.push({viewport:v.width,id:s.id});
  }
  fonts.push({viewport:v.width,...await p.evaluate(()=>({ready:document.fonts.status,body:document.fonts.check('28px CampaignSans','Zażółć gęślą jaźń'),heading:document.fonts.check('700 42px CampaignSerif','Łódź Żółkiewski')}))});
  if(!pilot&&!notesOnly){
   await p.evaluate(()=>Reveal.slide(1));await p.keyboard.press('s');assert(await p.evaluate(()=>!!Reveal.getConfig().showNotes));
   const nr=await p.evaluate(()=>{const r=Reveal.getCurrentSlide().getBoundingClientRect(),n=document.querySelector('.speaker-notes').getBoundingClientRect();return {slide:{x:r.x,y:r.y,right:r.right,bottom:r.bottom},notes:{x:n.x,y:n.y,right:n.right,bottom:n.bottom},text:document.querySelector('.speaker-notes').innerText}});
   assert(nr.text.includes('podwójnego wyboru'));assert(nr.slide.x>=0&&nr.slide.y>=0&&nr.slide.right<=v.width+1&&nr.slide.bottom<=v.height+1);assert(nr.slide.right<=nr.notes.x+1||nr.slide.bottom<=nr.notes.y+1,'notes overlap');notes.push({viewport:v.width,...nr});await p.screenshot({path:path.join(O,`notes-${v.width}.png`)});await p.keyboard.press('s');
  }
 }
 if(!pilot&&!notesOnly){
  await p.setViewportSize({width:1280,height:720});await p.evaluate(()=>Reveal.slide(6));const detail=p.locator('.present details');assert.equal(await detail.getAttribute('open'),null);await detail.locator('summary').focus();await p.keyboard.press('Enter');assert.notEqual(await detail.getAttribute('open'),null);let r=await inspectPresentation(p);issues.push(...findCanvasIssues({...r.slides.find(s=>s.slide==='#jam'),viewport:r.viewport}));await p.screenshot({path:path.join(O,'jam-answer.png')});await p.keyboard.press('Enter');
  await p.evaluate(()=>Reveal.slide(1));await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>Reveal.getIndices().h),2);await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>Reveal.getIndices().h),1);await p.keyboard.press('b');assert(await p.evaluate(()=>Reveal.isPaused()));await p.keyboard.press('b');await p.keyboard.press('f');assert(await p.evaluate(()=>!!document.fullscreenElement));await p.keyboard.press('f');
  await p.goto(base+'teacher-guide.html');assert.equal(await p.locator('h2').filter({hasText:/^Slajd \d/}).count(),28);await p.screenshot({path:path.join(O,'teacher-guide.png')});
  await p.goto(base+'student-summary.html');assert((await p.locator('main').innerText()).includes('20 łanów'));await p.screenshot({path:path.join(O,'student-summary.png')});await p.setViewportSize({width:900,height:1200});await p.emulateMedia({media:'print'});summaryPaper=await p.locator('body').evaluate(x=>({width:x.getBoundingClientRect().width,height:x.scrollHeight,limit:273/25.4*96}));await p.screenshot({path:path.join(O,'student-summary-print.png'),fullPage:true});assert(summaryPaper.height<=summaryPaper.limit,'student summary exceeds one A4');
 }
 const report={summaryPaper,adapted_from:'classes/6/13-pierwsza-wolna-elekcja/qa.mjs',geometry_helper:'scripts/render-probe.mjs',mode:notesOnly?'graphic-note-revision':pilot?'pilot':'final',live_url:base,slides:28,core_minutes:36,buffer_minutes:2,total_minutes:38,readback,viewports:vv,checks,illustrated_slides:28,notes_slides:28,oral_activities:3,graphic_notes:2,lightboxes,fonts,notes,keyboard:pilot?'not yet exercised':'arrows/S/B/F/Enter/Escape and focus restoration passed',automatic_external_requests:requests,errors,issues,overflows,review_directory:O};
 await writeFile(path.join(D,notesOnly?'qa-notes-revision.json':pilot?'qa-pilot.json':'qa-report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode:report.mode,checks:checks.length,lightboxes:lightboxes.length,errors,issues,overflows},null,2));
 assert.deepEqual(errors,[]);assert.deepEqual(issues,[]);assert.deepEqual(overflows,[]);assert.deepEqual(requests,[]);assert(fonts.every(x=>x.ready==='loaded'&&x.body&&x.heading));
}finally{await browser.close();}
