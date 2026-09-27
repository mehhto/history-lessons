import { lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { marked } from 'marked';
import { resolveWithin } from './safe-paths.mjs';
import { TEST_PATH_PATTERN, studentTestMarkdown } from './test-catalog.mjs';

function run(value, property = '') {
  const content = String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<w:r>${property ? `<w:rPr>${property}</w:rPr>` : ''}<w:t xml:space="preserve">${content}</w:t></w:r>`;
}

export async function makeDocxBuffer(entries) {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
  const crc32 = (data) => { let c = 0xffffffff; for (const byte of data) c = table[(c ^ byte) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  let offset = 0;
  const local = [], central = [];
  for (const [filename, value] of Object.entries(entries)) {
    const name = Buffer.from(filename), data = Buffer.isBuffer(value) ? value : Buffer.from(value), compressed = deflateRawSync(data), crc = crc32(data);
    const header = Buffer.alloc(30 + name.length); header.writeUInt32LE(0x04034b50, 0); header.writeUInt16LE(20, 4); header.writeUInt16LE(0x0800, 6); header.writeUInt16LE(8, 8); header.writeUInt32LE(crc, 14); header.writeUInt32LE(compressed.length, 18); header.writeUInt32LE(data.length, 22); header.writeUInt16LE(name.length, 26); name.copy(header, 30); local.push(header, compressed);
    const record = Buffer.alloc(46 + name.length); record.writeUInt32LE(0x02014b50, 0); record.writeUInt16LE(20, 4); record.writeUInt16LE(20, 6); record.writeUInt16LE(0x0800, 8); record.writeUInt16LE(8, 10); record.writeUInt32LE(crc, 16); record.writeUInt32LE(compressed.length, 20); record.writeUInt32LE(data.length, 24); record.writeUInt16LE(name.length, 28); record.writeUInt32LE(offset, 42); name.copy(record, 46); central.push(record); offset += header.length + compressed.length;
  }
  const directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(central.length, 8); end.writeUInt16LE(central.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, directory, end]);
}

export async function buildAssessmentDocx({ markdown, sourceDirectory }) {
  const tokens = [], paragraphs = [];
  const tokensFrom = async (nodes, format = {}) => {
    let out = '';
    for (const node of nodes || []) {
      if (node.type === 'text') out += run(node.text, `${format.bold ? '<w:b/>' : ''}${format.italic ? '<w:i/>' : ''}`);
      else if (node.type === 'codespan') out += run(node.text, '<w:rStyle w:val="VerbatimChar"/>');
      else if (node.type === 'image') {
        const src = node.href || '';
        if (!src.startsWith('assets/') || !/\.(?:png|jpe?g|webp)$/iu.test(src) || src.split('/').length !== 2) throw new Error(`Niedozwolony obraz DOCX: ${src}`);
        const folder = await realpath(path.join(sourceDirectory, 'assets'));
        const imagePath = await realpath(resolveWithin(sourceDirectory, src));
        if (!imagePath.startsWith(`${folder}${path.sep}`)) throw new Error(`Obraz DOCX poza tests/<klasa>/assets/: ${src}`);
        const bytes = await readFile(imagePath), ext = path.extname(src).toLowerCase() === '.jpeg' ? '.jpg' : path.extname(src).toLowerCase();
        const type = ext === '.jpg' ? 'image/jpeg' : `image/${ext.slice(1)}`;
        const index = tokens.length + 1; tokens.push({ name: `word/media/image${index}${ext}`, bytes, type });
        out += `<w:r><w:drawing><wp:inline><wp:extent cx="5486400" cy="3657600"/><wp:docPr id="${index}" name="image${index}"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${index}" name="image${index}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rId${index + 1}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="5486400" cy="3657600"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
      } else if (node.type === 'strong' || node.type === 'em') out += await tokensFrom(node.tokens, { bold: format.bold || node.type === 'strong', italic: format.italic || node.type === 'em' });
      else if (node.tokens) out += await tokensFrom(node.tokens, format);
    }
    return out;
  };
  async function render(nodes) {
    let list;
    const flush = () => { if (list) { paragraphs.push(...list.items.map((text) => `<w:p><w:pPr><w:pStyle w:val="${list.style}"/></w:pPr>${text || run(' ')}</w:p>`)); list = undefined; } };
    for (const node of nodes) {
      if (node.type === 'heading') { flush(); paragraphs.push(`<w:p><w:pPr><w:pStyle w:val="Heading${Math.min(3, node.depth)}"/></w:pPr>${await tokensFrom(node.tokens)}</w:p>`); }
      else if (node.type === 'paragraph') { flush(); paragraphs.push(`<w:p>${await tokensFrom(node.tokens)}</w:p>`); }
      else if (node.type === 'list') { flush(); list = { style: node.ordered ? 'ListNumber' : 'ListBullet', items: [] }; for (const item of node.items || []) list.items.push(await tokensFrom(item.tokens)); flush(); }
      else if (node.type === 'blockquote') { flush(); await render(node.tokens); }
      else if (node.type === 'table') {
        flush(); const rows = [node.header, ...(node.rows || [])], width = 9000 / Math.max(1, ...rows.map((r) => r.length));
        const body = [];
        for (const row of rows) { const cells = []; for (const cell of row) { let text = await tokensFrom(cell.tokens); if (cell.header) text = text.replaceAll('<w:r>', '<w:r><w:rPr><w:b/></w:rPr>'); cells.push(`<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/></w:tcPr><w:p>${text}</w:p></w:tc>`); } body.push(`<w:tr>${cells.join('')}</w:tr>`); }
        paragraphs.push(`<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>${body.join('')}</w:tbl>`);
      }
      else if (node.type === 'space') flush();
      else if (node.type === 'code') { flush(); paragraphs.push(`<w:p>${run(node.text)}</w:p>`); }
      else if (node.type === 'hr') { flush(); paragraphs.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4"/></w:pBdr></w:pPr><w:r><w:t> </w:t></w:r></w:p>'); }
    }
    flush();
  }
  const studentMarkdown = studentTestMarkdown(markdown);
  await render(marked.lexer(studentMarkdown));
  const relationships = tokens.map((image, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${path.basename(image.name)}"/>`).join('');
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${paragraphs.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134"/></w:sectPr></w:body></w:document>`;
  const types = [...new Set(tokens.map((i) => `<Default Extension="${path.extname(i.name).slice(1)}" ContentType="${i.type}"/>`))].join('');
  const entries = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>${types}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>`,
    '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    'word/document.xml': documentXml,
    'word/styles.xml': '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:sz w:val="22"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:pPr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="ListBullet"><w:name w:val="List Bullet"/></w:style><w:style w:type="paragraph" w:styleId="ListNumber"><w:name w:val="List Number"/></w:style></w:styles>',
    'word/_rels/document.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>${relationships}</Relationships>`,
    ...Object.fromEntries(tokens.map(({ name, bytes }) => [name, bytes])),
  };
  return makeDocxBuffer(entries);
}

export async function docxForTest({ repoRoot, test }) {
  if (typeof test !== 'string' || !TEST_PATH_PATTERN.test(test)) throw new Error('Nieprawidłowy sprawdzian lub kartkówka.');
  const root = await realpath(repoRoot), testsRoot = await realpath(path.join(repoRoot, 'tests'));
  const source = resolveWithin(root, test), directory = path.dirname(source);
  if (path.relative(testsRoot, directory).split(path.sep).length !== 1) throw new Error('Nieprawidłowy katalog sprawdzianu.');
  const sourceStat = await lstat(source);
  if (!sourceStat.isFile() || sourceStat.isSymbolicLink()) throw new Error('Źródło kartkówki nie jest zwykłym plikiem.');
  return buildAssessmentDocx({ markdown: await readFile(source, 'utf8'), sourceDirectory: directory });
}