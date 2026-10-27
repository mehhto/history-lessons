import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {marked} from 'marked';
const base=new URL('./',import.meta.url),load=n=>readFile(new URL(n,base),'utf8');
const slides=(await load('slides.md')).split(/^---\s*$/m);
const notes=slides.slice(0,-1).map((s,i)=>{
  const [body,note]=s.split(/^notes:\s*$/m);
  const title=body.match(/<h[12]>(.*?)<\/h[12]>/s)?.[1].replace(/<[^>]+>/g,' ')??`Slajd ${i+1}`;
  return `<details><summary>${i+1}. ${title}</summary>${marked.parse(note??'')}</details>`;
}).join('\n');
const html=`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wolbrom — przewodnik nauczyciela</title><link rel="icon" href="data:,"><style>
body{max-width:1000px;margin:0 auto;padding:24px;font:19px/1.6 system-ui,sans-serif;color:#202a35;background:#fff}h1,h2,h3{line-height:1.2}h1{font-size:36px;color:#087758}h2{margin-top:40px;border-top:3px solid #168f71;padding-top:20px}a{color:#075c89;overflow-wrap:anywhere}nav{display:flex;flex-wrap:wrap;gap:16px;border-bottom:2px solid #202a35;padding-bottom:18px}table{width:100%;border-collapse:collapse;font-size:17px}th,td{border:1px solid #9ca3af;padding:10px;text-align:left;vertical-align:top}code{overflow-wrap:anywhere;font-size:.9em}details{border-bottom:1px solid #adb5bd;padding:16px 0}summary{font-weight:700;cursor:pointer}li{margin:.5em 0}details p{padding:0 12px}#sources{font-size:16px}@media(max-width:600px){body{padding:16px;font-size:17px}table{font-size:14px}td,th{padding:5px}}@media print{body{font-size:11pt;max-width:none}nav{display:none}details{break-inside:avoid}h2,h3{break-after:avoid}}
</style></head><body><nav><a href="index.html">Prezentacja live</a><a href="04-wolbrom-700-lat-portable.html">Prezentacja offline</a><a href="#notes">Wszystkie notatki</a><a href="#sources">Prawa i źródła obrazów</a></nav>${marked.parse(await load('teacher-guide.md'))}<section id="notes"><h2>Notatki do każdego slajdu — rozwiń wybrany</h2>${notes}</section><section id="sources">${marked.parse(await load('sources.md'))}</section></body></html>`;
await writeFile(new URL('teacher-guide.html',base),html);
console.log(`Teacher guide: ${fileURLToPath(new URL('teacher-guide.html',base))}; ${slides.length-1} sekcji notatek + źródła.`);
