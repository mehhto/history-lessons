import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { validateLessonIdentity, validateLessonPackage } from './lesson-tools.mjs';
import { assessLessonQuality, parseLessonMetadata } from './lesson-quality.mjs';
import { isArtifactFresh } from './artifact-freshness.mjs';
import { documentKindsForLesson, omittedDocumentKindsForLesson, documentPlan } from './print-pack.mjs';
import { listTests, studentTestMarkdown } from './test-catalog.mjs';
import { presentationInputs } from './presentation-inputs.mjs';
import { inspectLessonContract } from './presentation-contract-check.mjs';

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
  const inputs = await presentationInputs({ repoRoot, lessonDirectory });
  return isArtifactFresh(manifest, inputs);
}

async function printPackFresh(lessonDirectory, repoRoot, metadata) {
  const manifestPath = path.join(lessonDirectory, '.print-artifacts.json');
  if (!(await exists(manifestPath))) return false;
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); } catch { return false; }
  const css = await readFile(path.join(repoRoot, 'template/print/print.css'), 'utf8');
  const renderer = await readFile(path.join(repoRoot, 'scripts/print-pack.mjs'), 'utf8');
  const exporter = await readFile(path.join(repoRoot, 'scripts/export-print-pack.mjs'), 'utf8');
  const packageSpec = await readFile(path.join(repoRoot, 'package.json'), 'utf8');
  const hasSummary = await readFile(path.join(lessonDirectory, 'student-summary.md'), 'utf8')
    .then((content) => Boolean(content.trim()))
    .catch((error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    });
  const expectedKinds = documentKindsForLesson({ lessonType: metadata.lesson_type, hasSummary });
  for (const kind of omittedDocumentKindsForLesson({ lessonType: metadata.lesson_type, hasSummary })) {
    const output = documentPlan(kind).output;
    if ((await exists(path.join(lessonDirectory, output))) || manifest.documents?.[output]) return false;
  }
  for (const kind of expectedKinds) {
    const plan = documentPlan(kind);
    if (!(await exists(path.join(lessonDirectory, plan.output)))) return false;
    const inputs = Object.fromEntries(await Promise.all(plan.sources.map(async (source) => [source, await readFile(path.join(lessonDirectory, source), 'utf8')])));
    inputs['template/print/print.css'] = css;
    inputs['scripts/print-pack.mjs'] = renderer;
    inputs['scripts/export-print-pack.mjs'] = exporter;
    inputs['package.json'] = packageSpec;
    inputs['metadata.json'] = JSON.stringify(metadata);
    if (!isArtifactFresh(manifest.documents?.[plan.output], inputs)) return false;
  }
  return true;
}

async function testPdfFresh(testFile, repoRoot) {
  const output = testFile.replace(/\.md$/iu, '.pdf');
  const manifestPath = path.join(path.dirname(testFile), '.test-artifacts.json');
  if (!(await exists(output)) || !(await exists(manifestPath))) return false;
  const pdf = await readFile(output);
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-'))) return false;
  try {
    const [manifest, markdown, css, renderer, exporter, packageSpec] = await Promise.all([
      readFile(manifestPath, 'utf8').then(JSON.parse),
      readFile(testFile, 'utf8'),
      readFile(path.join(repoRoot, 'template/print/print.css'), 'utf8'),
      readFile(path.join(repoRoot, 'scripts/print-pack.mjs'), 'utf8'),
      readFile(path.join(repoRoot, 'scripts/export-test-pdf.mjs'), 'utf8'),
      readFile(path.join(repoRoot, 'package.json'), 'utf8'),
    ]);
    const inputs = { [path.basename(testFile)]: markdown, 'student-print-view': studentTestMarkdown(markdown), 'template/print/print.css': css, 'scripts/print-pack.mjs': renderer, 'scripts/export-test-pdf.mjs': exporter, 'package.json': packageSpec };
    return isArtifactFresh(manifest.documents?.[path.basename(output)], inputs);
  } catch { return false; }
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
      if (metadata.kind !== 'demo') {
        const identityIssues = validateLessonIdentity({ directoryName: path.basename(lesson.directory), metadata });
        if (identityIssues.length > 0) throw new Error(identityIssues.join(' '));
      }
      const contentFiles = [...lesson.names].filter((name) => name.endsWith('.md') || name === 'metadata.json');
      const requiredContent = Object.fromEntries(await Promise.all(contentFiles
        .map(async (name) => [name, await readFile(path.join(lesson.directory, name), 'utf8')])));
      const report = assessLessonQuality({
        metadata,
        requiredFilesPresent: structure.ok,
        requiredContent,
        artifacts: {
          presentationPdf: metadata.pdf_exported && await presentationFresh(lesson.directory, process.cwd()),
          printPack: await printPackFresh(lesson.directory, process.cwd(), metadata),
        },
      });
      const contract = metadata.presentationContract === undefined ? null : await inspectLessonContract({ repoRoot: process.cwd(), lessonDirectory: lesson.directory });
      const status = report.ready ? 'GOTOWA' : 'WYMAGA DALSZEGO PRZEGLĄDU';
      if (report.slideContract.errors.length || contract?.static.status === 'fail' || ['browser', 'human'].some((gate) => contract?.[gate].status === 'fail')) errors += 1;
      if (!report.ready || (contract && !contract.presentationAccepted)) pending += 1;
      console.log(`${status}  ${label}`);
      for (const issue of [...report.technical.issues, ...report.teacherApproval.issues, ...report.slideContract.errors]) console.log(`  · ${issue}`);
      for (const warning of [...report.teachingWarnings.issues, ...report.slideContract.warnings]) console.log(`  ⚠ ${warning}`);
      if (contract) {
        for (const issue of [...contract.static.issues, ...contract.browser.issues, ...contract.human.issues]) console.log(`  · Kontrakt prezentacji: ${issue}`);
        for (const warning of contract.static.warnings ?? []) console.log(`  ⚠ Kontrakt prezentacji: ${warning}`);
      }
    } catch (error) {
      errors += 1;
      console.error(`BŁĄD  ${label}: ${error.message}`);
    }
  }
}

const testCatalog = await listTests({ repoRoot: process.cwd() });
for (const item of testCatalog.tests) {
  const fresh = await testPdfFresh(path.join(process.cwd(), item.directory), process.cwd());
  if (!fresh) {
    pending += 1;
    console.log(`WYMAGA DALSZEGO PRZEGLĄDU  ${item.directory}`);
    console.log('  · Brakuje aktualnego PDF kartkówki lub manifestu świeżości.');
  }
}
for (const diagnostic of testCatalog.diagnostics) {
  errors += 1;
  console.error(`BŁĄD  ${diagnostic.directory}: ${diagnostic.issues.join(' ')}`);
}

if (errors > 0 || (pending > 0 && !allowPending)) {
  if (pending > 0 && !allowPending) console.error(`\n${pending} pakiet(y) nie są jeszcze gotowe. Użyj --allow-pending wyłącznie do raportu stanu.`);
  process.exitCode = 1;
}
