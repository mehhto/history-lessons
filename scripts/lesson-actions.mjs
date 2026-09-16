import path from 'node:path';
import process from 'node:process';
import { stat } from 'node:fs/promises';
import { resolveWithin } from './safe-paths.mjs';

async function fileExists(file) { try { return (await stat(file)).isFile(); } catch { return false; } }

const ACTIONS = {
  portable: { script: 'scripts/export-portable.mjs', browser: false, artifact: ({ id }) => `${id}-portable.html` },
  presentationPdf: { script: 'scripts/export-pdf.mjs', browser: true, artifact: () => 'presentation-backup.pdf' },
  worksheet: { script: 'scripts/export-print-pack.mjs', browser: true, document: 'worksheet', artifact: () => 'worksheet.pdf' },
  teacher: { script: 'scripts/export-print-pack.mjs', browser: true, document: 'teacher', artifact: () => 'teacher-pack.pdf' },
  summary: { script: 'scripts/export-print-pack.mjs', browser: true, document: 'summary', artifact: () => 'student-summary.pdf' },
  printPack: { script: 'scripts/export-print-pack.mjs', browser: true, artifact: () => null },
  renderCheck: { script: 'scripts/render-check.mjs', browser: true, artifact: () => null },
};

export const allowedActions = Object.freeze(Object.keys(ACTIONS));

export async function resolveLessonAction({ repoRoot, lesson, action }) {
  const config = ACTIONS[action];
  if (!config) throw new Error('Nieznana operacja.');
  if (typeof lesson !== 'string' || !lesson.startsWith('classes/')) throw new Error('Nieprawidłowa lekcja.');
  const lessonDirectory = resolveWithin(repoRoot, lesson);
  if (!await fileExists(path.join(lessonDirectory, 'metadata.json'))) throw new Error('Nie znaleziono lekcji.');
  if (action === 'summary' && !await fileExists(path.join(lessonDirectory, 'student-summary.md'))) throw new Error('Ta lekcja nie ma notatki ucznia do druku.');
  const id = path.basename(lessonDirectory);
  const target = config.browser ? 'scripts/with-local-playwright.mjs' : config.script;
  const args = config.browser ? [target, config.script, '--lesson', lesson] : [target, '--lesson', lesson];
  if (config.document) args.push('--document', config.document);
  const artifactName = config.artifact({ id });
  return { command: process.execPath, args, cwd: repoRoot, artifact: artifactName ? `${lesson}/${artifactName}` : null, usesBrowser: config.browser };
}
