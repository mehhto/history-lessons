import { cp, mkdir, rename, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'node_modules', 'reveal.js', 'dist');
const target = path.join(root, 'template', 'reveal');
const staging = path.join(root, 'template', `.reveal-staging-${process.pid}`);
const backup = path.join(root, 'template', `.reveal-backup-${process.pid}`);
const files = [
  'reveal.js',
  'reveal.css',
  'theme/white.css',
  'plugin/markdown.js',
  'plugin/notes.js',
];

await rm(staging, { recursive: true, force: true });
try {
  for (const file of files) {
    const sourceFile = path.join(source, file);
    if (!(await stat(sourceFile)).isFile()) {
      throw new Error(`Brakuje wymaganego pliku Reveal.js: ${file}`);
    }
    const destination = path.join(staging, file);
    await mkdir(path.dirname(destination), { recursive: true });
    await cp(sourceFile, destination);
  }

  await rename(target, backup);
  try {
    await rename(staging, target);
  } catch (error) {
    try {
      await rename(backup, target);
    } catch (restoreError) {
      throw new AggregateError([error, restoreError], 'Nie udało się aktywować ani przywrócić Reveal.js.');
    }
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
  console.log('Skopiowano minimalny, lokalny zestaw Reveal.js do template/reveal/.');
} finally {
  await rm(staging, { recursive: true, force: true });
}
