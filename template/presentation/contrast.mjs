function channel(hex) { return Number.parseInt(hex, 16) / 255; }
function linear(value) { return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }
export function relativeLuminance(hex) {
  const value = String(hex).replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error(`Nieprawidłowy kolor: ${hex}`);
  const [r, g, b] = [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map(channel).map(linear);
  return .2126 * r + .7152 * g + .0722 * b;
}
export function contrastRatio(first, second) {
  const [light, dark] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (light + .05) / (dark + .05);
}
export function paletteContrastIssues(palette) {
  return [['text', 'canvas'], ['heading', 'canvas'], ['muted', 'canvas']]
    .map(([foreground, background]) => ({ foreground, background, ratio: contrastRatio(palette[foreground], palette[background]) }))
    .filter(({ ratio }) => ratio < 4.5);
}
