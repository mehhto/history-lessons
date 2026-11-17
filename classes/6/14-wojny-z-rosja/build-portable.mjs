// Reuse the repository exporter; locally inline its unsupported lightbox override attributes.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildPortablePresentation} from '../../../scripts/export-portable.mjs';
const lesson=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(lesson,'../../..');
let html=await buildPortablePresentation({repoRoot:root,lessonDirectory:lesson});
const manifest=JSON.parse(await readFile(path.join(lesson,'assets/manifest.json'),'utf8'));
for(const src of new Set([...html.matchAll(/data-lightbox-src="(assets\/[^\"]+)"/g)].map(m=>m[1]))){
 if(!manifest.some(x=>x.file===src)||src.includes('..'))throw Error('Unknown lightbox asset: '+src);
 const mime={'.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'}[path.extname(src)];if(!mime)throw Error('Unsupported lightbox type: '+src);
 const data='data:'+mime+';base64,'+(await readFile(path.join(lesson,src))).toString('base64');
 html=html.replaceAll(`data-lightbox-src="${src}"`,`data-lightbox-src="${data}"`);
}
const output=path.join(lesson,'wojny-z-rosja-batory-zamoyski-2026-11-17-portable.html');await writeFile(output,html);console.log('Private portable, full lightbox originals inlined:',output);
