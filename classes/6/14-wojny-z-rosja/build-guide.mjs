// Minimal adaptation of VIII/12 build-guide.mjs; no shared generator changes.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {marked} from '../../../node_modules/marked/lib/marked.esm.js';
const d=path.dirname(fileURLToPath(import.meta.url)),get=f=>readFile(path.join(d,f),'utf8');
const story=JSON.parse(await get('storyboard.json')),blocks=(await get('slides.md')).split('\n---\n');
let guide=(await get('teacher-guide.md')).split('## Notatki do każdego slajdu')[0]+'## Notatki do każdego slajdu — dokładna aktualna kolejność\n';
for(const s of story.slides){const b=blocks.find(b=>b.includes(`id="${s.id}"`));if(!b?.includes('\nnotes:\n'))throw Error('Missing notes: '+s.id);guide+=`\n## Slajd ${s.number}. ${s.title}\n\n**ID:** \`${s.id}\` · **czas:** ${s.minutes} min\n\n${b.split('\nnotes:\n')[1].trim()}\n`;}
guide+='\n## Ocenianie — aktualny klucz\n'+await get('assessment.md')+'\n## Źródła i prawa — pełna dokumentacja nauczyciela\n'+await get('sources.md');
await writeFile(path.join(d,'teacher-guide.md'),guide);
const css='@page{size:A4;margin:15mm}*{box-sizing:border-box}body{font:18px/1.55 Georgia,serif;color:#171717;background:#fff;max-width:1000px;margin:35px auto;padding:0 25px}h1,h2,h3,nav{font-family:Arial,sans-serif}h1{font-size:34px}h2{font-size:25px;margin-top:32px;border-bottom:2px solid #915044;padding-bottom:8px}p,li{margin:12px 0}a{color:#763c31;overflow-wrap:anywhere}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.4 monospace}table{width:100%;border-collapse:collapse}th,td{border:1px solid #777;padding:8px}nav{font-size:16px;border-bottom:1px solid #777;padding-bottom:15px}@media print{body{font:11pt/1.4 Georgia,serif;margin:0;padding:0;max-width:none}nav{display:none}h1{font-size:20pt}h2{font-size:14pt;break-after:avoid}p,li{margin:7px 0}pre{font-size:8pt}}';
for(const kind of ['teacher-guide','student-summary']){const text=kind==='teacher-guide'?guide:await get(kind+'.md');await writeFile(path.join(d,kind+'.html'),`<!doctype html><html lang="pl"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${kind} — Wojny z Rosją</title><style>${css}</style><body><nav><a href="index.html">Prezentacja</a> · <a href="teacher-guide.html">Przewodnik nauczyciela</a> · <a href="student-summary.html">Podsumowanie ucznia</a></nav><main>${marked.parse(text)}</main></body></html>`);}
console.log('Guide/summary HTML synchronized:',story.slides.length,'slides; private revision.');
