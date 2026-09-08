export const SLIDE_PURPOSES = Object.freeze([
  'opening', 'question', 'explanation', 'evidence', 'practice', 'synthesis', 'exit-ticket', 'reference',
]);

export const SLIDE_LAYOUTS = Object.freeze([
  'statement', 'split', 'equation', 'process', 'evidence', 'matrix', 'activity-brief', 'takeaways', 'plain',
  'hero-source', 'statement-centered', 'map-focus', 'source-split', 'photo-pair', 'timeline-band', 'argument', 'task-board', 'comparison', 'impact-flow',
]);

const PURPOSES = new Set(SLIDE_PURPOSES);
const LAYOUTS = new Set(SLIDE_LAYOUTS);

function attribute(directive, name) {
  return directive?.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] || '';
}

const SLIDE_DIRECTIVE = /<!--\s*\.slide:\s*([\s\S]*?)-->/;
const REVEAL_SLIDE_SEPARATOR = /^\r?\n---\r?\n$/m;

export function parseSlideDirectives(markdown) {
  return String(markdown).split(REVEAL_SLIDE_SEPARATOR)
    .map((block, index) => {
      const directive = block.match(SLIDE_DIRECTIVE)?.[1];
      return {
        id: attribute(directive, 'id'),
        purpose: attribute(directive, 'data-purpose'),
        layout: attribute(directive, 'data-layout'),
        index,
        hasDirective: Boolean(directive),
      };
    });
}

export function auditSlideContract(slides, { lessonType, kind = 'lesson' } = {}) {
  const errors = [];
  const warnings = [];
  const ids = new Set();
  for (const [index, slide] of slides.entries()) {
    const label = `Slajd ${index + 1}`;
    if (!slide.id) errors.push(`${label} nie ma stabilnego id.`);
    else if (ids.has(slide.id)) errors.push(`${label} ma duplikat id „${slide.id}”.`);
    else ids.add(slide.id);
    if (!PURPOSES.has(slide.purpose)) errors.push(`${label} ma nieznany data-purpose „${slide.purpose || 'brak'}”.`);
    if (!LAYOUTS.has(slide.layout)) errors.push(`${label} ma nieznany data-layout „${slide.layout || 'brak'}”.`);
  }
  if (kind === 'lesson' && lessonType === 'new-knowledge') {
    const firstExplanation = slides.findIndex((slide) => slide.purpose === 'explanation' || slide.purpose === 'evidence');
    const firstPractice = slides.findIndex((slide) => slide.purpose === 'practice');
    if (firstPractice !== -1 && (firstExplanation === -1 || firstPractice < firstExplanation)) {
      warnings.push('Zadanie praktyczne pojawia się przed wyjaśnieniem wymaganej wiedzy.');
    }
    if (!slides.some((slide) => slide.purpose === 'synthesis')) warnings.push('Brakuje slajdu syntezy pojęć lub mechanizmu.');
    if (!slides.some((slide) => slide.purpose === 'exit-ticket')) warnings.push('Brakuje indywidualnego biletu wyjścia.');
  }
  return { errors, warnings };
}
