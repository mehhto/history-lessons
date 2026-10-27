import assert from 'node:assert/strict';
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
assert.equal(new Set(images).size,17);
assert.equal(new Set(manifest.map(x=>x.original_id)).size,16);
assert.deepEqual(new Set(images),new Set(manifest.map(x=>x.file)));
assert(manifest.every(x=>x.author&&x.date&&x.source_page&&x.license&&x.visually_reviewed));
assert.equal(markdown.split(/^---\s*$/m).length,17);
assert(markdown.split(/^---\s*$/m).every(s=>s.includes('\nnotes:\n')));
const guide=await readFile(path.join(dir,'teacher-guide.html'),'utf8');
assert.equal((guide.match(/<details>/g)||[]).length,16);
for(const x of manifest)assert(guide.includes(x.source_page.replaceAll('&','&amp;'))||guide.includes(x.source_page));
const evidence=path.join(root,'.hermes/reviews/4/04-wolbrom-700-lat');
await mkdir(evidence,{recursive:true});
const server=await startServer(root);
let browser;
const results=[];
try{
  browser=await chromium.launch({headless:true,executablePath:await localChromiumExecutable(root)});
  const live=process.env.LESSON_LIVE_URL||`http://127.0.0.1:${server.address().port}/classes/4/04-wolbrom-700-lat/index.html`;
  for(const mode of ['live','offline'])for(const [width,height]of [[1024,768],[1280,720],[1920,1080]]){
    const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage();
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
    assert.equal(slides.length,17);
    assert.deepEqual(issues,[],`${mode}/${width}: canvas`);
    assert.deepEqual(await p.locator('.reveal img').evaluateAll(xs=>xs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('alt'))),[]);
    await p.evaluate(()=>Reveal.slide(0));
    await p.keyboard.press('ArrowRight');
    assert.equal(await p.evaluate(()=>Reveal.getIndices().h),1);
    let lightboxes=0;
    for(let i=0;i<17;i++){
      await p.evaluate(i=>Reveal.slide(i),i);
      await p.waitForTimeout(35);
      const imgs=p.locator('.reveal .present img'),count=await imgs.count();
      for(let n=0;n<count;n++){
        const expectedCredit=await imgs.nth(n).evaluate(im=>im.closest('figure').querySelector('figcaption').innerText.replace(/\s+/g,' ').trim());
        await imgs.nth(n).click();
        const dialog=p.locator('dialog[open]');
        await dialog.waitFor({state:'visible'});
        assert(await dialog.locator('img').evaluate(im=>im.complete&&im.naturalWidth>0));
        assert(!(await dialog.innerText()).includes(expectedCredit));
        if(i===9&&width===1280)await p.screenshot({path:path.join(evidence,`${mode}-lightbox.png`)});
        await p.keyboard.press('Escape');
        assert.equal(await p.locator('dialog[open]').count(),0);
        lightboxes++;
      }
    }
    assert.equal(lightboxes,17);
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
    results.push({mode,width,height,slides:slides.length,images:17,lightboxes,issues,errors,network,notes});
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
  await writeFile(path.join(dir,'qa-report.json'),JSON.stringify({live_url:live,results,teacher_guide_offline:true},null,2)+'\n');
  console.log(`PASS: 17 slajdów, 16 oryginałów; live/offline × 3 viewporty, ${results.reduce((n,r)=>n+r.lightboxes,0)} lightboxy, notatki i przewodnik offline.`);
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
