import { DEFAULT_APPEARANCE } from './catalog.mjs';

const scopes = new Set(['opening', 'opening-and-sections', 'subtle-all']);
const unsafeAsset = /^(?:[a-z][a-z0-9+.-]*:|\/|\\|.*(?:^|[\\/])\.\.(?:[\\/]|$))/i;

export function validateAppearanceAsset(asset) {
  if (typeof asset !== 'string' || !asset.startsWith('assets/') || unsafeAsset.test(asset)) {
    throw new Error('Tło musi wskazywać lokalny plik pod assets/.');
  }
  return { asset };
}

export function resolveAppearance(appearance, catalog) {
  if (appearance === undefined || appearance === null) return { ...DEFAULT_APPEARANCE };
  if (!appearance || typeof appearance !== 'object' || Array.isArray(appearance)) {
    throw new Error('appearance musi być obiektem.');
  }
  for (const key of Object.keys(appearance)) {
    if (!['style', 'palette', 'background'].includes(key)) throw new Error(`Nieznane pole appearance: ${key}.`);
  }
  const styleName = appearance.style ?? DEFAULT_APPEARANCE.style;
  if (typeof styleName !== 'string' || !catalog.styles[styleName]) throw new Error(`Nieznany styl: ${styleName}.`);
  const style = catalog.styles[styleName];
  const paletteName = appearance.palette ?? style.defaultPalette;
  if (typeof paletteName !== 'string' || !style.palettes.includes(paletteName)) {
    throw new Error(`Styl ${styleName} nie obsługuje palety ${paletteName}.`);
  }
  let background = null;
  if (appearance.background !== undefined && appearance.background !== null) {
    if (!appearance.background || typeof appearance.background !== 'object' || Array.isArray(appearance.background)) {
      throw new Error('Tło musi być obiektem.');
    }
    for (const key of Object.keys(appearance.background)) {
      if (!['asset', 'scope'].includes(key)) throw new Error(`Nieznane pole tła: ${key}.`);
    }
    const { asset } = validateAppearanceAsset(appearance.background.asset);
    const scope = appearance.background.scope ?? 'opening';
    if (!scopes.has(scope)) throw new Error(`Zakres tła jest nieprawidłowy: ${scope}.`);
    background = { asset, scope };
  }
  return { style: styleName, palette: paletteName, background };
}
