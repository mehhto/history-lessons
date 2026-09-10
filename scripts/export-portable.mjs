import { lstat, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { build as bundle } from 'esbuild';
import { marked } from 'marked';
import { parseFragment } from 'parse5';
import postcss from 'postcss';
import valueParser from 'postcss-value-parser';
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

function escapeRawText(source, element) {
  return source.replace(new RegExp(`</${element}`, 'gi'), `<\\/${element}`);
}

const automaticResources = new Map([
  ['audio', new Set(['src'])],
  ['embed', new Set(['src'])],
  ['iframe', new Set(['src'])],
  ['image', new Set(['href', 'xlink:href'])],
  ['img', new Set(['src', 'srcset'])],
  ['input', new Set(['src'])],
  ['link', new Set(['href'])],
  ['object', new Set(['data'])],
  ['script', new Set(['src'])],
  ['source', new Set(['src', 'srcset'])],
  ['table', new Set(['background'])],
  ['td', new Set(['background'])],
  ['th', new Set(['background'])],
  ['track', new Set(['src'])],
  ['use', new Set(['href', 'xlink:href'])],
  ['video', new Set(['src', 'poster'])],
]);

function localAssetKey(reference) {
  const value = String(reference).trim();
  if (!value || value.startsWith('#') || /^data:/i.test(value)) return null;
  if (/^(?:https?:)?\/\//i.test(value) || /^[a-z][a-z0-9+.-]*:/i.test(value) || value.startsWith('/')) return false;
  try {
    const url = new URL(value, 'https://portable.invalid/');
    return decodeURIComponent(url.pathname.replace(/^\/+/, ''));
  } catch {
    return false;
  }
}

function validateReference(reference, assetMap, label, { automatic = true } = {}) {
  const key = localAssetKey(reference);
  if (key === null) return null;
  if (key === false) {
    if (automatic) throw new Error(`Automatyczny zasób zewnętrzny nie jest przenośny (${label}): ${reference}`);
    return null;
  }
  if (!key.startsWith('assets/') || !assetMap[key]) throw new Error(`Brak lokalnego zasobu ${label}: ${reference}`);
  return key;
}

function validateInlineStyle(value, label) {
  const parsed = valueParser(value);
  let resourceFunction = null;
  parsed.walk((node) => {
    if (node.type === 'function' && ['url', 'image-set', '-webkit-image-set'].includes(node.value.toLowerCase())) resourceFunction = node.value;
  });
  if (resourceFunction) throw new Error(`Zasób w atrybucie style nie jest obsługiwany (${label}); przenieś go do lesson.css.`);
}

function escapeAttribute(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function inlineMarkdownImages(markdown, assetMap) {
  const replacements = [];
  const collect = (tokens, source, sourceOffset = 0) => {
    let cursor = 0;
    for (const token of tokens ?? []) {
      if (typeof token.raw !== 'string') continue;
      const index = source.indexOf(token.raw, cursor);
      if (index === -1) {
        if (token.type === 'image') throw new Error(`Nie udało się osadzić obrazu Markdown: ${token.href}`);
        continue;
      }
      const absolute = sourceOffset + index;
      if (token.type === 'image') {
        const key = validateReference(token.href, assetMap, 'obraz Markdown');
        if (key) {
          const title = token.title ? ` title="${escapeAttribute(token.title)}"` : '';
          replacements.push({ start: absolute, end: absolute + token.raw.length, text: `<img src="${assetMap[key]}" alt="${escapeAttribute(token.text)}"${title}>` });
        }
      } else {
        collect(token.tokens, token.raw, absolute);
        collect(token.items, token.raw, absolute);
      }
      cursor = index + token.raw.length;
    }
  };
  collect(marked.lexer(markdown), markdown);
  let output = markdown;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.text}${output.slice(replacement.end)}`;
  }
  return output;
}

function inlineHtmlResources(html, assetMap) {
  const replacements = [];
  const visit = (node) => {
    const tag = node.tagName?.toLowerCase();
    if (['base', 'script', 'style'].includes(tag)) throw new Error(`Element <${tag}> nie jest dozwolony w slajdach przenośnych.`);
    for (const attribute of node.attrs ?? []) {
      const name = attribute.name.toLowerCase();
      if (tag === 'meta' && name === 'http-equiv' && attribute.value.toLowerCase() === 'refresh') {
        throw new Error('Przekierowanie meta refresh nie jest dozwolone w slajdach przenośnych.');
      }
      if (name === 'style') validateInlineStyle(attribute.value, `<${tag}>`);
      if (name === 'srcset' && attribute.value.trim()) throw new Error(`Atrybut srcset nie jest obsługiwany w prezentacji przenośnej (<${tag}>).`);
      let key = null;
      if (automaticResources.get(tag)?.has(name)) key = validateReference(attribute.value, assetMap, `<${tag} ${name}>`);
      if (tag === 'a' && name === 'href') key = validateReference(attribute.value, assetMap, '<a href>', { automatic: false });
      if (['data-map-src', 'data-video-src'].includes(name)) key = validateReference(attribute.value, assetMap, `<${tag} ${name}>`, { automatic: false });
      const location = node.sourceCodeLocation?.attrs?.[attribute.name];
      if (key && location) replacements.push({ start: location.startOffset, end: location.endOffset, text: `${attribute.name}="${assetMap[key]}"` });
    }
    for (const child of node.childNodes ?? []) visit(child);
    if (node.content) visit(node.content);
  };
  visit(parseFragment(html, { sourceCodeLocationInfo: true }));
  let output = html;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.text}${output.slice(replacement.end)}`;
  }
  return output;
}

function inlineRawHtmlTokens(markdown, assetMap) {
  const replacements = [];
  const collect = (tokens, source, sourceOffset = 0) => {
    let cursor = 0;
    for (const token of tokens ?? []) {
      if (typeof token.raw !== 'string') continue;
      const index = source.indexOf(token.raw, cursor);
      if (index === -1) continue;
      const absolute = sourceOffset + index;
      if (token.type === 'html') {
        const inlined = inlineHtmlResources(token.raw, assetMap);
        if (inlined !== token.raw) replacements.push({ start: absolute, end: absolute + token.raw.length, text: inlined });
      } else {
        collect(token.tokens, token.raw, absolute);
        collect(token.items, token.raw, absolute);
      }
      cursor = index + token.raw.length;
    }
  };
  collect(marked.lexer(markdown), markdown);
  let output = markdown;
  for (const replacement of replacements.sort((left, right) => right.start - left.start)) {
    output = `${output.slice(0, replacement.start)}${replacement.text}${output.slice(replacement.end)}`;
  }
  return output;
}

function validateMarkdownResources(markdown, assetMap) {
  const runtimeAssetKeys = new Set();
  const visit = (tokens) => {
    for (const token of tokens ?? []) {
      if (token.type === 'image') {
        const key = validateReference(token.href, assetMap, 'obraz Markdown');
        if (key) throw new Error(`Nieosadzony lokalny obraz Markdown: ${token.href}`);
      }
      if (token.type === 'link') {
        const key = validateReference(token.href, assetMap, 'odnośnik Markdown', { automatic: false });
        if (key) runtimeAssetKeys.add(key);
      }
      visit(token.tokens);
      visit(token.items);
    }
  };
  visit(marked.lexer(markdown));
  return Object.fromEntries([...runtimeAssetKeys].map((key) => [key, assetMap[key]]));
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

async function resolveLocalReference(reference, fromFile, repoRoot) {
  if (/^(?:data:|#)/i.test(reference)) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/|\\)/i.test(reference)) {
    throw new Error(`Zewnętrzny lub absolutny zasób CSS nie jest przenośny: ${reference}`);
  }
  const cleanReference = decodeURIComponent(reference.split(/[?#]/, 1)[0]);
  return assertInside(repoRoot, await realpath(path.resolve(path.dirname(fromFile), cleanReference)));
}

async function inlineCssValue(value, fromFile, repoRoot) {
  const parsed = valueParser(value);
  const replacements = [];
  const visit = (nodes, parentFunction = '') => {
    for (const node of nodes) {
      const functionName = node.type === 'function' ? node.value.toLowerCase() : '';
      if (functionName === 'url') {
        const reference = valueParser.stringify(node.nodes).trim().replace(/^(['"])(.*)\1$/s, '$2');
        replacements.push((async () => {
          const asset = await resolveLocalReference(reference, fromFile, repoRoot);
          if (!asset) return;
          node.type = 'word';
          node.value = `url("${await dataUrl(asset)}")`;
          delete node.nodes;
        })());
        continue;
      }
      if ((parentFunction === 'image-set' || parentFunction === '-webkit-image-set') && node.type === 'string') {
        replacements.push((async () => {
          const asset = await resolveLocalReference(node.value, fromFile, repoRoot);
          if (asset) node.value = await dataUrl(asset);
        })());
      }
      if (node.nodes) visit(node.nodes, functionName || parentFunction);
    }
  };
  visit(parsed.nodes);
  await Promise.all(replacements);
  return parsed.toString();
}

async function inlineCssFile(file, repoRoot, stack = new Set()) {
  const resolved = assertInside(repoRoot, await realpath(path.resolve(file)));
  if (stack.has(resolved)) throw new Error(`Cykliczny import CSS: ${resolved}`);
  const nextStack = new Set(stack).add(resolved);
  const root = postcss.parse(await readFile(resolved, 'utf8'), { from: resolved });
  const imports = [];
  root.walkAtRules(/^import$/i, (rule) => imports.push(rule));
  for (const rule of imports) {
    const parsed = valueParser(rule.params);
    const first = parsed.nodes.find((node) => node.type !== 'space' && node.type !== 'comment');
    const reference = first?.type === 'string'
      ? first.value
      : first?.type === 'function' && first.value.toLowerCase() === 'url'
        ? valueParser.stringify(first.nodes).trim().replace(/^(['"])(.*)\1$/s, '$2')
        : null;
    if (!reference) throw new Error(`Nieobsługiwany import CSS w ${resolved}: ${rule.params}`);
    const asset = await resolveLocalReference(reference, resolved, repoRoot);
    if (!asset) throw new Error(`Import CSS nie może używać data URL: ${reference}`);
    const imported = postcss.parse(await inlineCssFile(asset, repoRoot, nextStack), { from: asset });
    const firstText = valueParser.stringify(first);
    const remainder = rule.params.slice((first.sourceIndex ?? 0) + firstText.length).trim();
    if (/^(?:layer|supports)\b/i.test(remainder)) throw new Error(`Nieobsługiwany kwalifikator @import: ${remainder}`);
    if (remainder) rule.replaceWith(postcss.atRule({ name: 'media', params: remainder, nodes: imported.nodes }));
    else rule.replaceWith(...imported.nodes);
  }
  const declarations = [];
  root.walkDecls((declaration) => declarations.push(declaration));
  await Promise.all(declarations.map(async (declaration) => {
    declaration.value = await inlineCssValue(declaration.value, resolved, repoRoot);
  }));
  return root.toString();
}

async function assetFiles(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === 'ENOENT') return [];
    throw error;
  })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await assetFiles(candidate));
    else if (entry.isFile() && mimeTypes[path.extname(entry.name).toLowerCase()]) output.push(candidate);
  }
  return output;
}

async function lessonAssetMap(lessonDirectory, repoRoot) {
  const assetsRoot = path.join(lessonDirectory, 'assets');
  const files = await assetFiles(assetsRoot);
  return Object.fromEntries(await Promise.all(files.map(async (file) => {
    const resolved = assertInside(repoRoot, await realpath(file));
    return [path.relative(lessonDirectory, resolved).split(path.sep).join('/'), await dataUrl(resolved)];
  })));
}

async function bundledRuntime(repoRoot) {
  const result = await bundle({
    entryPoints: [path.join(repoRoot, 'template/presentation/portable-entry.mjs')],
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['chrome100', 'edge100', 'firefox100', 'safari15'],
    write: false,
    logLevel: 'silent',
  });
  if (result.outputFiles.length !== 1) throw new Error('Nie udało się zbudować runtime’u prezentacji przenośnej.');
  return result.outputFiles[0].text;
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
  const portableMetadata = structuredClone(metadata);
  if (appearance.background) {
    const background = assertInside(root, await realpath(path.join(lesson, appearance.background.asset)));
    portableMetadata.appearance.background.asset = await dataUrl(background);
  }
  const assets = await lessonAssetMap(lesson, root);
  const [sourceMarkdown, reveal, markdownPlugin, notesPlugin, assetRuntime, runtime] = await Promise.all([
    readFile(path.join(lesson, 'slides.md'), 'utf8'),
    readFile(path.join(root, 'template/reveal/reveal.js'), 'utf8'),
    readFile(path.join(root, 'template/reveal/plugin/markdown.js'), 'utf8'),
    readFile(path.join(root, 'template/reveal/plugin/notes.js'), 'utf8'),
    readFile(path.join(root, 'template/presentation/portable-assets.js'), 'utf8'),
    bundledRuntime(root),
  ]);
  const markdown = inlineRawHtmlTokens(inlineMarkdownImages(sourceMarkdown, assets), assets);
  const runtimeAssets = validateMarkdownResources(markdown, assets);
  const title = String(metadata.title || 'Lekcja historii').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  const portableConfig = `globalThis.__LESSON_PORTABLE__=${JSON.stringify({ metadata: portableMetadata, assets: runtimeAssets })};`;
  return `<!doctype html>
<html lang="pl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; font-src data:; media-src data:; object-src data:; frame-src https:; connect-src 'none'; base-uri 'none'">
<title>${title}</title>
<!-- Tryb przenośny: jeden plik HTML -->
<style>${escapeRawText(css, 'style')}</style>
</head>
<body>
<div class="reveal"><div class="slides"><section data-markdown data-separator="^\\r?\\n---\\r?\\n$" data-separator-notes="^\\s*notes?:" data-charset="utf-8"><script type="text/template">${escapeRawText(markdown, 'script')}</script></section></div></div>
<script>${escapeRawText(portableConfig, 'script')}</script>
<script>${escapeRawText(assetRuntime, 'script')}</script>
<script>${escapeRawText(reveal, 'script')}</script>
<script>${escapeRawText(markdownPlugin, 'script')}</script>
<script>${escapeRawText(notesPlugin, 'script')}</script>
<script>${escapeRawText(runtime, 'script')}</script>
</body>
</html>\n`;
}

export async function exportPortablePresentation({ repoRoot, lesson, output }) {
  const root = await realpath(repoRoot);
  const lessonDirectory = await realpath(resolveWithin(root, lesson));
  resolveWithin(root, lessonDirectory);
  const outputName = output || `${path.basename(lessonDirectory)}-portable.html`;
  if (path.isAbsolute(outputName) || path.dirname(outputName) !== '.' || !outputName.toLowerCase().endsWith('-portable.html')) {
    throw new Error('Nazwa wyjściowa musi kończyć się na -portable.html i wskazywać plik bezpośrednio w katalogu lekcji.');
  }
  const outputPath = resolveWithin(lessonDirectory, outputName);
  try {
    if ((await lstat(outputPath)).isSymbolicLink()) throw new Error('Plik przenośny nie może być dowiązaniem symbolicznym.');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(outputPath, await buildPortablePresentation({ repoRoot: root, lessonDirectory }), 'utf8');
  return outputPath;
}

async function main() {
  const lesson = argument('--lesson');
  if (!lesson) throw new Error('Użycie: npm run export:portable -- --lesson classes/4/temat [--output nazwa-portable.html]');
  const root = await realpath(process.cwd());
  const output = await exportPortablePresentation({ repoRoot: root, lesson, output: argument('--output') });
  console.log(`Zapisano przenośną prezentację: ${path.relative(root, output)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
