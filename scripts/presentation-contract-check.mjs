import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

import { parseLessonMetadata } from './lesson-quality.mjs';
import { inspectPresentationContract } from './presentation-contract.mjs';
import { presentationRevision } from './presentation-inputs.mjs';
import { compositionIssues, slideBlocks } from './check-slide-composition.mjs';
import { auditSlideContract, parseSlideDirectives } from './slide-contract.mjs';

async function regularText(file) {
  if ((await lstat(file)).isSymbolicLink()) throw new Error('Ścieżka wskazuje poza dozwolonym katalogiem.');
  return readFile(file, 'utf8');
}

export async function contractReview(lessonDirectory) {
  const file = path.join(lessonDirectory, 'contract-review.json');
  try {
    if ((await lstat(file)).isSymbolicLink()) throw new Error('contract-review.json nie może być dowiązaniem symbolicznym.');
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function explicitElementIds(markdown) {
  return [...markdown.replace(/<!--\s*\.slide:[\s\S]*?-->/gu, '').replace(/^```[\s\S]*?^```/gmu, '').matchAll(/<[A-Za-z][^>]*\bid\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s"'=<>`]+))/gu)].map((match) => match[1] ?? match[2] ?? match[3]);
}

function explicitElementTargets(markdown, slides) {
  return markdown.split(/^\r?\n---\r?\n$/mu).flatMap((block, index) => explicitElementIds(block).map((id) => ({ slide: slides[index]?.id, id })));
}

export async function inspectLessonContract({ repoRoot, lessonDirectory }) {
  const [metadataText, slidesMarkdown, review, revision] = await Promise.all([
    regularText(path.join(lessonDirectory, 'metadata.json')),
    regularText(path.join(lessonDirectory, 'slides.md')),
    contractReview(lessonDirectory),
    presentationRevision({ repoRoot, lessonDirectory }),
  ]);
  const metadata = parseLessonMetadata(metadataText);
  const slides = parseSlideDirectives(slidesMarkdown);
  const slideContract = auditSlideContract(slides, { lessonType: metadata.lesson_type, kind: metadata.kind });
  const report = inspectPresentationContract({
    metadata,
    presentationRevision: revision,
    review,
    slideIds: slides.map((slide) => slide.id).filter(Boolean),
    elementIds: explicitElementIds(slidesMarkdown),
    elementTargets: explicitElementTargets(slidesMarkdown, slides),
    staticIssues: slideContract.errors,
  });
  report.static.warnings = [...slideContract.warnings, ...slideBlocks(slidesMarkdown).flatMap((slide, index) => compositionIssues(slide).map((issue) => `slajd ${index + 1}: ${issue}`))];
  return report;
}
