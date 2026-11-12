import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright';
import {localChromiumExecutable} from '../../../test/support/local-chromium.mjs';
import {startServer,inspectEverySlide} from '../../../scripts/render-check.mjs';
import {inspectPresentation,findCanvasIssues} from '../../../scripts/render-probe.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(dir,'../../..');
const metadata=JSON.parse(await readFile(path.join(dir,'metadata.json')));
const markdown=await readFile(path.join(dir,'slides.md'),'utf8');
const manifest=JSON.parse(await readFile(path.join(dir,'assets/manifest.json')));
const images=[...markdown.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);
assert.equal(metadata.duration_minutes,40);
assert.equal(15+2+16+3+2+2,40);
const storyboard=JSON.parse(await readFile(path.join(dir,'storyboard.json')));
assert.equal(storyboard.length,23);
assert.equal(storyboard.reduce((n,s)=>n+s.seconds,0),900);
assert.equal(metadata.postcard_work_minutes,16);
assert.deepEqual(storyboard.map(s=>s.id),[...markdown.matchAll(/<!-- \.slide: id="([^"]+)"/g)].map(m=>m[1]));
assert.deepEqual(storyboard.slice(14,20).map(s=>s.id),['pamiec-mieszkancow','dom-kultury','zalew-park','basen','pamiec','przyszlosc']);
assert(markdown.includes('DAWNIEJ · ok. 1918'));
assert(!images.some(s=>/archiwum-dworzec-1914|05-stacja|archiwum-krakowska|fabryka-dawniej/.test(s)));
assert.equal(images.length,27);
assert.equal(new Set(images).size,26);
assert.equal(new Set(manifest.map(x=>x.original_id)).size,25);
assert.deepEqual(new Set(images),new Set(manifest.map(x=>x.file)));
assert(manifest.every(x=>x.author&&x.date&&x.source_page&&x.license&&x.visually_reviewed));
const uploads=manifest.filter(x=>x.sha256);
assert.equal(uploads.length,9);
for(const x of uploads)assert.equal(createHash('sha256').update(await readFile(path.join(dir,x.file))).digest('hex'),x.sha256,'unaltered teacher upload');
assert.equal(markdown.split(/^---\s*$/m).length,23);
assert(markdown.split(/^---\s*$/m).every(s=>s.includes('\nnotes:\n')));
for(const block of markdown.split(/^---\s*$/m)){const body=block.split('\nnotes:')[0];assert(!/CC BY|CC0|Polona|Commons|UMiG|domena publiczna|sources\.md|https?:/.test(body),'brak kredytów na powierzchni ucznia');}
const guide=await readFile(path.join(dir,'teacher-guide.html'),'utf8');
assert.equal((guide.match(/<details>/g)||[]).length,23);
for(const x of manifest)assert(guide.includes(x.source_page.replaceAll('&','&amp;'))||guide.includes(x.source_page));
const evidence=path.join(root,'.hermes/reviews/4/04-wolbrom-700-lat');
await mkdir(evidence,{recursive:true});
const server=await startServer(root);
let browser;
const results=[],readback=[];
let live;
try{
  browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(root)});
  live=process.env.LESSON_LIVE_URL||`http://127.0.0.1:${server.address().port}/classes/4/04-wolbrom-700-lat/index.html`;
  for(const file of ['index.html','slides.md','lesson.css','metadata.json','teacher-guide.html','04-wolbrom-700-lat-portable.html',...new Set(images)]){
    const response=await fetch(new URL(file,live));
    assert.equal(response.status,200,`preview readback: ${file}`);
    assert(Buffer.from(await response.arrayBuffer()).equals(await readFile(path.join(dir,file))),`preview/local bytes: ${file}`);
    readback.push(file);
  }
  for(const mode of ['live','offline'])for(const [width,height]of [[1024,768],[1280,720],[1920,1080]]){
    const ctx=await browser.newContext({viewport:{width,height},hasTouch:width===1024}),p=await ctx.newPage();
    const errors=[],network=[];
    p.on('pageerror',e=>errors.push(e.message));
    p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
    if(mode==='offline'){
      await ctx.setOffline(true);
      p.on('request',r=>{if(/^https?:/.test(r.url()))network.push(r.url())});
    }
    await p.goto(mode==='live'?live:pathToFileURL(path.join(dir,'04-wolbrom-700-lat-portable.html')).href);
    await p.waitForFunction(()=>document.documentElement.dataset.presentationReady==='true');
    const slides=await inspectEverySlide(p),report=await inspectPresentation(p);
    const issues=slides.flatMap(s=>findCanvasIssues({...s,viewport:report.viewport}));
    assert.equal(slides.length,23);
    assert.deepEqual(issues,[],`${mode}/${width}: canvas`);
    assert.deepEqual(await p.locator('.reveal img').evaluateAll(xs=>xs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('alt'))),[]);
    await p.evaluate(()=>Reveal.slide(0));
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.evaluate(()=>Reveal.getIndices().h),1);
    let lightboxes=0;
    for(let i=0;i<23;i++){
      await p.evaluate(i=>Reveal.slide(i),i);
      await p.waitForTimeout(35);
      const imgs=p.locator('.reveal .present img'),count=await imgs.count();
      for(let n=0;n<count;n++){
        const expectedCredit=await imgs.nth(n).evaluate(im=>im.closest('figure').querySelector('figcaption').innerText.replace(/\s+/g,' ').trim());
        const target=imgs.nth(n),url=p.url();
        if(width===1024)await target.tap();
        else if(width===1920){await target.focus();await p.keyboard.press((i+n)%2?'Enter':'Space');}
        else await target.click();
        const dialog=p.locator('dialog[open]');
        await dialog.waitFor({state:'visible'});
        assert(await dialog.locator('img').evaluate(im=>im.complete&&im.naturalWidth>0));
        assert(!(await dialog.innerText()).includes(expectedCredit));
        assert.equal(p.url(),url,'lightbox remains in this tab');
        assert.equal(await dialog.locator('.lesson-image-lightbox__caption').innerText(),'');
        assert(!(await dialog.locator('.lesson-image-lightbox__hint').isVisible()));
        const geometry=await dialog.locator('img').evaluate(im=>{const r=im.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height,ratio:im.naturalWidth/im.naturalHeight};});
        assert(geometry.x>=0&&geometry.y>=0&&geometry.right<=width+1&&geometry.bottom<=height+1);
        assert.equal(await dialog.locator('img').evaluate(im=>getComputedStyle(im).objectFit),'contain','uncropped natural aspect ratio inside viewport box');
        assert(geometry.w>=width-64&&geometry.h>=height-64,'uncaptioned lightbox uses available viewport');
        const id=await p.locator('.reveal section.present[data-slide-canvas]').getAttribute('id');
        if(['dworzec-dawniej-dzis','pamiec-mieszkancow'].includes(id)&&width===1280)await p.screenshot({path:path.join(evidence,`${mode}-${id}-${n}-lightbox.png`)});
        await p.keyboard.press('Escape');
        assert.equal(await p.locator('dialog[open]').count(),0);
        await p.waitForFunction(im=>document.activeElement===im,await target.elementHandle());
        lightboxes++;
      }
    }
    assert.equal(lightboxes,27);
    await p.evaluate(()=>Reveal.slide(0));
    await p.keyboard.press('s');
    await p.waitForTimeout(150);
    const notes=await p.evaluate(()=>{
      const s=Reveal.getCurrentSlide().getBoundingClientRect(),n=document.querySelector('.speaker-notes');
      return {show:Reveal.getConfig().showNotes,slide:{x:s.x,y:s.y,right:s.right,bottom:s.bottom},panel:n?{x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,width:n.getBoundingClientRect().width,text:n.innerText.length}:null};
    });
    assert(notes.show&&notes.panel?.width>0&&notes.panel?.text>50);
    assert(notes.slide.x>=-2&&notes.slide.y>=-2&&notes.slide.right<=width+2&&notes.slide.bottom<=height+2&&(notes.slide.right<=notes.panel.x+2||notes.slide.bottom<=notes.panel.y+2),JSON.stringify(notes));
    await p.screenshot({path:path.join(evidence,`${mode}-${width}-notes.png`)});
    await p.keyboard.press('s');
    assert.equal(await p.evaluate(()=>Reveal.getConfig().showNotes),false);
    assert.deepEqual(errors,[]);
    assert.deepEqual(network,[]);
    results.push({mode,width,height,slides:slides.length,images:27,lightboxes,issues,errors,network,notes});
    await ctx.close();
  }
  const ctx=await browser.newContext();
  await ctx.setOffline(true);
  const p=await ctx.newPage();
  await p.goto(pathToFileURL(path.join(dir,'teacher-guide.html')).href);
  await p.locator('details summary').first().click();
  assert(await p.locator('details').first().getAttribute('open')!==null);
  assert(await p.locator('#sources').innerText().then(s=>s.includes('CC BY-SA 4.0')));
  await p.screenshot({path:path.join(evidence,'teacher-guide.png'),fullPage:false});
  await ctx.close();
  await writeFile(path.join(dir,'qa-report.json'),JSON.stringify({live_url:live,results,teacher_guide_offline:true,image_files:26,image_occurrences:27,original_images:25,duration_minutes:40,narration_seconds:900,postcard_work_minutes:16,unaltered_uploads:uploads.length,preview_readback:readback},null,2)+'\n');
  console.log(`PASS: 23 slajdy, 25 oryginałów; live/offline × 3 viewporty, ${results.reduce((n,r)=>n+r.lightboxes,0)} lightboxy, notatki i przewodnik offline.`);
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
