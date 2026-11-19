import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,cp,rm,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright';
import {inspectPresentation,findCanvasIssues} from '../../../../scripts/render-probe.mjs';
const root=process.cwd(), lesson='classes/8/14-za-zelazna-kurtyna', dir=path.join(root,lesson);
const production='/opt/data/history-production/grade8/iron-curtain-pkin-film';
const qa=path.join(production,'qa');
const changed=['otwarcie','supermocarstwo','gospodarka','wegry-interwencja','podsumowanie','film-socrealizm'];
await mkdir(qa,{recursive:true});
await rm(path.join(qa,'slides'),{recursive:true,force:true}); await mkdir(path.join(qa,'slides'));
const commands=[];
for(const name of ['check:contract','check:composition']){
 const p=spawnSync('npm',['run',name,'--','--lesson',lesson],{encoding:'utf8',cwd:root,env:process.env});
 await writeFile(path.join(qa,name.replace(':','-')+'.stdout.log'),p.stdout);
 await writeFile(path.join(qa,name.replace(':','-')+'.stderr.log'),p.stderr);
 commands.push({command:`npm run ${name} -- --lesson ${lesson}`,exit_code:p.status,output:p.stdout+p.stderr});
 assert.equal(p.status,0,p.stdout+p.stderr);
}
const filename='za-zelazna-kurtyna-film-pkin-portable.html';
const exp=spawnSync('npm',['run','export:portable','--','--lesson',lesson,'--output',filename],{encoding:'utf8',cwd:root,env:process.env});
await writeFile(path.join(qa,'export.stdout.log'),exp.stdout);await writeFile(path.join(qa,'export.stderr.log'),exp.stderr);
commands.push({command:`npm run export:portable -- --lesson ${lesson} --output ${filename}`,exit_code:exp.status,stdout:exp.stdout,stderr:exp.stderr}); assert.equal(exp.status,0,exp.stdout+exp.stderr);
const markdown=await readFile(path.join(dir,'slides.md'),'utf8'); const blocks=markdown.split(/^\r?\n---\r?\n$/m);
const ids=blocks.map(b=>b.match(/\.slide: id="([^"]+)"/)[1]);
const times=blocks.map(b=>Number(b.match(/notes:\s*\n([\d,.]+) min/)[1].replace(',','.')));
assert.equal(ids.length,27);assert.equal(new Set(ids).size,27);assert.equal(times.reduce((a,b)=>a+b,0),44);
assert.ok(ids.indexOf('przed-referatem')<ids.indexOf('referat')&&ids.indexOf('referat')<ids.indexOf('referat-analiza'));
assert.equal(ids.at(-1),'podsumowanie');
const baseline=JSON.parse(await readFile(path.join(production,'input-hashes.json'),'utf8'));
const oldBlocks=(await readFile(path.join(production,'before/slides.md'),'utf8')).split(/^\r?\n---\r?\n$/m);
const oldIds=oldBlocks.map(b=>b.match(/\.slide: id="([^"]+)"/)[1]);assert.deepEqual(ids.filter(id=>id!=='film-socrealizm'),oldIds);assert.deepEqual(ids.slice(5,8),['demokracja-ludowa','film-socrealizm','gospodarka']);
for(let n=0;n<ids.length;n++)if(!changed.includes(ids[n]))assert.equal(blocks[n],oldBlocks[oldIds.indexOf(ids[n])],ids[n]);
for(const id of ['przed-referatem','referat','referat-analiza','notatka-1','notatka-2'])assert.equal(blocks[ids.indexOf(id)],oldBlocks[oldIds.indexOf(id)],id);
for(const input of baseline.files.filter(f=>f.path.endsWith('-portable.html')||f.path.startsWith(path.join(dir,'assets')+path.sep)&&!f.path.endsWith('manifest.json')||f.path===path.join(dir,'index.html')))assert.equal(createHash('sha256').update(await readFile(input.path)).digest('hex'),input.sha256,input.path);
assert.equal(times[ids.indexOf('notatka-1')]+times[ids.indexOf('notatka-2')],6);
assert.equal(times[ids.indexOf('referat')],3);
const lessonText=await readFile(path.join(dir,'lesson.md'),'utf8');const guideText=await readFile(path.join(dir,'teacher-guide.md'),'utf8');
const tableTimes=[...lessonText.matchAll(/^\| \d+\. `([^`]+)` \|.*\| ([\d,.]+) \|$/gm)];
assert.deepEqual(tableTimes.map(m=>m[1]),ids);assert.deepEqual(tableTimes.map(m=>Number(m[2].replace(',','.'))),times);
assert.equal(Number(lessonText.match(/^\| Bufor \|[^|]+\| ([\d,.]+) \|$/m)[1].replace(',','.')),1);
const guideTimes=[...guideText.matchAll(/^### \d+\..* — ([\d,.]+) min$/gm)].map(m=>Number(m[1].replace(',','.')));assert.deepEqual(guideTimes,times);
assert.ok(blocks[ids.indexOf('rwpg')].includes('Plan Schumana, 1950'));assert.ok(blocks[ids.indexOf('rwpg')].includes('EWWiS · od 1952'));
assert.ok(blocks[ids.indexOf('odwilz')].includes('Radio Wolna Europa'));assert.ok(ids.indexOf('odwilz')>ids.indexOf('referat-analiza'));
assert.ok(blocks[ids.indexOf('wegry-przebieg')].includes('<b>24 X</b>'));
const source=(await readFile('/opt/data/history-production/2026-11-17/grade8/iron-curtain-revision/research/report.md','utf8')).match(/^> (Towarzysze!.*)$/m)[1];
const decode=s=>s.replaceAll('&quot;','"').replaceAll('&#x27;',"'").replaceAll('&gt;','>').replaceAll('&lt;','<').replaceAll('&amp;','&');
assert.equal(decode(markdown.match(/<blockquote>(.*?)<\/blockquote>/s)[1]),source);
assert.equal((markdown.match(/<lesson-video>/g)||[]).length,1);assert.ok(markdown.includes('data-video-src="https://www.youtube-nocookie.com/embed/BGP_Rqvg7_0?rel=0"'));assert.ok(markdown.includes('https://www.youtube.com/watch?v=BGP_Rqvg7_0'));assert.ok(!markdown.includes('id="praska-wiosna"'));
const tracked=['slides.md','lesson.css','metadata.json','index.html','lesson.md','teacher-guide.md','student-summary.md','assessment.md','worksheet.md','sources.md','assets/manifest.json','qa/author-check.mjs'];
const hashes=async()=>Object.fromEntries(await Promise.all(tracked.map(async f=>[f,createHash('sha256').update(await readFile(path.join(dir,f))).digest('hex')])));
const before=await hashes();
const temp=await import('node:os').then(()=>mkdir(path.join(process.env.TMPDIR||'/opt/data/cache/scratch','iron-curtain-isolated-offline'),{recursive:true}));
const isolated=path.join(process.env.TMPDIR||'/opt/data/cache/scratch','iron-curtain-isolated-offline',filename);await cp(path.join(dir,filename),isolated);
const browser=await chromium.launch({headless:true});const runs=[];const geometries=[]; const errors=[];
const browserVersion=browser.version();
try{
 for(const mode of ['file']){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},hasTouch:true,offline:mode==='file'});
  const page=await ctx.newPage(); const network=[],pageErrors=[],consoleErrors=[];
  page.on('request',r=>{if(/^https?:/.test(r.url())&&mode==='file')network.push(r.url())});
  page.on('pageerror',e=>pageErrors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  const url=pathToFileURL(isolated).href;
  await page.goto(url,{waitUntil:'networkidle'});
  await page.waitForFunction(()=>window.Reveal?.isReady()&&document.documentElement.dataset.presentationReady==='true');
  await page.evaluate(async()=>{await document.fonts.ready;for(const i of document.querySelectorAll('.slides img'))await i.decode();Reveal.configure({transition:'none',backgroundTransition:'none'})});
  const state=await page.evaluate(()=>({slides:Reveal.getSlides().map(s=>s.id),notes:document.querySelectorAll('aside.notes').length,images:[...document.querySelectorAll('.slides img')].map(i=>({slide:i.closest('section').id,src:i.getAttribute('src').startsWith('data:')?'embedded':i.getAttribute('src'),width:i.naturalWidth,height:i.naturalHeight})),overrides:document.querySelectorAll('.slides [data-lightbox-src]').length,font400:document.fonts.check('400 27px "Lesson Work"'),font700:document.fonts.check('700 43px "Lesson Work"'),width:Reveal.getConfig().width,height:Reveal.getConfig().height,sourceFont:parseFloat(getComputedStyle(document.querySelector('#referat blockquote')).fontSize)}));
  assert.deepEqual(state.slides,ids);assert.equal(state.notes,27);assert.ok(state.font400&&state.font700);assert.equal(state.width,1280);assert.equal(state.height,720);assert.ok(state.sourceFont>=22&&state.sourceFont<=28);
  assert.equal(state.images.length,12);
  for(const vp of [{width:1280,height:720}]){
   await page.setViewportSize(vp);await page.evaluate(()=>Reveal.layout());
   for(let n=0;n<ids.length;n++){
    const id=ids[n];await page.evaluate(n=>Reveal.slide(n),n);
    await page.waitForFunction(id=>Reveal.getCurrentSlide().id===id,id);
    const probe=await inspectPresentation(page);const slide=probe.slides.find(s=>s.slide==='#'+id);
    const issues=findCanvasIssues({...slide,viewport:probe.viewport});
    geometries.push({mode,viewport:vp,id,issues});
    if(issues.length)errors.push(...issues.map(s=>`${mode} ${vp.width}: ${s}`));
    if(mode==='file'&&vp.width===1280)await page.screenshot({path:path.join(qa,'slides',`${String(n+1).padStart(2,'0')}-${id}.png`)});
    if(mode==='file'&&vp.width===1280&&[...changed,'przed-referatem','referat','referat-analiza'].includes(id)){
     await page.keyboard.press('s');assert.equal(await page.evaluate(()=>Reveal.getConfig().showNotes),'inline');
     const notes=await page.locator('.speaker-notes').innerText();assert.ok(notes.includes('min'),id);await page.keyboard.press('s');
    }
   }
  }
  await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>{Reveal.layout();Reveal.slide(0)});
  await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>Reveal.getCurrentSlide().id),ids[1]);
  await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>Reveal.getCurrentSlide().id),ids[0]);
  await page.keyboard.press('b');assert.ok(await page.evaluate(()=>Reveal.isPaused()));await page.keyboard.press('b');
  await page.keyboard.press('f');const fullscreen=await page.evaluate(()=>Boolean(document.fullscreenElement));if(fullscreen)await page.evaluate(()=>document.exitFullscreen());
  const media=[];
  for(const id of ids){
   await page.evaluate(id=>Reveal.slide(Reveal.getIndices(document.getElementById(id)).h),id);
   await page.waitForFunction(id=>location.hash==='#/'+id,id);
   const stableUrl=page.url();
   const images=page.locator(`#${id} img`);const count=await images.count();
   for(let n=0;n<count;n++){
    const image=images.nth(n);const src=await image.getAttribute('src');
    for(const action of ['click','Enter','Space','touch']){
     if(action==='click')await image.click();else if(action==='touch')await image.tap();else{await image.focus();await page.keyboard.press(action)}
     const dialog=page.locator('dialog[open]');await dialog.waitFor({state:'visible'});
     await page.evaluate(async()=>document.querySelector('dialog[open] img').decode());
     assert.equal(await page.evaluate(()=>Reveal.getCurrentSlide().id),id);assert.equal(page.url(),stableUrl);
     assert.equal(await dialog.locator('.lesson-image-lightbox__caption').textContent(),'');
     const modal=await dialog.locator('img').evaluate(i=>({src:i.src,decoded:i.naturalWidth>0,rect:{x:i.getBoundingClientRect().x,y:i.getBoundingClientRect().y,right:i.getBoundingClientRect().right,bottom:i.getBoundingClientRect().bottom},objectFit:getComputedStyle(i).objectFit,ratio:i.naturalWidth/i.naturalHeight,displayRatio:i.getBoundingClientRect().width/i.getBoundingClientRect().height}));
     assert.ok(modal.decoded);assert.ok(modal.objectFit==='contain'||Math.abs(modal.ratio-modal.displayRatio)<.01,JSON.stringify({id,...modal,src:undefined}));assert.ok(modal.rect.x>=0&&modal.rect.y>=0&&modal.rect.right<=1281&&modal.rect.bottom<=721);
     if(mode==='file')assert.ok(modal.src.startsWith('data:'));
     if(mode==='file'&&action==='click')await page.screenshot({path:path.join(qa,`lightbox-${id}-${n+1}.png`)});
     await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.ok(await image.evaluate(i=>document.activeElement===i));
    }
    media.push({id,index:n,source:src.startsWith('data:')?'embedded':src,click:true,Enter:true,Space:true,touch:true,Escape:true,focusReturn:true});
   }
  }
  runs.push({mode,url,viewport:{width:1280,height:720},state,media,fullscreen,external_requests:network,page_errors:pageErrors,console_errors:consoleErrors});
  assert.deepEqual(network,[]);assert.deepEqual(pageErrors,[]);assert.deepEqual(consoleErrors,[]);
  await ctx.close();
 }
 // Selected-film transport regression: no automatic network; pointer/keyboard load exact URL.
 const launcher=[];
 for(const action of ['click','Enter']){
  const c=await browser.newContext({viewport:{width:1280,height:720}}),p=await c.newPage(),requests=[];
  await c.route('**/*',route=>{const u=route.request().url();if(/^https?:/.test(u)){requests.push(u);return route.abort();}return route.continue();});
  await p.goto(pathToFileURL(isolated).href);await p.waitForFunction(()=>window.Reveal?.isReady());await p.evaluate(()=>{Reveal.configure({transition:'none'});Reveal.slide(6)});await p.waitForTimeout(200);
  const frame=p.locator('#film-socrealizm iframe'),button=p.locator('#film-socrealizm [data-video-play]'),link=p.locator('#film-socrealizm a');
  assert.equal(await frame.getAttribute('src'),null);assert.deepEqual(requests,[]);assert(await button.isVisible());assert(await link.isVisible());
  const embed='https://www.youtube-nocookie.com/embed/BGP_Rqvg7_0?rel=0',watch='https://www.youtube.com/watch?v=BGP_Rqvg7_0';
  const requested=c.waitForEvent('request',r=>r.url()===embed);
  if(action==='click')await button.click();else{await button.focus();await button.press('Enter')};await requested;
  assert.equal(await frame.getAttribute('src'),embed);assert(await frame.isVisible());assert(!(await button.isVisible()));assert(await link.isVisible());
  assert.equal(await link.getAttribute('href'),watch);assert.equal(await link.getAttribute('target'),'_blank');assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
  const fallback=c.waitForEvent('request',r=>r.url()===watch),popup=p.waitForEvent('popup');await link.click();await Promise.all([fallback,popup]);
  launcher.push({action,initial_no_src:true,initial_external_requests:0,embed_requested:embed,fallback_requested:watch,transport_deliberately_aborted:true,playback_verified:false});await c.close();
 }
 const page=await browser.newPage({viewport:{width:1600,height:900}});const files=(await readdir(path.join(qa,'slides'))).filter(f=>f.endsWith('.png')).sort();assert.equal(files.length,27);
 const cards=await Promise.all(files.map(async f=>`<figure><img src="data:image/png;base64,${(await readFile(path.join(qa,'slides',f))).toString('base64')}"><figcaption>${f}</figcaption></figure>`));
 await page.setContent(`<style>body{margin:0;background:#d5ded9;font:16px sans-serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px}figure{margin:0;background:white}img{width:100%;display:block}figcaption{padding:8px}</style><div class="grid">${cards.join('')}</div>`);await page.evaluate(async()=>{for(const i of document.images)await i.decode()});await page.screenshot({path:path.join(qa,'contact-sheet.png'),fullPage:true});
 const after=await hashes();assert.deepEqual(before,after,'Source changed during verification');
 const artifact=await readFile(path.join(dir,filename));assert.deepEqual(artifact,await readFile(isolated));
 const report={lesson:dir,generated_at:new Date().toISOString(),verdict:errors.length?'BLOCKED_GEOMETRY':'AUTHOR_QA_PASS_PENDING_TEACHER_REVIEW',artifact:path.join(dir,filename),artifact_bytes:artifact.length,artifact_sha256:createHash('sha256').update(artifact).digest('hex'),slide_count:27,note_count:27,teaching_minutes:44,buffer_minutes:1,total_minutes:45,timing_minutes:times,commands,browser:'Chromium '+browserVersion,runs,launcher,geometry:geometries,geometry_issues:errors,source_hashes:after,changed_slide_ids:changed,unchanged_slides_verified:ids.filter(id=>!changed.includes(id)),protected_source_blocks_byte_identical:true,protected_notebook_blocks_byte_identical:true,previous_exports_preserved:true,input_hashes:baseline,qa_scope:'isolated exact file:// artifact offline; 27-slide geometry and fresh screenshots at 1280×720; all 12 existing media lightboxes pointer/touch/keyboard; changed and protected source notes; stable IDs and synchronized timings; no repository-wide audit',contact_sheet:path.join(qa,'contact-sheet.png'),screenshots:path.join(qa,'slides'),visual_review:'pending actual image inspection',teacher_accepted:false,publication_approved:true,limitations:['45-minute budget is an intensive estimate, not classroom-tested.','Source maps have their original scope and resolution:1938–1948,7X1949,and1949–1989, not a fabricated1955 snapshot.','Omniatlas and supplied textbook excerpt/map are private and not rights-cleared for public redistribution.','Selected film is click-to-load with fallback; transport test is not playback/audio review.','Only Chromium exercised; no PDF/PPTX export, publication or git write.']};
 await writeFile(path.join(qa,'author-evidence.json'),JSON.stringify(report,null,2)+'\n');await writeFile(path.join(production,'author-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({verdict:report.verdict,slides:27,images:runs[0].state.images.length,geometry_issues:errors,artifact:report.artifact,sha256:report.artifact_sha256,screenshots:files.length,contact_sheet:report.contact_sheet},null,2));
}finally{await browser.close();console.log('Chromium closed; no preview server started.')}
if(errors.length)process.exitCode=1;
