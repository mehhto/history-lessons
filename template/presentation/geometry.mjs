export const SLIDE_GEOMETRY = Object.freeze({
  width: 1280,
  height: 720,
  margin: 0.04,
  minScale: 0.01,
  maxScale: 4,
  center: false,
  disableLayout: false,
});

export function revealConfiguration() {
  return { ...SLIDE_GEOMETRY };
}

export function isCanvasRectInsideViewport(rect, viewport, tolerance = 0) {
  return rect.left >= -tolerance
    && rect.top >= -tolerance
    && rect.right <= viewport.width + tolerance
    && rect.bottom <= viewport.height + tolerance;
}

export function textSizeIsLegible(size, kind = 'content') {
  const minimum = kind === 'caption' ? 12 : 14;
  return Number.isFinite(size) && size >= minimum;
}
