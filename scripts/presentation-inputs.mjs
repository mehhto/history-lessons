import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createArtifactManifest } from './artifact-freshness.mjs';
import { catalog } from '../template/presentation/catalog.mjs';

async function assetPaths(directory, relative = 'assets') {
  let entries;
  try { entries = await readdir(path.join(directory, relative), { withFileTypes: true }); } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const paths = [];
  for (const entry of entries) {
    const name = path.posix.join(relative, entry.name);
    if (entry.isDirectory()) paths.push(...await assetPaths(directory, name));
    else if (entry.isFile()) paths.push([name, path.join(directory, name)]);
  }
  return paths;
}

export function presentationInputPaths({ repoRoot, lessonDirectory, artifact = true }) {
  return [
    ['slides.md', path.join(lessonDirectory, 'slides.md')],
    ['metadata.json', path.join(lessonDirectory, 'metadata.json')],
    ['lesson.css', path.join(lessonDirectory, 'lesson.css')],
    ['index.html', path.join(lessonDirectory, 'index.html')],
    ...['theme.css', 'presentation/base.css', 'presentation/fonts.css', 'presentation/patterns.css', 'presentation/canvas.css', 'presentation/boot.mjs', 'presentation/appearance.mjs', 'presentation/catalog.mjs', 'presentation/geometry.mjs'].map((file) => [`template/${file}`, path.join(repoRoot, 'template', file)]),
    ...Object.values(catalog.styles).map((style) => [`template/presentation/styles/${style.stylesheet}`, path.join(repoRoot, 'template/presentation/styles', style.stylesheet)]),
    ...['lesson-components.css', 'lesson-components.js', 'lesson-components-core.mjs'].map((file) => [`template/components/${file}`, path.join(repoRoot, 'template/components', file)]),
    ...['reveal.css', 'theme/white.css', 'reveal.js', 'plugin/markdown.js', 'plugin/notes.js'].map((file) => [`template/reveal/${file}`, path.join(repoRoot, 'template/reveal', file)]),
    ['scripts/slide-contract.mjs', path.join(repoRoot, 'scripts/slide-contract.mjs')],
    ...(artifact ? [
      ['scripts/export-pdf.mjs', path.join(repoRoot, 'scripts/export-pdf.mjs')],
      ['package.json', path.join(repoRoot, 'package.json')],
    ] : []),
  ];
}

export async function presentationInputs(options) {
  const paths = [...presentationInputPaths(options), ...await assetPaths(options.lessonDirectory)];
  return Object.fromEntries(await Promise.all(paths.map(async ([name, source]) => [
    name,
    name.startsWith('assets/') ? (await readFile(source)).toString('base64') : await readFile(source, 'utf8'),
  ])));
}

export async function presentationRevision(options) {
  return createArtifactManifest(await presentationInputs({ ...options, artifact: false })).input_hash;
}
