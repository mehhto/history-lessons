// Lesson-local A4 packet builder; no network is needed after this build.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { markdownToHtml, embedLocalImagesInHtml } from '../../../scripts/print-pack.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const split = async file => (await readFile(path.join(dir, file), 'utf8')).trim().split(/\n\s*<!-- page -->\s*\n/);
const css = `
@page { size:A4 portrait; margin:0; }
* { box-sizing:border-box; }
body { margin:0; background:#ddd; color:#000; font-family:Arial, sans-serif; }
.page { width:210mm; height:297mm; padding:10mm 12mm; margin:8mm auto; break-after:page; background:#fff; font-size:11.3pt; line-height:1.28; }
.page:last-child { break-after:auto; }
h1 { margin:0 0 4mm; font-size:20pt; line-height:1.1; }
h2 { margin:4mm 0 2mm; font-size:13pt; line-height:1.15; }
p { margin:0 0 2.6mm; }
ul { margin:2mm 0 3mm; padding-left:6mm; }
li { margin-bottom:1.5mm; }
table { width:100%; border-collapse:collapse; margin:3mm 0; font-size:10.3pt; }
th, td { border:.25mm solid #000; padding:1.5mm; vertical-align:top; }
img { display:block; max-width:100%; margin:2mm auto; object-fit:contain; }
.station { display:flex; flex-direction:column; justify-content:center; }
.station-1, .station-2, .station-3 { font-size:12.4pt; line-height:1.31; }
.station-1 h1, .station-2 h1, .station-3 h1 { font-size:23pt; }
.station-1 table, .station-3 table { font-size:11pt; }
.station-4, .station-5 { font-size:11.25pt; line-height:1.28; }
.station-2 img { height:58mm; }
.station-4 img { height:86mm; }
.station-4 table, .station-5 table { font-size:10.7pt; }
.worksheet { font-size:9.4pt; line-height:1.12; }
.worksheet h1 { font-size:17pt; margin-bottom:2.5mm; }
.worksheet h2 { font-size:11.3pt; margin:3.1mm 0 1.4mm; }
.worksheet p { margin-bottom:1.9mm; }
.worksheet table { font-size:8.9pt; margin:1.7mm 0; }
.worksheet td, .worksheet th { padding:1.1mm; }
.worksheet[data-page="2"] img { height:138mm; }
.print-help { max-width:210mm; margin:6mm auto; padding:4mm; background:#fff; font-size:11pt; }
@media print { body { background:#fff; } .page { margin:0; } .print-help { display:none; } }
`;

async function build(name, title, pages, note) {
  const sections = await Promise.all(pages.map(async (md, i) => {
    const html = await embedLocalImagesInHtml(markdownToHtml(md), dir);
    const kind = name === 'worksheet.html' ? 'worksheet' : `station station-${i + 1}`;
    return `<section class="page ${kind}" data-page="${i + 1}">${html}</section>`;
  }));
  const document = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'"><title>${title}</title><style>${css}</style></head><body><aside class="print-help">${note}</aside><main>${sections.join('\n')}</main></body></html>`;
  await writeFile(path.join(dir, name), document);
}

const stations = await split('stations.md');
const worksheet = await split('worksheet.md');
if (stations.length !== 5 || worksheet.length !== 2) throw Error(`Nieoczekiwany plan druku: stacje=${stations.length}, karta=${worksheet.length}`);
await build('packet.html', 'Akcja „Burza” i powstanie warszawskie — pięć stacji', stations, '<strong>Arkusze stacji: 5 stron wzorcowych.</strong> Drukuj po jednym egzemplarzu, A4 pionowo, 100%, bez nagłówków i stopek. Arkusze zostają na stolikach. <a href="worksheet.html">Karta drużyny</a>.');
await build('worksheet.html', 'Akcja „Burza” i powstanie warszawskie — karta drużyny', worksheet, '<strong>Karta drużyny: 2 strony.</strong> Drukuj po jednym komplecie dla grupy, dwustronnie z odwracaniem przy krótkiej krawędzi, A4 pionowo, 100%, bez nagłówków i stopek. Nie zawiera klucza.');
console.log(JSON.stringify({station_master_pages: stations.length, team_card_pages: worksheet.length, default_team_cards: 5}));