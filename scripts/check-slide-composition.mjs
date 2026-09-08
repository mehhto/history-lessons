import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

export function compositionIssues({ purpose = '', layout = '', textLength = 0, html = '' }) {
  const issues = [];
  if (textLength < 55 && !['opening', 'question', 'exit-ticket'].includes(purpose) && !layout) issues.push('krótki slajd bez zamierzonego layoutu');
  if (purpose === 'evidence' && !/<(?:img|lesson-map|lesson-gallery|figure)\b/i.test(html)) issues.push('slajd evidence nie zawiera źródła');
  if (layout === 'task-board' || layout === 'activity-brief') {
    if (!/class="student-task"/.test(html)) issues.push('task-board nie zawiera .student-task');
    for (const role of ['prompt', 'time', 'product', 'criterion']) if (!new RegExp(`data-task-role="${role}"`).test(html)) issues.push(`task-board: brak pola ${role === 'criterion' ? 'kryterium' : role}`);
  }
  return issues;
}

export function slideBlocks(markdown) {
  return markdown.split(/^---\s*$/m).map((html) => {
    const directive = html.match(/<!--\s*\.slide:\s*([^>]+?)-->/);
    const purpose = directive?.[1].match(/data-purpose="([^"]+)"/)?.[1] || '';
    const layout = directive?.[1].match(/data-layout="([^"]+)"/)?.[1] || '';
    return { purpose, layout, textLength: html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length, html };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const index = process.argv.indexOf('--lesson');
  if (index === -1) throw new Error('Użycie: node scripts/check-slide-composition.mjs --lesson classes/6/temat');
  const markdown = await readFile(path.join(process.cwd(), process.argv[index + 1], 'slides.md'), 'utf8');
  const issues = slideBlocks(markdown).flatMap((slide, number) => compositionIssues(slide).map((issue) => `slajd ${number + 1}: ${issue}`));
  if (issues.length) { console.warn(issues.map((issue) => `⚠ ${issue}`).join('\n')); }
  else console.log('Kompozycja OK: kontrakty dokumentalnego Atlasu spełnione.');
}
