import test from 'node:test';
import assert from 'node:assert/strict';

import {
  lessonDirectory,
  normalizeLessonSlug,
  validateLessonPackage,
} from '../scripts/lesson-tools.mjs';

test('normalizes a Polish lesson title into a stable directory slug', () => {
  assert.equal(
    normalizeLessonSlug('08 Wielkie odkrycia geograficzne'),
    '08-wielkie-odkrycia-geograficzne',
  );
});

test('places a lesson inside its class directory', () => {
  assert.equal(
    lessonDirectory({ grade: 6, slug: '08-wielkie-odkrycia-geograficzne' }),
    'classes/6/08-wielkie-odkrycia-geograficzne',
  );
});

test('rejects lesson creation outside classes IV–VIII', () => {
  assert.throws(
    () => lessonDirectory({ grade: 3, slug: 'moja-lekcja' }),
    /4–8/,
  );
});

test('reports all missing required lesson files', () => {
  const report = validateLessonPackage(new Set(['lesson.md', 'slides.md']));

  assert.deepEqual(report.missing, [
    'index.html',
    'lesson.css',
    'worksheet.md',
    'sources.md',
    'assessment.md',
    'reflection.md',
    'metadata.json',
    'assets/',
  ]);
  assert.equal(report.ok, false);
});

test('accepts a complete lesson package', () => {
  const report = validateLessonPackage(new Set([
    'lesson.md',
    'slides.md',
    'index.html',
    'lesson.css',
    'worksheet.md',
    'sources.md',
    'assessment.md',
    'reflection.md',
    'metadata.json',
    'assets/',
  ]));

  assert.equal(report.ok, true);
  assert.deepEqual(report.missing, []);
});
