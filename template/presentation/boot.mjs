import { catalog } from './catalog.mjs';
import { resolveAppearance } from './appearance.mjs';
import { revealConfiguration } from './geometry.mjs';

function setTokens(palette) {
  const root = document.documentElement;
  for (const [token, value] of Object.entries(palette)) root.style.setProperty(`--color-${token}`, value);
}

function stylesheetHref(style) {
  return new URL(`./styles/${style.stylesheet}`, import.meta.url).href;
}

async function loadStyle(style) {
  const link = document.querySelector('#appearance-style');
  if (!link) throw new Error('Brakuje elementu #appearance-style.');
  await new Promise((resolve, reject) => {
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Nie udało się załadować stylu ${style.stylesheet}.`));
    link.href = stylesheetHref(style);
  });
}

function leafSlides() {
  return [...document.querySelectorAll('.reveal .slides section')]
    .filter((section) => !section.querySelector(':scope > section'));
}

function wrapSlideContent(slide) {
  if (slide.querySelector(':scope > .slide-content')) return;
  const content = document.createElement('div');
  content.className = 'slide-content';
  for (const child of [...slide.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE && child.matches('aside.notes')) continue;
    content.append(child);
  }
  slide.prepend(content);
}

function setBackdrops(appearance) {
  const slides = leafSlides();
  if (!appearance.background) return;
  const image = `url(${JSON.stringify(appearance.background.asset)})`;
  for (const [index, slide] of slides.entries()) {
    const section = slide.classList.contains('section-slide');
    const shouldApply = appearance.background.scope === 'subtle-all'
      || (appearance.background.scope === 'opening' && index === 0)
      || (appearance.background.scope === 'opening-and-sections' && (index === 0 || section));
    if (shouldApply && slide.dataset.backdrop !== 'off') {
      slide.dataset.backdrop = appearance.background.scope === 'subtle-all' ? 'subtle' : 'image';
      slide.style.setProperty('--appearance-backdrop', image);
    }
  }
}

async function waitForVisualAssets() {
  await document.fonts?.ready;
  await Promise.all([...document.images].map(async (image) => {
    if (image.complete && image.naturalWidth > 0) return;
    await image.decode?.().catch(() => undefined);
  }));
}

async function start() {
  let metadata;
  const response = await fetch('metadata.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`Nie można odczytać metadata.json (${response.status}).`);
  metadata = await response.json();
  const appearance = resolveAppearance(metadata.appearance, catalog);
  const style = catalog.styles[appearance.style];
  document.documentElement.dataset.style = appearance.style;
  document.documentElement.dataset.palette = appearance.palette;
  setTokens(catalog.palettes[appearance.palette]);
  await loadStyle(style);

  Reveal.initialize({
    ...revealConfiguration(),
    hash: true,
    slideNumber: 'c/t',
    controlsTutorial: false,
    transition: 'slide',
    keyboard: { 83: () => Reveal.configure({ showNotes: Reveal.getConfig().showNotes ? false : 'inline' }) },
    plugins: [RevealMarkdown, RevealNotes],
  });
  Reveal.on('ready', async () => {
    for (const slide of leafSlides()) {
      slide.dataset.slideCanvas = '';
      wrapSlideContent(slide);
    }
    setBackdrops(appearance);
    await waitForVisualAssets();
    Reveal.layout();
    document.documentElement.dataset.presentationReady = 'true';
  });
}

start().catch((error) => {
  document.documentElement.dataset.presentationReady = 'error';
  document.body.insertAdjacentHTML('afterbegin', `<p class="presentation-error">Błąd prezentacji: ${error.message}</p>`);
  console.error(error);
});
