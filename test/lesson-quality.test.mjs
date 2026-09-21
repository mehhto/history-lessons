import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assessLessonQuality,
  expectedCurriculumVersion,
  inspectGoalContract,
  parseLessonMetadata,
  unresolvedMarkers,
} from '../scripts/lesson-quality.mjs';

const metadata = {
  id: 'test',
  title: 'Test',
  grade: 6,
  school_year: '2026/2027',
  curriculum_version: 'stara-przejsciowa',
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

test('selects the only curriculum variant valid for a grade and school year', () => {
  assert.equal(expectedCurriculumVersion({ grade: 4, schoolYear: '2026/2027' }), 'nowa-2026');
  assert.equal(expectedCurriculumVersion({ grade: 5, schoolYear: '2026/2027' }), 'stara-przejsciowa');
  assert.equal(expectedCurriculumVersion({ grade: 5, schoolYear: '2027/2028' }), 'nowa-2026');
  assert.equal(expectedCurriculumVersion({ grade: 8, schoolYear: '2029/2030' }), 'stara-przejsciowa');
  assert.equal(expectedCurriculumVersion({ grade: 8, schoolYear: '2030/2031' }), 'nowa-2026');
  assert.throws(() => expectedCurriculumVersion({ grade: 4, schoolYear: '2026-2027' }), /school_year/);
});

test('rejects a concrete curriculum variant assigned to the wrong cohort', () => {
  assert.throws(
    () => parseLessonMetadata(JSON.stringify({ ...metadata, school_year: '2026/2027', curriculum_version: 'nowa-2026' })),
    /stara-przejsciowa/,
  );
  assert.doesNotThrow(() => parseLessonMetadata(JSON.stringify({
    ...metadata,
    school_year: '[DECYZJA NAUCZYCIELA]',
    curriculum_version: '[DECYZJA NAUCZYCIELA]',
  })));
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, school_year: undefined })), /school_year/);
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, school_year: '[DECYZJA NAUCZYCIELA]', curriculum_version: 'nieznana' })), /curriculum_version/);
});

test('reports malformed metadata instead of accepting it as ready', () => {
  assert.throws(() => parseLessonMetadata('{oops}'), /niepoprawny/);
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, kind: 'other' })), /kind/);
  assert.throws(() => parseLessonMetadata(JSON.stringify({ ...metadata, lesson_type: 'other' })), /lesson_type/);
});

test('rejects malformed presentation appearance in metadata', () => {
  const broken = { ...metadata, appearance: { style: 'atlas', palette: 'sand' } };
  assert.throws(() => parseLessonMetadata(JSON.stringify(broken)), /nie obsługuje palety/);
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

test('validates opt-in goal references and reports only pedagogical gaps as warnings', () => {
  const metadataWithGoals = { ...metadata, goalContract: { version: '1.0' } };
  const complete = inspectGoalContract({
    metadata: metadataWithGoals,
    lessonMarkdown: `## Cele w języku ucznia\n1. **G1** — Wyjaśnię proces.\n2. **G2** — Porównam przykłady.\n\n## Cele → zadanie → dowód\n| ID | Cel ucznia | Wiedza / treść konieczna | Zadanie podczas lekcji | Dowód osiągnięcia celu |\n|---|---|---|---|---|\n| G1 | Wyjaśnię proces. | pojęcie | odpowiedź | zdanie |`,
    assessmentMarkdown: '## Powiązanie z celami\n- Sprawdzane cele: G1',
    slides: [{ id: 'zadanie', goals: ['G2'] }],
  });
  assert.deepEqual(complete.errors, []);
  assert.deepEqual(complete.warnings, [
    'Cel G2 nie ma wiersza w mapie cele → zadanie → dowód.',
    'Cel G2 nie jest wskazany w assessment.',
  ]);

  const broken = inspectGoalContract({
    metadata: metadataWithGoals,
    lessonMarkdown: `## Cele w języku ucznia\n1. **G1** — Pierwszy.\n2. **G1** — Drugi.\n3. Cel bez ID.\n\n## Cele → zadanie → dowód\n| ID | Cel ucznia | Wiedza / treść konieczna | Zadanie podczas lekcji | Dowód osiągnięcia celu |\n|---|---|---|---|---|\n| G9 | Cel | wiedza |  |  |\n| G1x | Cel | wiedza | zadanie | dowód |\n| G1 | Cel | wiedza | zadanie | dowód |\n| G1 | Cel | wiedza | zadanie | dowód |`,
    assessmentMarkdown: '## Powiązanie z celami\n- Sprawdzane cele: G9, nie-G1',
    slides: [{ id: 'zadanie', goals: ['G1,'] }],
  });
  assert.match(broken.errors.join('\n'), /duplikat.*G1/i);
  assert.match(broken.errors.join('\n'), /bez poprawnego ID/i);
  assert.match(broken.errors.join('\n'), /G9.*nie jest zadeklarowany/i);
  assert.match(broken.errors.join('\n'), /G1x.*mapie.*format/i);
  assert.match(broken.errors.join('\n'), /Mapa.*duplikat G1/i);
  assert.match(broken.errors.join('\n'), /nie-G1.*assessment.*format/i);
  assert.match(broken.errors.join('\n'), /format.*G1,/i);

  assert.equal(inspectGoalContract({ metadata, lessonMarkdown: '', assessmentMarkdown: '', slides: [] }), null);
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
