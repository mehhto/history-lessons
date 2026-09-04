import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateLessonPackage } from './lesson-tools.mjs';

async function lessonDirectories(root) {
  const found = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const names = new Set(entries.map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`));
    if (names.has('lesson.md')) {
      found.push({ directory, names });
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) await walk(path.join(directory, entry.name));
    }
  }
  try {
    await stat(root);
    await walk(root);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return found;
}

const root = path.resolve(process.cwd(), 'classes');
const lessons = await lessonDirectories(root);
let errors = 0;

if (lessons.length === 0) {
  console.log('Brak lekcji do sprawdzenia. Utwórz pierwszą: npm run new -- --class 6 --title "Temat"');
} else {
  for (const lesson of lessons) {
    const report = validateLessonPackage(lesson.names);
    const label = path.relative(process.cwd(), lesson.directory);
    if (report.ok) {
      console.log(`OK  ${label}`);
    } else {
      errors += 1;
      console.error(`BRAK  ${label}: ${report.missing.join(', ')}`);
    }
  }
}

if (errors > 0) process.exitCode = 1;
