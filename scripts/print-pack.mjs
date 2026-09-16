import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';

const PLANS = {
  worksheet: { output: 'worksheet.pdf', sources: ['worksheet.md'], audience: 'student' },
  teacher: { output: 'teacher-guide.pdf', sources: ['teacher-guide.md', 'assessment.md'], audience: 'teacher' },
  summary: { output: 'student-summary.pdf', sources: ['student-summary.md'], audience: 'student' },
};

export function documentKindsForLesson({ lessonType, hasSummary }) {
  return lessonType === 'practice' && !hasSummary
    ? ['worksheet', 'teacher']
    : ['worksheet', 'teacher', 'summary'];
}

export function omittedDocumentKindsForLesson(context) {
  const selected = new Set(documentKindsForLesson(context));
  return Object.keys(PLANS).filter((kind) => !selected.has(kind));
}

export function documentPlan(kind) {
  const plan = PLANS[kind];
  if (!plan) throw new Error('Dokument musi mieć typ worksheet, teacher albo summary.');
  return { ...plan, sources: [...plan.sources] };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isSafeLessonImage(source) {
  if (!/^(?:\.\/)?assets\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp)$/i.test(source)) return false;
  return !source.split('/').includes('..') && !source.includes('\\');
}

const IMAGE_MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function embedLocalImagesInHtml(html, lessonDirectory) {
  const sources = [...String(html).matchAll(/<img src="((?:\.\/)?assets\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp))" alt="[^"]*">/gi)]
    .map((match) => match[1]);
  if (sources.length === 0) return html;

  const assetsDirectory = await realpath(path.join(lessonDirectory, 'assets'));
  let output = String(html);
  for (const source of new Set(sources)) {
    if (!isSafeLessonImage(source)) throw new Error(`Niedozwolona ścieżka obrazu: ${source}`);
    const imagePath = await realpath(path.join(lessonDirectory, source));
    if (!imagePath.startsWith(`${assetsDirectory}${path.sep}`)) {
      throw new Error(`Obraz wychodzi poza katalog assets: ${source}`);
    }
    const mimeType = IMAGE_MIME_TYPES[path.extname(imagePath).toLowerCase()];
    const data = await readFile(imagePath);
    output = output.replaceAll(`src="${source}"`, `src="data:${mimeType};base64,${data.toString('base64')}"`);
  }
  return output;
}

function inline(text) {
  const images = [];
  const withImageTokens = String(text).replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, (syntax, alt, source) => {
    if (!isSafeLessonImage(source)) return syntax;
    const token = `\uE000${images.length}\uE001`;
    images.push(`<img src="${escapeHtml(source)}" alt="${escapeHtml(alt)}">`);
    return token;
  });
  let rendered = escapeHtml(withImageTokens)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
  images.forEach((image, index) => {
    rendered = rendered.replace(`\uE000${index}\uE001`, image);
  });
  return rendered;
}

function tableCells(line) {
  const source = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let cell = '';
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '\\' && source[index + 1] === '|') {
      cell += '|';
      index += 1;
    } else if (character === '|') {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?\s*$/.test(line);
}

function isTableRow(line) {
  return /^\s*\|.+\|\s*$/.test(line) || /^\s*.+\|.+\s*$/.test(line);
}

function tableAlignment(cell) {
  const marker = cell.trim();
  if (marker.startsWith(':') && marker.endsWith(':')) return 'align-center';
  if (marker.endsWith(':')) return 'align-right';
  if (marker.startsWith(':')) return 'align-left';
  return '';
}

function tableCell(tag, value, alignment) {
  const className = alignment ? ` class="${alignment}"` : '';
  return `<${tag}${className}>${inline(value)}</${tag}>`;
}

export function markdownToHtml(markdown) {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const output = [];
  let list = false;
  const closeList = () => { if (list) { output.push('</ul>'); list = false; } };
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (isTableRow(line) && isTableSeparator(lines[index + 1] || '')) {
      closeList();
      const headers = tableCells(line);
      const alignments = tableCells(lines[index + 1]).map(tableAlignment);
      output.push(`<table><thead><tr>${headers.map((cell, column) => tableCell('th', cell, alignments[column])).join('')}</tr></thead><tbody>`);
      index += 2;
      while (index < lines.length && isTableRow(lines[index])) {
        const cells = tableCells(lines[index]);
        output.push(`<tr>${headers.map((_, column) => tableCell('td', cells[column] || '', alignments[column])).join('')}</tr>`);
        index += 1;
      }
      output.push('</tbody></table>');
      index -= 1;
    } else if (heading) {
      closeList();
      const level = heading[1].length;
      output.push(`<h${level}>${inline(heading[2])}</h${level}>`);
    } else if (item) {
      if (!list) { output.push('<ul>'); list = true; }
      output.push(`<li>${inline(item[1])}</li>`);
    } else if (line.trim()) {
      closeList();
      output.push(`<p>${inline(line)}</p>`);
    } else {
      closeList();
    }
  }
  closeList();
  return output.join('\n');
}

export function printableHtml({ title, audience, sections, baseHref }) {
  const body = sections.map(({ heading, markdown }) => `<section>${heading ? `<h1>${escapeHtml(heading)}</h1>` : ''}${markdownToHtml(markdown)}</section>`).join('\n');
  const base = baseHref ? `<base href="${escapeHtml(baseHref)}">` : '';
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8">${base}<title>${escapeHtml(title)}</title><link rel="stylesheet" href="/template/print/print.css"></head><body class="${escapeHtml(audience)}"><main>${body}</main></body></html>`;
}
