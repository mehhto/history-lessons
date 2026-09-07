import { isCanvasRectInsideViewport, textSizeIsLegible } from '../template/presentation/geometry.mjs';

function inside(rect, canvas, tolerance = 0.5) {
  return rect.left >= canvas.left - tolerance && rect.top >= canvas.top - tolerance
    && rect.right <= canvas.right + tolerance && rect.bottom <= canvas.bottom + tolerance;
}

export function findCanvasIssues({ slide, canvas, viewport, content }) {
  const issues = [];
  if (!isCanvasRectInsideViewport(canvas, viewport, 1)) issues.push(`Płótno poza ekranem ${slide}`);
  for (const node of content) {
    if (!node.text?.trim()) continue;
    if (!inside(node.rect, canvas)) issues.push(`Treść poza płótnem ${slide}: ${node.selector}`);
    if (!textSizeIsLegible(node.computedFontSize, node.kind)) issues.push(`Zbyt mały tekst ${slide}: ${node.selector}`);
  }
  return issues;
}

export async function inspectPresentation(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0;
    };
    const descriptor = (element) => element.id ? `#${element.id}` : element.tagName.toLowerCase();
    const toRect = (rect) => ({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
    const slides = [...document.querySelectorAll('.reveal .slides section[data-slide-canvas]')];
    return {
      ready: document.documentElement.dataset.presentationReady,
      viewport: { width: innerWidth, height: innerHeight },
      slides: slides.map((slide, index) => {
        const canvas = slide.getBoundingClientRect();
        const content = [...slide.querySelectorAll('.slide-content :is(h1,h2,h3,h4,p,li,figcaption,td,th,summary,button,label)')]
          .filter(visible)
          .map((element) => ({
            selector: descriptor(element), text: element.textContent,
            rect: toRect(element.getBoundingClientRect()),
            computedFontSize: Number.parseFloat(getComputedStyle(element).fontSize),
            kind: element.matches('figcaption,.source-label,.small') ? 'caption' : 'content',
          }));
        return { slide: slide.id ? `#${slide.id}` : `slajd ${index + 1}`, canvas: toRect(canvas), content };
      }),
    };
  });
}
