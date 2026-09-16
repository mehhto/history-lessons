import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const TEST_PATH_PATTERN = /^tests\/[4-8]\/\d{2}-[^/\\]+\.md$/u;
const TEACHER_KEY_MARKER = '\n<!-- teacher-key -->\n';

async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }

function titleFromMarkdown(markdown, fallback) {
  return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || fallback;
}

export function studentTestMarkdown(markdown) {
  const source = String(markdown);
  const markerIndex = source.indexOf(TEACHER_KEY_MARKER);
  if (markerIndex <= 0 || source.indexOf(TEACHER_KEY_MARKER, markerIndex + TEACHER_KEY_MARKER.length) !== -1) {
    throw new Error('Kartkówka musi mieć dokładnie jeden marker <!-- teacher-key --> oddzielający klucz nauczyciela.');
  }
  return `${source.slice(0, markerIndex).trimEnd()}\n`;
}

export async function listTests({ repoRoot }) {
  const root = path.join(repoRoot, 'tests');
  const tests = [];
  const diagnostics = [];
  for (let grade = 4; grade <= 8; grade += 1) {
    const gradeDirectory = path.join(root, String(grade));
    let entries = [];
    try { entries = await readdir(gradeDirectory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isFile() || !/^(\d{2})-[^/\\]+\.md$/iu.test(entry.name)) continue;
      const file = path.join(gradeDirectory, entry.name);
      if (!await exists(file)) continue;
      try {
        const markdown = await readFile(file, 'utf8');
        const numbered = /^(\d{2})-/.exec(entry.name);
        const details = await stat(file);
        const directory = path.relative(repoRoot, file).split(path.sep).join('/');
        tests.push({ grade, sequence: Number(numbered[1]), title: titleFromMarkdown(markdown, path.basename(entry.name, '.md')), directory, revision: `${details.size}:${Math.floor(details.mtimeMs)}` });
      } catch (error) { diagnostics.push({ directory: file, issues: [error.message] }); }
    }
  }
  tests.sort((a, b) => a.grade - b.grade || a.sequence - b.sequence || a.title.localeCompare(b.title, 'pl'));
  return { tests, diagnostics, catalogRevision: tests.map((item) => `${item.directory}:${item.revision}`).join('|') };
}

export async function testRevisions({ repoRoot }) {
  const catalog = await listTests({ repoRoot });
  return { catalogRevision: catalog.catalogRevision, documentRevisions: Object.fromEntries(catalog.tests.map((item) => [item.directory, item.revision])) };
}
