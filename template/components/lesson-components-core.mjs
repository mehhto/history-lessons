export function clampPercentage(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 50;
  return Math.min(100, Math.max(0, numeric));
}

export function counterValueAtProgress(target, progress) {
  const numericTarget = Number(target);
  const numericProgress = Number(progress);
  if (!Number.isFinite(numericTarget) || !Number.isFinite(numericProgress) || numericTarget < 0) return 0;
  return Math.round(numericTarget * Math.min(1, Math.max(0, numericProgress)));
}

export function isGalleryNavigationKey(key) {
  return ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Escape', 'Enter', ' '].includes(key);
}

export function galleryNavigationIndex(activeIndex, key, itemCount) {
  if (!Number.isInteger(itemCount) || itemCount < 1) return null;

  const current = Number.isInteger(activeIndex) && activeIndex >= 0 && activeIndex < itemCount
    ? activeIndex
    : 0;

  if (key === 'ArrowLeft' || key === 'ArrowUp') return (current - 1 + itemCount) % itemCount;
  if (key === 'ArrowRight' || key === 'ArrowDown') return (current + 1) % itemCount;
  if (key === 'Home') return 0;
  if (key === 'End') return itemCount - 1;
  if (key === 'Escape') return null;
  return current;
}
