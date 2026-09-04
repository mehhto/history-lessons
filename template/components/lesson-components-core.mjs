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
