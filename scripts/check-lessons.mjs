import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateLessonPackage } from './lesson-tools.mjs';
import { assessLessonQuality, parseLessonMetadata } from './lesson-quality.mjs';
import { isArtifactFresh } from './artifact-freshness.mjs';
import { documentPlan } from './print-pack.mjs';

async function lessonDirectories(root) {
  const found = [];
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const names = new Set(entries.map((entry) => `${entry.name}${entry.isDirectory() ? '/' : ''}`));
    if (names.has('lesson.md')) {
      found.push({ directory, names });
      return;
    }
    for (const entry of entries) if (entry.isDirectory()) await walk(path.join(directory, entry.name));
  }
  try { await stat(root); await walk(root); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  return found;
}

async function exists(file) {
  try { await access(file); return true; } catch { return false; }
}

async function presentationFresh(lessonDirectory, repoRoot) {
  const artifactPath = path.join(lessonDirectory, '.presentation-artifact.json');
  const pdfPath = path.join(lessonDirectory, 'presentation-backup.pdf');
  if (!(await exists(artifactPath)) || !(await exists(pdfPath))) return false;
  let manifest;
  try { manifest = JSON.parse(await readFile(artifactPath, 'utf8')); } catch { return false; }
  const pdf = await readFile(pdfPath);
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) return false;
  const inputs = Object.fromEntries(await Promise.all([
    ['slides.md', path.join(lessonDirectory, 'slides.md')],
    ['lesson.css', path.join(lessonDirectory, 'lesson.css')],
    ['index.html', path.join(lessonDirectory, 'index.html')],
    ['template/theme.css', path.join(repoRoot, 'template/theme.css')],
    ['template/components/lesson-components.css', path.join(repoRoot, 'template/components/lesson-components.css')],
    ['template/components/lesson-components.js', path.join(repoRoot, 'template/components/lesson-components.js')],
    ['scripts/export-pdf.mjs', path.join(repoRoot, 'scripts/export-pdf.mjs')],
    ['package.json', path.join(repoRoot, 'package.json')],
  ].map(async ([name, source]) => [name, await readFile(source, 'utf8')])));
  return isArtifactFresh(manifest, inputs);
}

async function printPackFresh(lessonDirectory, repoRoot) {
  const manifestPath = path.join(lessonDirectory, '.print-artifacts.json');
  if (!(await exists(manifestPath))) return false;
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { return false; }
  const css = await readFile(path.join(repoRoot, 'template/print/print.css'), 'utf8');
  const renderer = await readFile(path.join(repoRoot, 'scripts/print-pack.mjs'), 'utf8');
  const exporter = await readFile(path.join(repoRoot, 'scripts/export-print-pack.mjs'), 'utf8');
  const packageSpec = await readFile(path.join(repoRoot, 'package.json'), 'utf8');
  for (const kind of ['worksheet', 'teacher', 'summary']) {
    const plan = documentPlan(kind);
    if (!(await exists(path.join(lessonDirectory, plan.output)))) return false;
    const inputs = Object.fromEntries(await Promise.all(plan.sources.map(async (source) => [source, await readFile(path.join(lessonDirectory, source), 'utf8')])));
    inputs['template/print/print.css'] = css;
    inputs['scripts/print-pack.mjs'] = renderer;
    inputs['scripts/export-print-pack.mjs'] = exporter;
    inputs['package.json'] = packageSpec;
    if (!isArtifactFresh(manifest.documents?.[plan.output], inputs)) return false;
  }
  return true;
}

const root = path.resolve(process.cwd(), 'classes');
const allowPending = process.argv.includes('--allow-pending');
const lessons = await lessonDirectories(root);
let errors = 0;
let pending = 0;

if (lessons.length === 0) {
  console.log('Brak lekcji do sprawdzenia. Utwórz pierwszą: npm run new -- --class 6 --title "Temat"');
} else {
  for (const lesson of lessons) {
    const structure = validateLessonPackage(lesson.names);
    const label = path.relative(process.cwd(), lesson.directory);
    if (!structure.ok) {
      errors += 1;
      console.error(`BRAK  ${label}: ${structure.missing.join(', ')}`);
      continue;
    }
    try {
      const metadata = parseLessonMetadata(await readFile(path.join(lesson.directory, 'metadata.json'), 'utf8'));
      const contentFiles = [...lesson.names].filter((name) => name.endsWith('.md') || name === 'metadata.json');
      const requiredContent = Object.fromEntries(await Promise.all(contentFiles
        .map(async (name) => [name, await readFile(path.join(lesson.directory, name), 'utf8')])));
      const report = assessLessonQuality({
        metadata,
        requiredFilesPresent: structure.ok,
        requiredContent,
        artifacts: {
          presentationPdf: metadata.pdf_exported && await presentationFresh(lesson.directory, process.cwd()),
          printPack: await printPackFresh(lesson.directory, process.cwd()),
        },
      });
      const status = report.ready ? 'GOTOWA' : 'WYMAGA DALSZEGO PRZEGLĄDU';
      if (!report.ready) pending += 1;
      console.log(`${status}  ${label}`);
      for (const issue of [...report.technical.issues, ...report.teacherApproval.issues]) console.log(`  · ${issue}`);
    } catch (error) {
      errors += 1;
      console.error(`BŁĄD  ${label}: ${error.message}`);
    }
  }
}

if (errors > 0 || (pending > 0 && !allowPending)) {
  if (pending > 0 && !allowPending) console.error(`\n${pending} pakiet(y) nie są jeszcze gotowe. Użyj --allow-pending wyłącznie do raportu stanu.`);
  process.exitCode = 1;
}
