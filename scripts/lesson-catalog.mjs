import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { validateLessonIdentity, validateLessonPackage } from './lesson-tools.mjs';

const SOURCE_NAMES = new Set(['metadata.json', 'slides.md', 'lesson.css', 'index.html', 'lesson.md', 'worksheet.md', 'teacher-guide.md', 'assessment.md', 'student-summary.md']);
const IGNORED_NAMES = new Set(['.hermes', 'node_modules']);

async function exists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }

async function fingerprint(directory, relative = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const parts = [];
  for (const entry of entries) {
    if (IGNORED_NAMES.has(entry.name) || entry.name.endsWith('.pdf') || entry.name.endsWith('-portable.html') || entry.name.startsWith('.')) continue;
    const child = path.join(directory, entry.name);
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'assets') parts.push(...await fingerprint(child, name));
    } else if (SOURCE_NAMES.has(entry.name) || relative === 'assets') {
      const details = await stat(child);
      parts.push(`${name}:${details.size}:${Math.floor(details.mtimeMs)}`);
    }
  }
  return parts.sort();
}

export async function listLessons({ repoRoot }) {
  const classes = path.join(repoRoot, 'classes');
  const lessons = [];
  const diagnostics = [];
  for (let grade = 4; grade <= 8; grade += 1) {
    const gradeDirectory = path.join(classes, String(grade));
    let entries = [];
    try { entries = await readdir(gradeDirectory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const directory = path.join(gradeDirectory, entry.name);
      const metadataPath = path.join(directory, 'metadata.json');
      if (!await exists(metadataPath)) continue;
      try {
        const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
        const packageEntries = new Set((await readdir(directory, { withFileTypes: true })).map((item) => item.isDirectory() ? `${item.name}/` : item.name));
        const identityIssues = validateLessonIdentity({ directoryName: entry.name, metadata });
        const packageStatus = validateLessonPackage(packageEntries);
        const numbered = /^(\d{2})-/.exec(entry.name);
        if (!numbered) { diagnostics.push({ directory, issues: ['Katalog pomocniczy lub bez numeru lekcji.'] }); continue; }
        const revision = (await fingerprint(directory)).join('|');
        const relativeDirectory = path.relative(repoRoot, directory).split(path.sep).join('/');
        lessons.push({
          grade, id: metadata.id, title: metadata.title, sequence: Number(numbered[1]), directory: relativeDirectory,
          revision, valid: identityIssues.length === 0 && packageStatus.ok,
          issues: [...identityIssues, ...packageStatus.missing.map((missing) => `Brakuje ${missing}`)],
          capabilities: { summary: await exists(path.join(directory, 'student-summary.md')) && Boolean((await readFile(path.join(directory, 'student-summary.md'), 'utf8')).trim()) },
        });
      } catch (error) { diagnostics.push({ directory, issues: [error.message] }); }
    }
  }
  lessons.sort((a, b) => a.grade - b.grade || a.sequence - b.sequence || a.title.localeCompare(b.title, 'pl'));
  return { lessons, diagnostics, catalogRevision: lessons.map((lesson) => `${lesson.directory}:${lesson.revision}`).join('|') };
}

export async function revisions({ repoRoot }) {
  const catalog = await listLessons({ repoRoot });
  return { catalogRevision: catalog.catalogRevision, presentationRevisions: Object.fromEntries(catalog.lessons.map((lesson) => [lesson.directory, lesson.revision])) };
}
