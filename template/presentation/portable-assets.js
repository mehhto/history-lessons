(() => {
  const portable = globalThis.__LESSON_PORTABLE__;
  if (!portable?.assets || typeof portable.assets !== 'object') throw new Error('Brak mapy zasobów prezentacji przenośnej.');
  const failures = new Set();
  const automaticAttributes = new Map([
    ['IMG', ['src', 'srcset']],
    ['SOURCE', ['src', 'srcset']],
    ['VIDEO', ['src', 'poster']],
    ['AUDIO', ['src']],
    ['TRACK', ['src']],
    ['OBJECT', ['data']],
    ['EMBED', ['src']],
    ['INPUT', ['src']],
    ['IFRAME', ['src']],
    ['IMAGE', ['href', 'xlink:href']],
    ['LINK', ['href']],
    ['SCRIPT', ['src']],
    ['TABLE', ['background']],
    ['TD', ['background']],
    ['TH', ['background']],
    ['USE', ['href', 'xlink:href']],
  ]);

  function localKey(value) {
    try {
      const parsed = new URL(value, 'https://portable.invalid/');
      if (parsed.origin !== 'https://portable.invalid') return null;
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
      return null;
    }
  }

  function rewriteLocal(value, label, { allowExternal = false } = {}) {
    if (!value || /^(?:data:|blob:|#)/i.test(value)) return value;
    const key = localKey(value);
    if (key && portable.assets[key]) return portable.assets[key];
    if (allowExternal && /^(?:https?:|mailto:|tel:)/i.test(value)) return value;
    failures.add(`${label}: ${value}`);
    return '';
  }

  function rewriteElement(element) {
    const tagName = element.tagName.toUpperCase();
    for (const attribute of automaticAttributes.get(tagName) || []) {
      if (!element.hasAttribute(attribute)) continue;
      const value = element.getAttribute(attribute);
      if (attribute === 'srcset' && value && !/^\s*data:/i.test(value)) {
        failures.add(`${element.tagName.toLowerCase()}[srcset]: ${value}`);
        element.removeAttribute(attribute);
        continue;
      }
      const rewritten = rewriteLocal(value, `${element.tagName.toLowerCase()}[${attribute}]`);
      if (rewritten) element.setAttribute(attribute, rewritten);
      else element.removeAttribute(attribute);
    }
    if (tagName === 'A' && element.hasAttribute('href')) {
      const value = element.getAttribute('href');
      const rewritten = rewriteLocal(value, 'a[href]', { allowExternal: true });
      if (rewritten) element.setAttribute('href', rewritten);
      else element.removeAttribute('href');
    }
    for (const attribute of ['data-map-src', 'data-video-src']) {
      if (!element.hasAttribute(attribute)) continue;
      const value = element.getAttribute(attribute);
      const rewritten = rewriteLocal(value, `${element.tagName.toLowerCase()}[${attribute}]`, { allowExternal: true });
      if (rewritten) element.setAttribute(attribute, rewritten);
      else element.removeAttribute(attribute);
    }
    if (element.hasAttribute('style') && /(?:url|image-set)\s*\(/i.test(element.getAttribute('style'))) {
      const resourceValues = [...element.style].map((property) => element.style.getPropertyValue(property)).filter((value) => /(?:url|image-set)\s*\(/i.test(value));
      if (resourceValues.some((value) => !/data:/i.test(value))) {
        failures.add(`${element.tagName.toLowerCase()}[style]: lokalne obrazy tła umieść w lesson.css`);
        element.removeAttribute('style');
      }
    }
  }

  function rewriteTree(root) {
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    rewriteElement(root);
    root.querySelectorAll('[src], [srcset], [poster], [data], [href], [background], [data-map-src], [data-video-src], [style]').forEach(rewriteElement);
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) for (const node of record.addedNodes) rewriteTree(node);
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  rewriteTree(document.documentElement);

  portable.finalizeAssets = (root = document) => {
    observer.disconnect();
    root.querySelectorAll?.('[src], [srcset], [poster], [data], [href], [background], [data-map-src], [data-video-src], [style]').forEach(rewriteElement);
    if (failures.size) throw new Error(`Nieprzenośne zasoby:\n${[...failures].join('\n')}`);
  };
})();
