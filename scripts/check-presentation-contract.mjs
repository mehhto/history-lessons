import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parseLessonMetadata } from './lesson-quality.mjs';
import { auditSlideContract, parseSlideDirectives } from './slide-contract.mjs';
import { inspectPresentationContract } from './presentation-contract.mjs';
import { resolveWithin } from './safe-paths.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function realpathWithin(root, candidate) {
  return resolveWithin(root, await realpath(resolveWithin(root, candidate)));
}

function explicitElementIds(markdown) {
  const content = markdown
    .replace(/<!--\s*\.slide:[\s\S]*?-->/gu, '')
    .replace(/^```[\s\S]*?^```/gmu, '');
  return [...content.matchAll(/<[A-Za-z][^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/gu)]
    .map((match) => match[1] ?? match[2] ?? match[3]);
}

function explicitElementTargets(markdown, slides) {
  return markdown.split(/^\r?\n---\r?\n$/mu).flatMap((block, index) =>
    explicitElementIds(block).map((id) => ({ slide: slides[index]?.id, id })),
  );
}

function printHuman(report, lesson) {
  if (!report.applicable) {
    console.log(`POMINIĘTO  ${lesson}: brak jawnego opt-in presentationContract.version.`);
    return;
  }
  const status = report.static.status === 'pass' ? 'STATIC OK' : 'STATIC BŁĄD';
  console.log(`${status}  ${lesson} (kontrakt ${report.version ?? 'brak'})`);
  for (const issue of report.static.issues) console.log(`  · ${issue}`);
  console.log(`  readyForTeacher: ${report.readyForTeacher ? 'TAK' : 'NIE'}`);
  if (report.browser.status === 'pending') console.log('  · Oczekuje na przegląd przeglądarkowy.');
  if (report.human.status === 'pending') console.log('  · Oczekuje na jeden przegląd człowieka.');
}

const lesson = argument('--lesson');
const json = process.argv.includes('--json');
if (!lesson) {
  console.error('Użycie: npm run check:contract -- --lesson classes/6/01-temat [--json]');
  process.exitCode = 1;
} else {
  try {
    const root = await realpath(process.cwd());
    const lessonDirectory = await realpathWithin(root, lesson);
    const [metadataPath, slidesPath] = await Promise.all([
      realpathWithin(root, path.join(lessonDirectory, 'metadata.json')),
      realpathWithin(root, path.join(lessonDirectory, 'slides.md')),
    ]);
    const [metadataText, slidesMarkdown] = await Promise.all([
      readFile(metadataPath, 'utf8'),
      readFile(slidesPath, 'utf8'),
    ]);
    const metadata = parseLessonMetadata(metadataText);
    const slides = parseSlideDirectives(slidesMarkdown);
    const slideContract = auditSlideContract(slides, {
      lessonType: metadata.lesson_type,
      kind: metadata.kind,
    });
    const report = inspectPresentationContract({
      metadata,
      slideIds: slides.map((slide) => slide.id).filter(Boolean),
      elementIds: explicitElementIds(slidesMarkdown),
      elementTargets: explicitElementTargets(slidesMarkdown, slides),
      staticIssues: slideContract.errors,
    });
    report.static.warnings = slideContract.warnings;

    if (json) console.log(JSON.stringify(report, null, 2));
    else printHuman(report, lesson);
    if (report.static.status === 'fail') process.exitCode = 1;
  } catch (error) {
    if (json) console.log(JSON.stringify({ error: error.message }, null, 2));
    else console.error(`BŁĄD  ${lesson}: ${error.message}`);
    process.exitCode = 1;
  }
}
