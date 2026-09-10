const variants = ['editorial', 'archive', 'cutout'];

function currentVariant() {
  const value = document.documentElement.dataset.variant;
  return variants.includes(value) ? value : 'editorial';
}

function selectVariant(variant, { updateUrl = true } = {}) {
  if (!variants.includes(variant)) return;
  document.documentElement.dataset.variant = variant;
  document.querySelectorAll('[data-choose-variant]').forEach((button) => {
    const active = button.dataset.chooseVariant === variant;
    button.setAttribute('aria-pressed', String(active));
  });
  if (updateUrl) {
    const url = new URL(location.href);
    url.searchParams.set('variant', variant);
    history.replaceState({}, '', url);
  }
  window.dispatchEvent(new Event('resize'));
}

document.querySelectorAll('[data-choose-variant]').forEach((button) => {
  button.addEventListener('click', () => selectVariant(button.dataset.chooseVariant));
});

selectVariant(currentVariant(), { updateUrl: false });
window.setVisualDirection = selectVariant;
