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
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, lesson_type: 'other' })), /lesson_type/);
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

test('reports pedagogical gaps as warnings without changing technical readiness', () => {
  const report = assessLessonQuality({
    metadata: { ...metadata, lesson_type: 'new-knowledge', offline_checked: true, pdf_exported: true },
    requiredFilesPresent: true,
    requiredContent: {
      'lesson.md': '## Pytanie główne\nPytanie?',
      'student-summary.md': '',
      'teacher-guide.md': '## Przebieg',
    },
    artifacts: { presentationPdf: true, printPack: true },
  });

  assert.equal(report.ready, false, 'approval remains a separate blocking status');
  assert.equal(report.technical.ok, true);
  assert.deepEqual(report.teachingWarnings.issues, [
    'Brakuje mapy: wymaganie → treść → zadanie → dowód.',
    'Lekcja nowej wiedzy nie ma pełnego minimum wiedzy.',
    'Lekcja nowej wiedzy nie ma podsumowania ucznia.',
    'Brakuje sekcji trudnych momentów i notatek nauczyciela.',
  ]);
});

test('warns when a lesson has no declared type during the transition', () => {
  const report = assessLessonQuality({
    metadata: { ...metadata, offline_checked: true, pdf_exported: true },
    requiredFilesPresent: true,
    requiredContent: {
      'lesson.md': '## Cele → zadanie → dowód',
      'teacher-guide.md': '## Trudne momenty i notatki nauczyciela',
    },
    artifacts: { presentationPdf: true, printPack: true },
  });

  assert.deepEqual(report.teachingWarnings.issues, ['Brakuje jawnie wskazanego typu lekcji.']);
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
