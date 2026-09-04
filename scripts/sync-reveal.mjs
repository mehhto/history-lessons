import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'node_modules', 'reveal.js', 'dist');
const target = path.join(root, 'template', 'reveal');
const files = [
  'reveal.js',
  'reveal.css',
  'theme/white.css',
  'plugin/markdown.js',
  'plugin/notes.js',
];

await rm(target, { recursive: true, force: true });
for (const file of files) {
  const destination = path.join(target, file);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(source, file), destination);
}
console.log('Skopiowano minimalny, lokalny zestaw Reveal.js do template/reveal/.');
