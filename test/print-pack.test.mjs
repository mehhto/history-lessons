import test from 'node:test';
import assert from 'node:assert/strict';

import { documentKindsForLesson, omittedDocumentKindsForLesson, documentPlan, markdownToHtml } from '../scripts/print-pack.mjs';

test('defines separate teacher, worksheet, and student-summary print sources', () => {
  assert.deepEqual(documentPlan('summary'), {
    output: 'student-summary.pdf',
    sources: ['student-summary.md'],
    audience: 'student',
  });
  assert.deepEqual(documentPlan('teacher'), {
    output: 'teacher-guide.pdf',
    sources: ['teacher-guide.md', 'assessment.md'],
    audience: 'teacher',
  });
  assert.deepEqual(documentPlan('worksheet'), {
    output: 'worksheet.pdf',
    sources: ['worksheet.md'],
    audience: 'student',
  });
});

test('omits an unnecessary summary from a practice lesson print pack', () => {
  assert.deepEqual(documentKindsForLesson({ lessonType: 'practice', hasSummary: false }), ['worksheet', 'teacher']);
  assert.deepEqual(documentKindsForLesson({ lessonType: 'practice', hasSummary: true }), ['worksheet', 'teacher', 'summary']);
  assert.deepEqual(documentKindsForLesson({ lessonType: 'new-knowledge', hasSummary: false }), ['worksheet', 'teacher', 'summary']);
  assert.deepEqual(omittedDocumentKindsForLesson({ lessonType: 'practice', hasSummary: false }), ['summary']);
  assert.deepEqual(omittedDocumentKindsForLesson({ lessonType: 'new-knowledge', hasSummary: false }), []);
});

test('renders Markdown tables as printable semantic tables', () => {
  const html = markdownToHtml('| Opis | Data |\n|---|---|\n| Wyprawa Kolumba | 1492 |\n| Mapa Waldseemüllera | 1507 |');
  assert.match(html, /<table>/);
  assert.match(html, /<thead><tr><th>Opis<\/th><th>Data<\/th><\/tr><\/thead>/);
  assert.match(html, /<tbody>/);
  assert.match(html, /<tr><td>Wyprawa Kolumba<\/td><td>1492<\/td><\/tr>/);
  assert.match(html, /<td>Mapa Waldseemüllera<\/td><td>1507<\/td>/);
});

test('accepts standard tables without outer pipe characters', () => {
  const html = markdownToHtml('Opis | Data\n---|---\nWyprawa Kolumba | 1492');
  assert.match(html, /<table>/);
  assert.match(html, /<th>Opis<\/th><th>Data<\/th>/);
  assert.match(html, /<td>Wyprawa Kolumba<\/td><td>1492<\/td>/);
});

test('renders markdown as safe printable HTML without executing embedded markup', () => {
  const html = markdownToHtml('# Tytuł\n\n- Punkt\n\n<script>alert(1)</script>');
  assert.match(html, /<h1>Tytuł<\/h1>/);
  assert.match(html, /<li>Punkt<\/li>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
