import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, copyFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { localChromiumExecutable } from './support/local-chromium.mjs';
const repo=process.cwd(),lesson='classes/8/07-polacy-na-frontach';
test('all v2 HTML offline: eight A4 photo pages, pupil card, script/key, blank/key A3 and screen',async()=>{
 const root=path.join(os.tmpdir(),'polacy-fronty-v2-browser-'+process.pid);await mkdir(root,{recursive:true});
 const build=path.join(root,'built');execFileSync(process.execPath,[`${lesson}/build-review.mjs`,'--output',build],{cwd:repo});
 const evidence=path.join(os.tmpdir(),'polacy-fronty-v2-evidence');await rm(evidence,{recursive:true,force:true});await mkdir(evidence,{recursive:true});
 const browser=await chromium.launch({executablePath:await localChromiumExecutable(repo),headless:true,args:['--no-sandbox']});
 const result=[],failures=[];
 try{
  for(const [name,count] of [['wszystkie-teczki-v2',8],...Array.from({length:8},(_,i)=>['teczka-'+(i+1)+'-v2',1]),['karta-pracy-v2',1],['scenariusz-v2',4],['klucz-v2',3],['podsumowanie-v2',1],['mapa-wspolna-a3-v2',1],['mapa-klucz-a3-v2',1],['mapa-ekran-v2',1]]){
   const isolated=path.join(root,name);await mkdir(isolated);const file=path.join(isolated,'review.html');await copyFile(path.join(build,name+'-review.html'),file);
   const page=await browser.newPage({viewport:{width:1600,height:1150}}),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url());});
   await page.emulateMedia({media:'print'});await page.goto(pathToFileURL(file).href);await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
   assert.equal(await page.locator('.page').count(),count);
   const geometry=await page.evaluate(()=>[...document.querySelectorAll('.page')].map(p=>{
    const r=p.getBoundingClientRect(),c=p.querySelector('.content').getBoundingClientRect(),f=p.querySelector('footer').getBoundingClientRect();
    const outside=[...p.querySelectorAll('.content *')].filter(e=>{const b=e.getBoundingClientRect();return b.right>r.right+.5||b.left<r.left-.5;}).map(e=>e.tagName);
    return {page:p.dataset.page,width:r.width,height:r.height,content:c.height,free:f.top-c.bottom,scroll:p.scrollHeight,outside,images:[...p.querySelectorAll('img')].map(i=>({width:i.naturalWidth,height:i.naturalHeight}))};
   }));
   result.push({name,count,geometry,errors,requests});
   for(let i=0;i<count;i++)await page.locator('.page').nth(i).screenshot({path:path.join(evidence,`${name}-${String(i+1).padStart(2,'0')}.png`)});
   for(const g of geometry)if(g.outside.length||g.free<3||g.scroll>Math.ceil(g.height)+1)failures.push(`${name}/${g.page}: footer gap ${g.free.toFixed(1)}, scroll ${g.scroll}, outside ${g.outside}`);
   assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
   if(name==='karta-pracy-v2'){
    assert.equal(await page.locator('.answer-field').count(),5);
    assert.ok(await page.locator('.writing-line').first().evaluate(e=>e.getBoundingClientRect().height>=22));
   }
   if(name==='mapa-ekran-v2'){
    await page.emulateMedia({media:'screen'});await page.setViewportSize({width:1280,height:800});
    await page.screenshot({path:path.join(evidence,'mapa-ekran-v2-screen.png')});
    assert.ok(await page.locator('img').evaluate(e=>{const r=e.getBoundingClientRect();return r.bottom<=innerHeight+2&&r.right<=innerWidth+2;}));
   }
   await page.close();
  }
 }finally{await writeFile(path.join(evidence,'geometry.json'),JSON.stringify(result,null,2));await browser.close();await rm(root,{recursive:true,force:true});}
 assert.deepEqual(failures,[]);console.log('HTML v2 evidence:',evidence);
});
