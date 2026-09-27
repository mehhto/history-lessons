const paletteFromLibraryRoles = ({ canvas, surface, ink, accent, evidence, signal }) => Object.freeze({
  canvas,
  surface,
  text: ink,
  muted: ink,
  heading: ink,
  accent,
  border: evidence,
  evidence,
  signal,
  danger: signal,
  regionA: evidence,
  regionB: accent,
  connection: ink,
  mutedSurface: surface,
  textOnAccent: surface,
});

export const catalog = Object.freeze({
  styles: Object.freeze({
    museum: Object.freeze({
      defaultPalette: 'evidence-grey',
      palettes: Object.freeze(['evidence-grey', 'civic-paired', 'sand', 'stone']),
      stylesheet: 'museum.css',
    }),
    editorial: Object.freeze({
      defaultPalette: 'conflict-map',
      palettes: Object.freeze(['conflict-map', 'civic-debate', 'civic-paired', 'ink', 'burgundy', 'documentary-1939']),
      stylesheet: 'editorial.css',
    }),
    atlas: Object.freeze({
      defaultPalette: 'land-sea',
      palettes: Object.freeze(['land-sea', 'conflict-map', 'civic-paired', 'marine', 'earth', 'encounter-atlas']),
      stylesheet: 'atlas.css',
    }),
    chronicle: Object.freeze({
      defaultPalette: 'conflict-map',
      palettes: Object.freeze(['conflict-map', 'land-sea', 'civic-paired']),
      stylesheet: 'chronicle.css',
    }),
    'source-lab': Object.freeze({
      defaultPalette: 'evidence-grey',
      palettes: Object.freeze(['evidence-grey', 'conflict-map', 'civic-paired']),
      stylesheet: 'source-lab.css',
    }),
    reportage: Object.freeze({
      defaultPalette: 'vivid-dark2',
      palettes: Object.freeze(['vivid-dark2', 'civic-paired', 'land-sea']),
      stylesheet: 'reportage.css',
    }),
  }),
  palettes: Object.freeze({
    'civic-paired': paletteFromLibraryRoles({ canvas: '#F4F7F8', surface: '#FFFFFF', ink: '#1F2933', accent: '#1F78B4', evidence: '#A6CEE3', signal: '#33A02C' }),
    'civic-debate': paletteFromLibraryRoles({ canvas: '#F7F7F7', surface: '#FFFFFF', ink: '#1F2933', accent: '#7B3294', evidence: '#008837', signal: '#C2A5CF' }),
    'evidence-grey': paletteFromLibraryRoles({ canvas: '#FFFFFF', surface: '#FFFFFF', ink: '#1F2933', accent: '#CA0020', evidence: '#404040', signal: '#F4A582' }),
    'land-sea': paletteFromLibraryRoles({ canvas: '#F5F5F5', surface: '#FFFFFF', ink: '#1F2933', accent: '#A6611A', evidence: '#018571', signal: '#DFC27D' }),
    'vivid-dark2': paletteFromLibraryRoles({ canvas: '#F4F7F8', surface: '#FFFFFF', ink: '#1F2933', accent: '#D95F02', evidence: '#1B9E77', signal: '#E7298A' }),
    'conflict-map': Object.freeze({ canvas: '#F7F7F7', surface: '#FFFFFF', text: '#1F2933', muted: '#404040', heading: '#1F2933', accent: '#CA0020', evidence: '#0571B0', signal: '#F4A582', border: '#404040' }),
    sand: Object.freeze({ canvas: '#f7f2e8', surface: '#fffdf8', text: '#1f2933', muted: '#596575', heading: '#253e5a', accent: '#a85d2b', border: '#d7c5aa' }),
    stone: Object.freeze({ canvas: '#f0f0ed', surface: '#fafaf8', text: '#252525', muted: '#60636a', heading: '#323b4b', accent: '#6f5641', border: '#c9c8c2' }),
    ink: Object.freeze({ canvas: '#f4f5f7', surface: '#ffffff', text: '#19212b', muted: '#586574', heading: '#111827', accent: '#0f5f73', border: '#cbd5e1' }),
    burgundy: Object.freeze({ canvas: '#f8f3f2', surface: '#fffdfc', text: '#2c2023', muted: '#705c61', heading: '#4a1824', accent: '#8b273b', border: '#dfc9cf' }),
    marine: Object.freeze({ canvas: '#edf4f5', surface: '#fbfdfd', text: '#18323a', muted: '#526b72', heading: '#104658', accent: '#1b7182', border: '#b8d3d8' }),
    earth: Object.freeze({ canvas: '#f6f1e6', surface: '#fffdf7', text: '#30291f', muted: '#706754', heading: '#55411d', accent: '#92722b', border: '#d9c99b' }),
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

export const DEFAULT_APPEARANCE = Object.freeze({ style: 'museum', palette: 'evidence-grey', background: null });
