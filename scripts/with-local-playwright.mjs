import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const [targetArgument, ...targetArguments] = process.argv.slice(2);
if (!targetArgument) {
  console.error('Użycie: node scripts/with-local-playwright.mjs <skrypt.mjs> [...argumenty]');
  process.exit(1);
}

const repositoryRoot = path.resolve(import.meta.dirname, '..');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(repositoryRoot, '.playwright-browsers');

const target = path.isAbsolute(targetArgument)
  ? targetArgument
  : path.resolve(repositoryRoot, targetArgument);

process.argv = [process.execPath, target, ...targetArguments];
await import(pathToFileURL(target).href);
