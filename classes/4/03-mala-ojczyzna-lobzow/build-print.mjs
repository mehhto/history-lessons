// Lesson-local print assembly; reuse the repository Markdown renderer.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { markdownToHtml, embedLocalImagesInHtml } from '../../../scripts/print-pack.mjs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const split = async name => (await readFile(path.join(dir, name), 'utf8')).trim().split(/\n\s*<!-- page -->\s*\n/);
const css = `
@page { size: A4 portrait; margin: 0; }
* { box-sizing: border-box; }
body { margin: 0; color: #000; background: #ddd; font-family: Arial, sans-serif; }
.page { width:210mm; height:297mm; padding:10mm 12mm; background:white; margin:8mm auto; break-after:page; font-size:12pt; line-height:1.35; }
.page:last-child { break-after:auto; }
h1 { font-size:21pt; line-height:1.12; margin:0 0 5mm; }
h2 { font-size:13pt; line-height:1.18; margin:4mm 0 2mm; }
p { margin:0 0 3.2mm; }
ul { padding-left:6mm; margin:2mm 0 4mm; }
li { margin-bottom:2mm; }
img { display:block; max-width:100%; object-fit:contain; margin:2mm auto; }
.credit { font-size:8.5pt; line-height:1.18; margin:1mm 0 3mm; }
.station-1 { font-size:11pt; line-height:1.25; }
.station-1 h1 { font-size:20pt; margin-bottom:3mm; }
.station-1 img[alt^="Mapa regionów"] { height:103mm; }
.station-1 img[alt^="Współczesna mapa"] { width:100%; height:auto; }
.station-1 p { margin-bottom:2.3mm; }
.station-3 { font-size:11.5pt; }
.station-3 img { height:116mm; }
.station-3 p { margin-bottom:2.6mm; }
.station-4 p:nth-of-type(3) { border-left:1mm solid #000; padding:2mm 4mm; font-size:13pt; line-height:1.5; }
.worksheet { font-size:11pt; line-height:1.25; }
.worksheet h1 { font-size:17pt; margin-bottom:3mm; }
.worksheet h2 { font-size:12pt; margin:4mm 0 2mm; }
.worksheet p { margin:0 0 3mm; }
.worksheet .writing-line { min-height:8mm; font-size:0; border-bottom:.25mm dotted #000; margin-bottom:1mm; width:100%; }
.worksheet .recap { font-size:9pt; line-height:1.25; border-top:.3mm solid #000; padding-top:2mm; margin-top:3mm; }
.project { display:flex; flex-direction:column; font-size:11pt; line-height:1.3; }
.project h1 { font-size:20pt; }
.project .workspace { flex:1; min-height:140mm; border-top:.3mm solid #000; margin-top:2mm; }
.teacher { font-size:10.4pt; line-height:1.3; }
.teacher h1 { font-size:19pt; }
.teacher h2 { font-size:12.2pt; margin:3mm 0 2mm; }
.teacher p { margin-bottom:2.5mm; }
.teacher li { margin-bottom:1.3mm; }
.key { font-size:11pt; line-height:1.3; }
.key h1 { font-size:20pt; }
.key h2 { margin:3mm 0 1.8mm; }
.key p { margin-bottom:2.6mm; }
.print-help { max-width:210mm; margin:6mm auto; padding:4mm; background:white; font-size:12pt; }
a { color:#000; }
@media print { body { background:white; } .page { margin:0; } .print-help { display:none; } }
`;
function decorate(html, kind) {
  if (kind === 'worksheet') {
    html = html.replace(/<p>(\.{20,}.*?)<\/p>/g, '<p class="writing-line">$1</p>');
    html = html.replace('<p><strong>Zapamiętaj:', '<p class="recap"><strong>Zapamiętaj:');
  }
  html = html.replace(/<p>(Mapa regionów:|Mapa okolicy,|<strong>Fotografia muralu[\s\S]*?<\/strong>)([\s\S]*?)<\/p>/g, '<p class="credit">$1$2</p>');
  if (kind === 'project') html += '<div class="workspace" aria-label="Puste miejsce na stronę miniprzewodnika"></div>';
  return html;
}
async function build(name, title, pages, instruction) {
  const body = await Promise.all(pages.map(async ({md,kind},i) => `<section class="page ${kind}" data-page="${i+1}"><div class="content">${await embedLocalImagesInHtml(decorate(markdownToHtml(md), kind), dir)}</div></section>`));
  // Keep the blank project surface outside .content so its measured height is explicit.
  const content = body.join('\n').replaceAll('<div class="workspace" aria-label="Puste miejsce na stronę miniprzewodnika"></div></div>', '</div><div class="workspace" aria-label="Puste miejsce na stronę miniprzewodnika"></div>');
  await writeFile(path.join(dir,name), `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'"><title>${title}</title><style>${css}</style></head><body><aside class="print-help">${instruction}</aside><main>${content}</main></body></html>`);
}
const stations = (await split('stations.md')).map((md,i)=>({md,kind:`station station-${i+1}`}));
const worksheet = (await split('worksheet.md')).map(md=>({md,kind:'worksheet'}));
const projects = (await split('projects.md')).map(md=>({md,kind:'project'}));
const teacher = (await split('teacher-guide.md')).map(md=>({md,kind:'teacher'}));
const key = (await split('assessment.md')).map(md=>({md,kind:'key'}));
if ([stations.length,worksheet.length,projects.length,teacher.length,key.length].join() !== '5,1,5,5,2') throw Error('Unexpected print plan');
await build('packet.html','Łobzów — materiały dla uczniów',[...stations,...worksheet,...projects],'<strong>Materiały uczniowskie — 11 stron wzorcowych.</strong> Drukuj strony 1–5 oraz 7–11 po jednym razie, a stronę 6 w 18 kopiach. Razem 28 stron. A4 pionowo, jednostronnie, 100%, bez nagłówków i stopek. Źródła zostają na stolikach. Karta służy na obie lekcje. <a href="worksheet.html">Sama karta</a> • <a href="teacher-guide.html">Przewodnik nauczycielki</a> • <a href="key.html">Osobny klucz</a>.');
await build('worksheet.html','Łobzów — jedna karta na obie lekcje',worksheet,'Drukuj 18 kopii tej jednej strony zamiast strony 6 pakietu. Nie drukuj obu wersji. A4, jednostronnie, 100%, bez nagłówków i stopek.');
await build('teacher-guide.html','Łobzów — scenariusz krok po kroku',teacher,'Tylko dla prowadzącej. 5 stron. Druk jednostronny A4, 100%, bez nagłówków i stopek. <a href="packet.html">Materiały uczniowskie</a> • <a href="key.html">Osobny klucz — 2 strony</a>.');
await build('key.html','Łobzów — osobny klucz',key,'Tylko dla prowadzącej. 2 strony, nie rozdawać uczniom. Druk jednostronny A4, 100%, bez nagłówków i stopek.');
const manifest={access_date:'2026-10-18',region_map:{author:'Krystian Chariza i zespół',license:'CC BY 3.0',page:'https://zpe.gov.pl/a/moje-miejsce-na-ziemi/DQDLFg0Gq',url:'https://static.zpe.gov.pl/portal/f/res-minimized/R3g7OcGzHJ0kk/4/jaJesZ2WyEuMuqgUdonqcSb49nTRFXLk.jpg'},mural:{author:'Kamil Czaiński',photo_date:'2024-06-22',license:'CC BY-SA 4.0',url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Wolbrom%2C_mural_upami%C4%99tniaj%C4%85cy_nadanie_praw_miejskich_przez_W%C5%82adys%C5%82awa_%C5%81okietka_w_1327.jpg'},osm:{attribution:'© OpenStreetMap contributors',license:'ODbL 1.0',center:[50.397,19.773],zoom:14,tiles:[]},files:{}};
for (let y=5527;y<=5529;y++)for(let x=9089;x<=9093;x++)manifest.osm.tiles.push(`https://tile.openstreetmap.org/14/${x}/${y}.png`);
for(const f of ['regiony-original.jpg','regiony-bw.png','mural-original.jpg','mural-bw.png','okolica-osm-bw.png']) { const b=await readFile(path.join(dir,'assets',f));manifest.files[f]={bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}; }
await writeFile(path.join(dir,'assets','provenance.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({master_pages:11,student_prints:5+18+5,teacher_pages:teacher.length,key_pages:key.length,total_prints:5+18+5+teacher.length+key.length}));
