import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { createArtifactManifest } from './artifact-freshness.mjs';
import { embedLocalImagesInHtml, printableHtml } from './print-pack.mjs';
import { TEST_PATH_PATTERN, studentTestMarkdown } from './test-catalog.mjs';
import { resolveWithin } from './safe-paths.mjs';
import { localChromiumExecutable } from '../test/support/local-chromium.mjs';

function argument(name) { const index = process.argv.indexOf(name); return index === -1 ? undefined : process.argv[index + 1]; }
function titleFromMarkdown(markdown, fallback) { return /^#\s+(.+)$/m.exec(markdown)?.[1]?.trim() || fallback; }
async function ensureRegularOutput(file) {
  try { if ((await lstat(file)).isSymbolicLink()) throw new Error('Plik wyjściowy nie może być dowiązaniem symbolicznym.'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

const test = argument('--test');
if (!test || !TEST_PATH_PATTERN.test(test)) {
  console.error('Użycie: node scripts/export-test-pdf.mjs --test tests/5/01-temat.md');
  process.exit(1);
}

const root = await realpath(process.cwd());
const source = resolveWithin(root, test);
if ((await lstat(source)).isSymbolicLink()) throw new Error('Źródło kartkówki nie może być dowiązaniem symbolicznym.');
const markdown = await readFile(source, 'utf8');
const studentMarkdown = studentTestMarkdown(markdown);
const imagePaths = [...studentMarkdown.matchAll(/!\[[^\]]*\]\((assets\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|webp))\)/gi)].map((match) => match[1]);
const output = resolveWithin(root, test.replace(/\.md$/iu, '.pdf'));
const manifestPath = path.join(path.dirname(source), '.test-artifacts.json');
await ensureRegularOutput(output);
await ensureRegularOutput(manifestPath);
const css = await readFile(path.join(root, 'template/print/print.css'), 'utf8');
const testCss = await readFile(path.join(root, 'template/print/test.css'), 'utf8');
const renderer = await readFile(new URL('./print-pack.mjs', import.meta.url), 'utf8');
const exporter = await readFile(new URL('./export-test-pdf.mjs', import.meta.url), 'utf8');
const packageSpec = await readFile(path.join(root, 'package.json'), 'utf8');
const title = titleFromMarkdown(markdown, path.basename(source, '.md'));
const browser = await chromium.launch({ headless: true, executablePath: await localChromiumExecutable(root) });
try {
  const page = await browser.newPage();
  await page.setContent(await embedLocalImagesInHtml(printableHtml({ title, audience: 'student', sections: [{ markdown: studentMarkdown }] }), path.dirname(source)), { waitUntil: 'load' });
  await page.locator('body').evaluate((body, exam) => { body.dataset.exam = exam; }, path.basename(source, '.md'));
  await page.addStyleTag({ content: `${css}\n${testCss}` });
  await page.emulateMedia({ media: 'print' });
  await page.pdf({ path: output, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
  await page.close();
  const prefix = await readFile(output, { encoding: 'utf8', length: 8 }).catch(() => '');
  if (!prefix.startsWith('%PDF-')) throw new Error('Eksport kartkówki nie utworzył prawidłowego PDF.');
  const images = Object.fromEntries(await Promise.all(imagePaths.map(async (image) => [image, (await readFile(resolveWithin(path.dirname(source), image))).toString('base64')])));
  const manifest = createArtifactManifest({ [path.basename(source)]: markdown, 'student-print-view': studentMarkdown, ...images, 'template/print/print.css': css, 'template/print/test.css': testCss, 'scripts/print-pack.mjs': renderer, 'scripts/export-test-pdf.mjs': exporter, 'package.json': packageSpec });
  let previous = { version: 1, documents: {} };
  try { previous = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (previous.version !== 1 || !previous.documents || typeof previous.documents !== 'object' || Array.isArray(previous.documents)) throw new Error('Nieprawidłowy manifest sprawdzianów.');
  await writeFile(manifestPath, `${JSON.stringify({ version: 1, documents: { ...previous.documents, [path.basename(output)]: manifest } }, null, 2)}\n`, 'utf8');
  console.log(`Zapisano PDF: ${path.relative(root, output)}`);
} finally { await browser.close(); }
