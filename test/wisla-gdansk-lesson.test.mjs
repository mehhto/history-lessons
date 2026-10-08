import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const lesson=new URL('../classes/7/07-wisla-gdansk/',import.meta.url);
test('Wisła: complete short route, notes on every slide, exit before final A3',async()=>{
 const md=await readFile(new URL('slides.md',lesson),'utf8');
 const blocks=md.split(/^---\s*$/m);
 assert.equal(blocks.length,12);
 for(const block of blocks){assert.equal((block.match(/^notes:/gm)||[]).length,1);assert.match(block,/\.slide: id="[^"]+" data-purpose="[^"]+" data-layout="[^"]+"/);}
 const ids=blocks.map(b=>b.match(/id="([^"]+)"/)[1]);
 assert.ok(ids.indexOf('notatka')<ids.indexOf('bilet-przed-praca'));
 assert.ok(ids.indexOf('bilet-przed-praca')<ids.indexOf('zrodla'));
 assert.equal(ids.at(-1),'folwark-a3');
 const metadata=JSON.parse(await readFile(new URL('metadata.json',lesson),'utf8'));
 assert.equal(metadata.grade,7);assert.equal(metadata.usable_minutes,30);assert.equal(metadata.teacher_reviewed,false);assert.equal(metadata.pdf_exported,false);
 for(const name of ['lesson.md','teacher-guide.md','worksheet.md','assessment.md','student-summary.md','sources.md','reflection.md'])assert.ok((await readFile(new URL(name,lesson),'utf8')).trim());
 const assets=await readdir(new URL('assets/',lesson));assert.ok(!assets.some(n=>n.startsWith('img_')));
 assert.match(md,/1466/);assert.match(md,/1496/);assert.match(md,/Nie musicie skończyć dziś/);
 const guide=await readFile(new URL('teacher-guide.md',lesson),'utf8');assert.match(guide,/27 minut rdzenia/);assert.equal((guide.match(/^\d\. \*\*/gm)||[]).length,5);
});
