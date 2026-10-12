import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {studentTestMarkdown} from '../scripts/test-catalog.mjs';
import {embedLocalImagesInHtml,printableHtml} from '../scripts/print-pack.mjs';

test('VII short quiz: four tasks, 14 points, local contour and a separate teacher key',async()=>{
 const file=new URL('../tests/7/03-kongres-powstanie-emigracja.md',import.meta.url);
 const text=await readFile(file,'utf8'), student=studentTestMarkdown(text);
 assert.equal((text.match(/<!-- teacher-key -->/g)||[]).length,1);
 assert.equal((student.match(/^## \d\./gm)||[]).length,4);
 assert.deepEqual([...student.matchAll(/\((\d+) pkt\)/g)].map(m=>Number(m[1])),[4,3,4,3]);
 assert.doesNotMatch(student,/\| Zdanie \||\| Wydarzenie \||\| Kolejność \|/);
 assert.match(student,/P □ \| F □/);
 assert.match(student,/14 pkt/);
 assert.doesNotMatch(student,/Klucz odpowiedzi|Kolejno \*\*F, P, P/);
 assert.match(student,/1 — Królestwo Polskie.*2 — Wielkie Księstwo Poznańskie.*3 — Rzeczpospolita Krakowska/);
 const html=await embedLocalImagesInHtml(printableHtml({title:'Kartkówka',audience:'student',sections:[{markdown:student}]}),new URL('../tests/7/',import.meta.url).pathname);
 assert.match(html,/src="data:image\/png;base64,/);
 assert.doesNotMatch(html,/Klucz odpowiedzi/);
 assert.match(text,/s\. 34–43 i 46–49/);
});
