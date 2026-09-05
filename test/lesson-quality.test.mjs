import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessLessonQuality,
  parseLessonMetadata,
  unresolvedMarkers,
} from '../scripts/lesson-quality.mjs';

const metadata = {
  id: 'test',
  title: 'Test',
  grade: 6,
  duration_minutes: 45,
  kind: 'lesson',
  status: 'SZKIC',
  curriculum_requirement: 'Wymaganie',
  main_question: 'Pytanie?',
  source_reviewed: false,
  teacher_reviewed: false,
  offline_checked: false,
  pdf_exported: false,
};

test('reports malformed metadata instead of accepting it as ready', () => {
  assert.throws(() => parseLessonMetadata('{oops}'), /niepoprawny/);
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, kind: 'other' })), /kind/);
});

test('finds unresolved authoring markers including annotated decisions', () => {
  assert.deepEqual(
    unresolvedMarkers('Cel: [DECYZJA NAUCZYCIELA: wybierz wariant]. Fakt: [DO WERYFIKACJI].'),
    ['[DECYZJA NAUCZYCIELA: wybierz wariant]', '[DO WERYFIKACJI]'],
  );
});

test('separates package completeness, technical checks, and teacher approval', () => {
  const report = assessLessonQuality({
    metadata,
    requiredFilesPresent: true,
    requiredContent: { 'lesson.md': 'Gotowe', 'sources.md': 'Źródło' },
    artifacts: { presentationPdf: true, printPack: false },
  });

  assert.equal(report.structure.ok, true);
  assert.equal(report.technical.ok, false);
  assert.equal(report.teacherApproval.ok, false);
  assert.equal(report.ready, false);
});

test('keeps a demo out of curricular approval requirements', () => {
  const report = assessLessonQuality({
    metadata: { ...metadata, kind: 'demo', teacher_reviewed: false },
    requiredFilesPresent: true,
    requiredContent: { 'lesson.md': 'Pokaz', 'sources.md': 'Materiały demonstracyjne' },
    artifacts: { presentationPdf: true, printPack: true },
  });

  assert.equal(report.teacherApproval.required, false);
  assert.equal(report.teacherApproval.ok, true);
});
