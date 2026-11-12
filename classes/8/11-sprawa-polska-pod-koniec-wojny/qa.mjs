import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
import {localChromiumExecutable} from '../../../test/support/local-chromium.mjs';
import {inspectEverySlide} from '../../../scripts/render-check.mjs';
import {inspectPresentation,findCanvasIssues} from '../../../scripts/render-probe.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../..');
const story=JSON.parse(await readFile(path.join(dir,'storyboard.json'),'utf8'));
const md=await readFile(path.join(dir,'slides.md'),'utf8');
const blocks=md.split(/^---\s*$/m),ids=story.slides.map(x=>x.id);
assert.equal(blocks.length,28);assert.equal(story.slides.reduce((n,x)=>n+x.minutes,0),35.5);
assert.deepEqual([...md.matchAll(/\.slide: id="([^"]+)"/g)].map(m=>m[1]),ids);
assert(ids.indexOf('manifest-pytania')<ids.indexOf('manifest'));assert(ids.indexOf('testament-pytania')<ids.indexOf('testament'));
assert.equal(ids.filter(x=>/^notatka-/.test(x)).length,3);
assert(md.includes('POLSKI KOMITET WYZWOLENIA NARODOWEGO'));assert(md.includes('12. Oparcie powszechnego'));
for(const b of blocks)assert(b.includes('\nnotes:\n'));
const media=[...new Set([...md.matchAll(/src="(assets\/[^"]+)"/g)].map(m=>m[1]))];
for(const f of media)await readFile(path.join(dir,f));
const base='https://ai-agent.tail53435f.ts.net/classes/8/11-sprawa-polska-pod-koniec-wojny/';
for(const f of ['index.html','slides.md','lesson.css','metadata.json',...media]){const r=await fetch(base+f);assert.equal(r.status,200,f);assert(Buffer.from(await r.arrayBuffer()).equals(await readFile(path.join(dir,f))),'preview bytes '+f);}
const out=path.join(root,'.hermes/reviews/8',path.basename(dir));await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(root)});const results=[];
try{
for(const [width,height]of [[1024,768],[1280,720],[1920,1080]]){
 const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
 await p.goto(base);await p.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');await p.evaluate(()=>Promise.all([...document.querySelectorAll('.slides img')].map(x=>x.decode())));
 const slides=await inspectEverySlide(p),report=await inspectPresentation(p),issues=slides.flatMap(s=>findCanvasIssues({...s,viewport:report.viewport}));
 assert.equal(slides.length,28);assert.deepEqual(issues,[],`${width} geometry`);
 assert.deepEqual(await p.locator('.slides img').evaluateAll(xs=>xs.filter(x=>!x.complete||!x.naturalWidth).map(x=>x.alt)),[]);
 const textstyle=await p.locator('#testament .source-columns p').first().evaluate(e=>({font:parseFloat(getComputedStyle(e).fontSize),variant:getComputedStyle(e).fontVariant,transform:getComputedStyle(e).textTransform}));assert(textstyle.font>=22);assert.equal(textstyle.transform,'none');
 let lightboxes=0;
 for(let i=0;i<28;i++){
  await p.evaluate(i=>Reveal.slide(i),i);await p.waitForTimeout(50);
  const imgs=p.locator('.present .slide-content img');
  for(let j=0;j<await imgs.count();j++){
   const im=imgs.nth(j);await im.focus();await p.keyboard.press('Enter');const dialog=p.locator('dialog[open]');await dialog.waitFor({state:'visible'});await dialog.locator('img').evaluate(x=>x.decode());
   assert.equal(await dialog.locator('.lesson-image-lightbox__caption').innerText(),'');
   const r=await dialog.locator('img').boundingBox();assert(r.x>=-1&&r.y>=-1&&r.x+r.width<=width+1&&r.y+r.height<=height+1);await p.keyboard.press('Escape');assert.equal(await p.locator('dialog[open]').count(),0);lightboxes++;
  }
 }
 await p.evaluate(()=>Reveal.slide(0));await p.keyboard.press('ArrowRight');assert.equal(await p.evaluate(()=>Reveal.getIndices().h),1);
 await p.keyboard.press('s');await p.waitForTimeout(200);
 const notes=await p.evaluate(()=>{const a=Reveal.getCurrentSlide().getBoundingClientRect(),n=document.querySelector('.speaker-notes'),b=n.getBoundingClientRect();return {show:Reveal.getConfig().showNotes,text:n.innerText.length,a:{x:a.x,y:a.y,right:a.right,bottom:a.bottom},b:{x:b.x,y:b.y,right:b.right,bottom:b.bottom}};});
 assert(notes.show&&notes.text>30);assert(notes.a.x>=-2&&notes.a.y>=-2&&notes.a.right<=width+2&&notes.a.bottom<=height+2);assert(notes.a.right<=notes.b.x+2||notes.a.bottom<=notes.b.y+2,JSON.stringify(notes));
 await p.screenshot({path:path.join(out,`notes-${width}.png`)});await p.keyboard.press('s');
 if(width===1280){for(const id of ['mapa-teheran','polska-lubelska','manifest-pytania','testament','podsumowanie']){await p.evaluate(id=>Reveal.slide(Reveal.getSlides().findIndex(x=>x.id===id)),id);await p.screenshot({path:path.join(out,`final-${id}.png`)});}}
 assert.deepEqual(errors,[]);results.push({width,height,slides:28,lightboxes,issues,errors,notes});await ctx.close();
}
await writeFile(path.join(dir,'qa-report.json'),JSON.stringify({live_url:base,preview_bytes_verified:true,core_minutes:35.5,buffer_minutes:2,optional_film_minutes:2.5,results},null,2)+'\n');
console.log('PASS:28slides; live×3viewports; '+results.reduce((n,x)=>n+x.lightboxes,0)+'lightboxes; notes,keyboard,images and sourcegeometry.');
}finally{await browser.close();}
