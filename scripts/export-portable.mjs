import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { catalog } from '../template/presentation/catalog.mjs';
import { resolveAppearance } from '../template/presentation/appearance.mjs';
import { resolveWithin } from './safe-paths.mjs';

const mimeTypes = {
  '.avif': 'image/avif', '.gif': 'image/gif', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.pdf': 'application/pdf',
};

function argument(name, argv = process.argv) {
  const index = argv.indexOf(name);
  return index === -1 ? undefined : argv[index + 1];
}

function escapeScript(source) {
  return source.replaceAll('</script', '<\\/script');
}

function escapeStyle(source) {
  return source.replaceAll('</style', '<\\/style');
}

function assertInside(base, candidate) {
  const relative = path.relative(base, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Zasób wychodzi poza repozytorium: ${candidate}`);
  return candidate;
}

async function dataUrl(file) {
  const extension = path.extname(file).toLowerCase();
  const mime = mimeTypes[extension];
  if (!mime) throw new Error(`Nieobsługiwany zasób przenośny: ${path.basename(file)}`);
  return `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
}

async function replaceAsync(source, pattern, replacer) {
  const matches = [...source.matchAll(pattern)];
  if (matches.length === 0) return source;
  let result = '';
  let cursor = 0;
  for (const match of matches) {
    result += source.slice(cursor, match.index);
    result += await replacer(...match);
    cursor = match.index + match[0].length;
  }
  return result + source.slice(cursor);
}

async function inlineCssFile(file, repoRoot, stack = new Set()) {
  const resolved = assertInside(repoRoot, await realpath(path.resolve(file)));
  if (stack.has(resolved)) throw new Error(`Cykliczny import CSS: ${resolved}`);
  const nextStack = new Set(stack).add(resolved);
  let css = await readFile(resolved, 'utf8');
  css = await replaceAsync(css, /@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g, async (_full, reference) => {
    if (/^(?:data:|https?:|\/)/i.test(reference)) throw new Error(`Zewnętrzny lub absolutny import CSS nie jest przenośny: ${reference}`);
    return inlineCssFile(path.resolve(path.dirname(resolved), reference), repoRoot, nextStack);
  });
  css = await replaceAsync(css, /url\(\s*(?:(["'])(.*?)\1|([^)'"\s]+))\s*\)/g, async (full, _quote, quotedReference, bareReference) => {
    const reference = quotedReference ?? bareReference;
    if (/^(?:data:|#)/i.test(reference)) return full;
    if (/^(?:https?:|\/)/i.test(reference)) throw new Error(`Zewnętrzny lub absolutny zasób CSS nie jest przenośny: ${reference}`);
    const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
    const asset = assertInside(repoRoot, await realpath(path.resolve(path.dirname(resolved), cleanReference)));
    return `url("${await dataUrl(asset)}")`;
  });
  return css;
}

async function inlineLessonAssets(markdown, lessonDirectory, repoRoot) {
  return replaceAsync(markdown, /assets\/[A-Za-z0-9._%/-]+/g, async (reference) => {
    const cleanReference = decodeURIComponent(reference);
    const asset = assertInside(repoRoot, await realpath(path.resolve(lessonDirectory, cleanReference)));
    return dataUrl(asset);
  });
}

function componentRuntime(core, components) {
  const plainCore = core.replaceAll(/\bexport\s+function\s+/g, 'function ');
  const plainComponents = components.replace(/^import[^\n]+\n/, '');
  return `${plainCore}\n${plainComponents}`;
}

function portableBoot({ appearance, palette, background }) {
  return `
(() => {
  const appearance = ${JSON.stringify({ ...appearance, background })};
  const palette = ${JSON.stringify(palette)};
  const leafSlides = () => [...document.querySelectorAll('.reveal .slides section')]
    .filter((section) => !section.querySelector(':scope > section'));
  const wrapSlideContent = (slide) => {
    if (slide.querySelector(':scope > .slide-content')) return;
    const content = document.createElement('div');
    content.className = 'slide-content';
    for (const child of [...slide.childNodes]) {
      if (child.nodeType === Node.ELEMENT_NODE && child.matches('aside.notes')) continue;
      content.append(child);
    }
    slide.prepend(content);
  };
  const setBackdrops = () => {
    if (!appearance.background) return;
    const image = 'url(' + JSON.stringify(appearance.background.asset) + ')';
    for (const [index, slide] of leafSlides().entries()) {
      const section = slide.classList.contains('section-slide');
      const scope = appearance.background.scope;
      const shouldApply = scope === 'subtle-all'
        || (scope === 'opening' && index === 0)
        || (scope === 'opening-and-sections' && (index === 0 || section));
      if (shouldApply && slide.dataset.backdrop !== 'off') {
        slide.dataset.backdrop = scope === 'subtle-all' ? 'subtle' : 'image';
        slide.style.setProperty('--appearance-backdrop', image);
      }
    }
  };
  const waitForVisualAssets = async () => {
    await document.fonts?.ready;
    await Promise.all([...document.images].map(async (image) => {
      if (image.complete && image.naturalWidth > 0) return;
      await image.decode?.().catch(() => undefined);
    }));
  };
  const start = async () => {
    document.documentElement.dataset.style = appearance.style;
    document.documentElement.dataset.palette = appearance.palette;
    for (const [token, value] of Object.entries(palette)) document.documentElement.style.setProperty('--color-' + token, value);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    Reveal.on('ready', async () => {
      for (const slide of leafSlides()) {
        slide.dataset.slideCanvas = '';
        wrapSlideContent(slide);
      }
      setBackdrops();
      await waitForVisualAssets();
      Reveal.layout();
      document.documentElement.dataset.presentationReady = 'true';
    });
    await Reveal.initialize({
      width: 1280, height: 720, margin: 0.04, minScale: 0.01, maxScale: 4, center: false,
      hash: true, slideNumber: 'c/t', controlsTutorial: false,
      transition: reducedMotion ? 'none' : 'slide',
      backgroundTransition: reducedMotion ? 'none' : 'fade',
      keyboard: { 83: () => Reveal.configure({ showNotes: Reveal.getConfig().showNotes ? false : 'inline' }) },
      plugins: [RevealMarkdown, RevealNotes],
    });
  };
  start().catch((error) => {
    document.documentElement.dataset.presentationReady = 'error';
    document.body.insertAdjacentHTML('afterbegin', '<p class="presentation-error">Błąd prezentacji: ' + error.message + '</p>');
    console.error(error);
  });
})();`;
}

export async function buildPortablePresentation({ repoRoot, lessonDirectory }) {
  const root = await realpath(repoRoot);
  const lesson = assertInside(root, await realpath(path.resolve(lessonDirectory)));
  const metadata = JSON.parse(await readFile(path.join(lesson, 'metadata.json'), 'utf8'));
  const appearance = resolveAppearance(metadata.appearance, catalog);
  const style = catalog.styles[appearance.style];
  const cssFiles = [
    'template/reveal/reveal.css',
    'template/reveal/theme/white.css',
    'template/components/lesson-components.css',
    'template/presentation/base.css',
    `template/presentation/styles/${style.stylesheet}`,
    path.relative(root, path.join(lesson, 'lesson.css')),
    'template/presentation/canvas.css',
  ];
  const css = (await Promise.all(cssFiles.map((file) => inlineCssFile(path.join(root, file), root)))).join('\n');
  const markdown = await inlineLessonAssets(await readFile(path.join(lesson, 'slides.md'), 'utf8'), lesson, root);
  const background = appearance.background
    ? { ...appearance.background, asset: await dataUrl(assertInside(root, await realpath(path.join(lesson, appearance.background.asset)))) }
    : null;
  const [reveal, markdownPlugin, notesPlugin, componentCore, components] = await Promise.all([
    readFile(path.join(root, 'template/reveal/reveal.js'), 'utf8'),
    readFile(path.join(root, 'template/reveal/plugin/markdown.js'), 'utf8'),
    readFile(path.join(root, 'template/reveal/plugin/notes.js'), 'utf8'),
    readFile(path.join(root, 'template/components/lesson-components-core.mjs'), 'utf8'),
    readFile(path.join(root, 'template/components/lesson-components.js'), 'utf8'),
  ]);
  const title = String(metadata.title || 'Lekcja historii').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${title}</title>
<!-- Tryb przenośny: jeden plik HTML -->
<style>${escapeStyle(css)}</style>
</head>
<body>
<div class="reveal"><div class="slides"><section data-markdown data-separator="^\\r?\\n---\\r?\\n$" data-separator-notes="^\\s*notes?:" data-charset="utf-8"><script type="text/template">${escapeScript(markdown)}</script></section></div></div>
<script>${escapeScript(reveal)}</script>
<script>${escapeScript(markdownPlugin)}</script>
<script>${escapeScript(notesPlugin)}</script>
<script>${escapeScript(componentRuntime(componentCore, components))}</script>
<script>${escapeScript(portableBoot({ appearance, palette: catalog.palettes[appearance.palette], background }))}</script>
</body>
</html>\n`;
}

async function main() {
  const lessonArg = argument('--lesson');
  if (!lessonArg) throw new Error('Użycie: npm run export:portable -- --lesson classes/4/temat [--output prezentacja.html]');
  const root = await realpath(process.cwd());
  const lessonDirectory = await realpath(resolveWithin(root, lessonArg));
  resolveWithin(root, lessonDirectory);
  const outputName = argument('--output') || `${path.basename(lessonDirectory)}-portable.html`;
  if (path.isAbsolute(outputName) || path.dirname(outputName) !== '.' || !outputName.toLowerCase().endsWith('.html')) {
    throw new Error('Nazwa wyjściowa musi być plikiem .html bezpośrednio w katalogu lekcji.');
  }
  const output = resolveWithin(lessonDirectory, outputName);
  const html = await buildPortablePresentation({ repoRoot: root, lessonDirectory });
  await writeFile(output, html, 'utf8');
  console.log(`Zapisano przenośną prezentację: ${path.relative(root, output)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
