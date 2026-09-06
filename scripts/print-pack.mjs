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

function inline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function tableCells(line) {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());
}

function isTableSeparator(line) {
  return /^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function isTableRow(line) {
  return /^\s*\|?.+\|.+\|?\s*$/.test(line);
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
      output.push(`<table><thead><tr>${headers.map((cell) => `<th>${inline(cell)}</th>`).join('')}</tr></thead><tbody>`);
      index += 2;
      while (index < lines.length && isTableRow(lines[index])) {
        const cells = tableCells(lines[index]);
        output.push(`<tr>${headers.map((_, column) => `<td>${inline(cells[column] || '')}</td>`).join('')}</tr>`);
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

export function printableHtml({ title, audience, sections }) {
  const body = sections.map(({ heading, markdown }) => `<section><h1>${escapeHtml(heading)}</h1>${markdownToHtml(markdown)}</section>`).join('\n');
  return `<!doctype html><html lang="pl"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><link rel="stylesheet" href="/template/print/print.css"></head><body class="${escapeHtml(audience)}"><main>${body}</main></body></html>`;
}
