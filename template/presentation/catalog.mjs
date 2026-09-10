export const catalog = Object.freeze({
  styles: Object.freeze({
    museum: Object.freeze({
      defaultPalette: 'sand',
      palettes: Object.freeze(['sand', 'stone']),
      stylesheet: 'museum.css',
    }),
    editorial: Object.freeze({
      defaultPalette: 'ink',
      palettes: Object.freeze(['ink', 'burgundy', 'documentary-1939']),
      stylesheet: 'editorial.css',
    }),
    atlas: Object.freeze({
      defaultPalette: 'marine',
      palettes: Object.freeze(['marine', 'earth', 'encounter-atlas']),
      stylesheet: 'atlas.css',
    }),
    cutout: Object.freeze({
      defaultPalette: 'grade4',
      palettes: Object.freeze(['grade4']),
      stylesheet: 'cutout.css',
    }),
  }),
  palettes: Object.freeze({
    sand: Object.freeze({ canvas: '#f7f2e8', surface: '#fffdf8', text: '#1f2933', muted: '#596575', heading: '#253e5a', accent: '#a85d2b', border: '#d7c5aa' }),
    stone: Object.freeze({ canvas: '#f0f0ed', surface: '#fafaf8', text: '#252525', muted: '#60636a', heading: '#323b4b', accent: '#6f5641', border: '#c9c8c2' }),
    ink: Object.freeze({ canvas: '#f4f5f7', surface: '#ffffff', text: '#19212b', muted: '#586574', heading: '#111827', accent: '#0f5f73', border: '#cbd5e1' }),
    burgundy: Object.freeze({ canvas: '#f8f3f2', surface: '#fffdfc', text: '#2c2023', muted: '#705c61', heading: '#4a1824', accent: '#8b273b', border: '#dfc9cf' }),
    marine: Object.freeze({ canvas: '#edf4f5', surface: '#fbfdfd', text: '#18323a', muted: '#526b72', heading: '#104658', accent: '#1b7182', border: '#b8d3d8' }),
    earth: Object.freeze({ canvas: '#f6f1e6', surface: '#fffdf7', text: '#30291f', muted: '#706754', heading: '#55411d', accent: '#92722b', border: '#d9c99b' }),
    grade4: Object.freeze({ canvas: '#fff7e2', surface: '#ffffff', text: '#122c33', muted: '#3f555b', heading: '#122c33', accent: '#b53d1c', border: '#122c33' }),
    'documentary-1939': Object.freeze({
      canvas: '#f5f1e8', surface: '#fffdfa', text: '#20252d', muted: '#4d5968', heading: '#172b44', accent: '#9a2427', border: '#706b62',
      evidence: '#234f70', danger: '#9a2427', regionA: '#4c5f36', regionB: '#234f70', connection: '#596575', mutedSurface: '#e5e0d5', textOnAccent: '#ffffff',
    }),
    'encounter-atlas': Object.freeze({
      canvas: '#f8f2e4', surface: '#fffdf7', text: '#1d2c2e', muted: '#52615c', heading: '#213f3a', accent: '#9b3e2c', border: '#706c58',
      evidence: '#1f625b', danger: '#9b3e2c', regionA: '#1f625b', regionB: '#9b3e2c', connection: '#806419', mutedSurface: '#e8dfca', textOnAccent: '#ffffff',
    }),
  }),
});

export const DEFAULT_APPEARANCE = Object.freeze({ style: 'museum', palette: 'sand', background: null });
