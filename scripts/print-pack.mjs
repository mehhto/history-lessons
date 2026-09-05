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

export function markdownToHtml(markdown) {
  const lines = String(markdown).replace(/\r/g, '').split('\n');
  const output = [];
  let list = false;
  const closeList = () => { if (list) { output.push('</ul>'); list = false; } };
  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const item = line.match(/^\s*[-*]\s+(.+)$/);
    if (heading) {
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
