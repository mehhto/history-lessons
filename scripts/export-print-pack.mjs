import { lstat, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { chromium } from 'playwright';
import { createArtifactManifest } from './artifact-freshness.mjs';
import { documentKindsForLesson, documentPlan, printableHtml } from './print-pack.mjs';
import { resolveWithin } from './safe-paths.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

const lesson = argument('--lesson');
const documentIndex = process.argv.indexOf('--document');
const only = documentIndex === -1 ? undefined : process.argv[documentIndex + 1];
if (documentIndex !== -1 && (!only || only.startsWith('--'))) {
  console.error('Opcja --document wymaga wartości worksheet, teacher albo summary.');
  process.exit(1);
}
if (!lesson) {
  console.error('Użycie: npm run export:print -- --lesson classes/6/temat [--document worksheet|teacher|summary]');
  process.exit(1);
}

const root = await realpath(process.cwd());
const lessonDirectory = await realpath(resolveWithin(root, lesson));
resolveWithin(root, lessonDirectory);
const metadata = JSON.parse(await readFile(path.join(lessonDirectory, 'metadata.json'), 'utf8'));
const summaryPath = path.join(lessonDirectory, 'student-summary.md');
const hasSummary = await readFile(summaryPath, 'utf8').then((content) => Boolean(content.trim())).catch((error) => {
  if (error.code === 'ENOENT') return false;
  throw error;
});
const kinds = only ? [only] : documentKindsForLesson({ lessonType: metadata.lesson_type, hasSummary });
const css = await readFile(path.join(root, 'template/print/print.css'), 'utf8');
const renderer = await readFile(new URL('./print-pack.mjs', import.meta.url), 'utf8');
const exporter = await readFile(new URL('./export-print-pack.mjs', import.meta.url), 'utf8');
const packageSpec = await readFile(path.join(root, 'package.json'), 'utf8');
let artifactManifest = { version: 1, documents: {} };
try {
  const previous = JSON.parse(await readFile(path.join(lessonDirectory, '.print-artifacts.json'), 'utf8'));
  if (previous?.version === 1 && previous.documents && typeof previous.documents === 'object') artifactManifest = previous;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const browser = await chromium.launch({ headless: true });
try {
  for (const kind of kinds) {
    const plan = documentPlan(kind);
    const sections = await Promise.all(plan.sources.map(async (source) => ({
      heading: source === 'assessment.md' ? 'Klucz i ocenianie — tylko dla prowadzącego' : metadata.title,
      markdown: await readFile(resolveWithin(lessonDirectory, source), 'utf8'),
    })));
    const output = resolveWithin(lessonDirectory, plan.output);
    try {
      if ((await lstat(output)).isSymbolicLink()) throw new Error('Plik wyjściowy nie może być dowiązaniem symbolicznym.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const page = await browser.newPage();
    await page.setContent(printableHtml({ title: metadata.title, audience: plan.audience, sections }), { waitUntil: 'load' });
    await page.addStyleTag({ content: css });
    await page.emulateMedia({ media: 'print' });
    const pdf = await page.pdf({ path: output, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } });
    if (kind === 'summary') {
      const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page\b/g) || []).length;
      if (pages !== 1) throw new Error('Podsumowanie ucznia musi mieścić się na jednej stronie A4; skróć treść zamiast zmniejszać font.');
    }
    await page.close();
    const prefix = await readFile(output, { encoding: 'utf8', length: 8 }).catch(() => '');
    if (!prefix.startsWith('%PDF-')) throw new Error(`Eksport ${plan.output} nie utworzył prawidłowego PDF.`);
    artifactManifest.documents[plan.output] = createArtifactManifest({
      ...Object.fromEntries(sections.map((section, index) => [plan.sources[index], section.markdown])),
      'template/print/print.css': css,
      'scripts/print-pack.mjs': renderer,
      'scripts/export-print-pack.mjs': exporter,
      'package.json': packageSpec,
    });
    console.log(`Zapisano PDF: ${path.relative(root, output)}`);
  }
  await writeFile(path.join(lessonDirectory, '.print-artifacts.json'), `${JSON.stringify(artifactManifest, null, 2)}\n`, 'utf8');
} finally {
  await browser.close();
}
