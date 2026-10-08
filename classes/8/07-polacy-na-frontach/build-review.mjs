// Lesson-local review exporter; no PDF, presentation or accepted manifest.
import { readFile, writeFile, mkdir, realpath, lstat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import { parseFragment, serialize } from 'parse5';
const lesson = path.dirname(fileURLToPath(import.meta.url));
const index = process.argv.indexOf('--output');
if(index < 0 || !process.argv[index+1]) throw new Error('Podaj --output z katalogiem poza repozytorium.');
const out = path.resolve(process.argv[index+1]);
const repo = path.resolve(lesson,'../../..');
await mkdir(out,{recursive:true});
const target = await realpath(out);
if(target===repo || target.startsWith(repo+path.sep)) throw new Error('Podgląd musi pozostać poza repozytorium.');
const css=await readFile(path.join(lesson,'print-review.css'),'utf8');
const assets=await realpath(path.join(lesson,'assets'));
async function body(markdown) {
 const tree=parseFragment(marked.parse(markdown));
 async function walk(node) {
  if(['script','iframe','link','style','base','object','embed'].includes(node.tagName)) throw new Error('Niedozwolony zasób w Markdown.');
  for(const a of node.attrs||[]) {
   if(a.name.startsWith('on') || ['srcset','poster','style'].includes(a.name)) throw new Error('Niedozwolony atrybut zasobu.');
   if(a.name==='src') {
    if(node.tagName!=='img' || !/^assets\/[a-z0-9.-]+\.(jpg|png|svg)$/i.test(a.value)) throw new Error('Nieobsługiwany obraz: '+a.value);
    const file=await realpath(path.join(lesson,a.value));
    if(!file.startsWith(assets+path.sep)) throw new Error('Obraz poza assets.');
    const type={'.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'}[path.extname(file)];
    a.value=`data:${type};base64,${(await readFile(file)).toString('base64')}`;
   }
  }
  for(const child of node.childNodes||[]) await walk(child);
 }
 await walk(tree);return serialize(tree);
}
async function build(name, pages, audience='student', format='A4', extraClass='') {
 let content='';
 for(let i=0;i<pages.length;i++) content+=`<article class="page" data-page="${i+1}"><div class="content">${await body(pages[i])}</div><footer>${audience==='teacher'?'Tylko dla nauczyciela':'Historia · klasa VIII'} · wersja 2 · ${i+1}/${pages.length}</footer></article>`;
 const html=`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'"><title>${name} — wersja 2 — ${format}</title><style>${css}</style></head><body class="${audience} ${name} ${format==='A3'?'map':''} ${extraClass}">${content}</body></html>`;
 const file=path.join(target,name+'-review.html');
 try {if((await lstat(file)).isSymbolicLink()) throw new Error('Wyjście nie może być symlinkiem.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await writeFile(file,html);console.log(name,pages.length,format,file);
}
await import('./create-maps.mjs');
const dossier=(await readFile(path.join(lesson,'dossiers.md'),'utf8')).trim().split(/\n<!-- page -->\n/);
if(dossier.length!==8)throw new Error('Potrzeba ośmiu jednostronicowych teczek.');
await build('wszystkie-teczki-v2',dossier);
for(let i=0;i<8;i++)await build('teczka-'+(i+1)+'-v2',[dossier[i]]);
await build('karta-pracy-v2',[await readFile(path.join(lesson,'worksheet.md'),'utf8')]);
await build('podsumowanie-v2',[await readFile(path.join(lesson,'student-summary.md'),'utf8')]);
const splitPages=async file=>(await readFile(path.join(lesson,file),'utf8')).trim().split(/\n<!-- page -->\n/);
await build('scenariusz-v2',await splitPages('teacher-guide.md'),'teacher');
await build('klucz-v2',await splitPages('assessment.md'),'teacher');
const map='# Mapa polskich walk\nWpisujcie numery jednostek przy miejscach. Numer 2 w dwóch punktach; numer 1 przy obszarze koło Londynu.\n\n![Mapa do oznaczania](assets/mapa-do-oznaczania.svg)';
await build('mapa-wspolna-a3-v2',[map],'student','A3');
await build('mapa-ekran-v2',['# Mapa polskich walk\n\n![Mapa do oznaczania](assets/mapa-do-oznaczania.svg)'],'student','A3','fullscreen');
await build('mapa-klucz-a3-v2',['# Mapa polskich walk — klucz nauczyciela\nCyfry przyporządkowują miejsca do teczek; 303 to obszar bitwy powietrznej, nie pojedynczy punkt.\n\n![Mapa z odpowiedziami](assets/mapa-klucz.svg)'],'teacher','A3');
