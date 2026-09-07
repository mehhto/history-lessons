import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { catalog } from '../template/presentation/catalog.mjs';

export function presentationInputPaths({ repoRoot, lessonDirectory }) {
  return [
    ['slides.md', path.join(lessonDirectory, 'slides.md')],
    ['metadata.json', path.join(lessonDirectory, 'metadata.json')],
    ['lesson.css', path.join(lessonDirectory, 'lesson.css')],
    ['index.html', path.join(lessonDirectory, 'index.html')],
    ...['theme.css', 'presentation/base.css', 'presentation/fonts.css', 'presentation/patterns.css', 'presentation/canvas.css', 'presentation/boot.mjs', 'presentation/appearance.mjs', 'presentation/catalog.mjs', 'presentation/geometry.mjs'].map((file) => [`template/${file}`, path.join(repoRoot, 'template', file)]),
    ...Object.values(catalog.styles).map((style) => [`template/presentation/styles/${style.stylesheet}`, path.join(repoRoot, 'template/presentation/styles', style.stylesheet)]),
    ...['lesson-components.css', 'lesson-components.js', 'lesson-components-core.mjs'].map((file) => [`template/components/${file}`, path.join(repoRoot, 'template/components', file)]),
    ['scripts/slide-contract.mjs', path.join(repoRoot, 'scripts/slide-contract.mjs')],
    ['scripts/export-pdf.mjs', path.join(repoRoot, 'scripts/export-pdf.mjs')],
    ['package.json', path.join(repoRoot, 'package.json')],
  ];
}

export async function presentationInputs(options) {
  return Object.fromEntries(await Promise.all(presentationInputPaths(options).map(async ([name, source]) => [name, await readFile(source, 'utf8')])));
}
