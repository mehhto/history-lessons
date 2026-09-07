export const catalog = Object.freeze({
  styles: Object.freeze({
    museum: Object.freeze({
      defaultPalette: 'sand',
      palettes: Object.freeze(['sand', 'stone']),
      stylesheet: 'museum.css',
    }),
    editorial: Object.freeze({
      defaultPalette: 'ink',
      palettes: Object.freeze(['ink', 'burgundy']),
      stylesheet: 'editorial.css',
    }),
    atlas: Object.freeze({
      defaultPalette: 'marine',
      palettes: Object.freeze(['marine', 'earth']),
      stylesheet: 'atlas.css',
    }),
  }),
  palettes: Object.freeze({
    sand: Object.freeze({ canvas: '#f7f2e8', surface: '#fffdf8', text: '#1f2933', muted: '#596575', heading: '#253e5a', accent: '#a85d2b', border: '#d7c5aa' }),
    stone: Object.freeze({ canvas: '#f0f0ed', surface: '#fafaf8', text: '#252525', muted: '#60636a', heading: '#323b4b', accent: '#6f5641', border: '#c9c8c2' }),
    ink: Object.freeze({ canvas: '#f4f5f7', surface: '#ffffff', text: '#19212b', muted: '#586574', heading: '#111827', accent: '#0f5f73', border: '#cbd5e1' }),
    burgundy: Object.freeze({ canvas: '#f8f3f2', surface: '#fffdfc', text: '#2c2023', muted: '#705c61', heading: '#4a1824', accent: '#8b273b', border: '#dfc9cf' }),
    marine: Object.freeze({ canvas: '#edf4f5', surface: '#fbfdfd', text: '#18323a', muted: '#526b72', heading: '#104658', accent: '#1b7182', border: '#b8d3d8' }),
    earth: Object.freeze({ canvas: '#f6f1e6', surface: '#fffdf7', text: '#30291f', muted: '#706754', heading: '#55411d', accent: '#92722b', border: '#d9c99b' }),
  }),
});

export const DEFAULT_APPEARANCE = Object.freeze({ style: 'museum', palette: 'sand', background: null });
