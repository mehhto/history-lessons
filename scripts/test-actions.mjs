import path from 'node:path';
import process from 'node:process';
import { lstat } from 'node:fs/promises';
import { TEST_PATH_PATTERN } from './test-catalog.mjs';
import { resolveWithin } from './safe-paths.mjs';

async function regularFile(file, missingMessage) {
  try {
    const details = await lstat(file);
    if (details.isSymbolicLink() || !details.isFile()) throw new Error(missingMessage);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(missingMessage);
    throw error;
  }
}

export async function resolveTestAction({ repoRoot, test, action }) {
  if (action !== 'testPdf') throw new Error('Nieznana operacja dla kartkówki.');
  if (typeof test !== 'string' || !TEST_PATH_PATTERN.test(test)) throw new Error('Nieprawidłowa kartkówka.');
  const source = resolveWithin(repoRoot, test);
  await regularFile(source, 'Nie znaleziono kartkówki.');
  return {
    command: process.execPath,
    args: ['scripts/with-local-playwright.mjs', 'scripts/export-test-pdf.mjs', '--test', test],
    cwd: repoRoot,
    artifact: test.replace(/\.md$/iu, '.pdf'),
    usesBrowser: true,
    id: path.basename(source, '.md'),
  };
}
