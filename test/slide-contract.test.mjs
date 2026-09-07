import test from 'node:test';
import assert from 'node:assert/strict';
import { auditSlideContract, parseSlideDirectives } from '../scripts/slide-contract.mjs';

test('parses ordered Reveal slide directives into semantic facts', () => {
  const slides = parseSlideDirectives(`<!-- .slide: id="pytanie" data-purpose="question" data-layout="statement" -->
# Pytanie

---

<!-- .slide: id="proces" data-purpose="explanation" data-layout="process" -->
# Proces`);
  assert.deepEqual(slides, [
    { id: 'pytanie', purpose: 'question', layout: 'statement', index: 0 },
    { id: 'proces', purpose: 'explanation', layout: 'process', index: 1 },
  ]);
});

test('accepts a complete new-knowledge arc', () => {
  const report = auditSlideContract([
    { id: 'start', purpose: 'opening', layout: 'statement' },
    { id: 'pytanie', purpose: 'question', layout: 'statement' },
    { id: 'wyjasnienie', purpose: 'explanation', layout: 'process' },
    { id: 'zadanie', purpose: 'practice', layout: 'activity-brief' },
    { id: 'synteza', purpose: 'synthesis', layout: 'takeaways' },
    { id: 'bilet', purpose: 'exit-ticket', layout: 'plain' },
  ], { lessonType: 'new-knowledge' });
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.warnings, []);
});

test('rejects absent and duplicate identifiers and unknown semantics', () => {
  const report = auditSlideContract([
    { id: 'x', purpose: 'question', layout: 'statement' },
    { id: 'x', purpose: 'unknown', layout: 'magic' },
    { id: '', purpose: 'practice', layout: 'plain' },
  ], { lessonType: 'new-knowledge' });
  assert.match(report.errors.join('\n'), /duplikat/i);
  assert.match(report.errors.join('\n'), /id/i);
  assert.match(report.errors.join('\n'), /purpose/i);
  assert.match(report.errors.join('\n'), /layout/i);
});

test('warns when practice is placed before explanation and when closure is missing', () => {
  const report = auditSlideContract([
    { id: 'zadanie', purpose: 'practice', layout: 'activity-brief' },
    { id: 'wiedza', purpose: 'explanation', layout: 'statement' },
  ], { lessonType: 'new-knowledge' });
  assert.match(report.warnings.join('\n'), /przed.*wyjaśn/i);
  assert.match(report.warnings.join('\n'), /syntez/i);
  assert.match(report.warnings.join('\n'), /bilet/i);
});
