import test from 'node:test';
import assert from 'node:assert/strict';

import { documentKindsForLesson, documentPlan, markdownToHtml } from '../scripts/print-pack.mjs';

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
});

test('renders markdown as safe printable HTML without executing embedded markup', () => {
  const html = markdownToHtml('# Tytuł\n\n- Punkt\n\n<script>alert(1)</script>');
  assert.match(html, /<h1>Tytuł<\/h1>/);
  assert.match(html, /<li>Punkt<\/li>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
