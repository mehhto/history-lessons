import { readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

export async function activeLessonDirectories(root) {
  const classes = path.join(root, 'classes');
  const grades = await readdir(classes, { withFileTypes: true });
  const lessons = [];
  for (const grade of grades.filter((entry) => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const entries = await readdir(path.join(classes, grade.name), { withFileTypes: true });
    for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) lessons.push(path.join('classes', grade.name, entry.name));
  }
  return lessons;
}

async function run(lesson) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/render-check.mjs', '--lesson', lesson], { stdio: 'inherit', env: process.env });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${lesson}: render check failed (${code})`)));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.cwd();
  const lessons = await activeLessonDirectories(root);
  for (const lesson of lessons) await run(lesson);
}
