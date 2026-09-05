const MARKER = /\[(?:DECYZJA NAUCZYCIELA(?:\s*:[^\]]+)?|DO WERYFIKACJI|DO UZUPEŁNIENIA)\]/gi;
const KINDS = new Set(['lesson', 'demo']);

export function parseLessonMetadata(text) {
  let metadata;
  try {
    metadata = JSON.parse(text);
  } catch {
    throw new Error('metadata.json jest niepoprawnym JSON-em.');
  }
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('metadata.json musi zawierać obiekt.');
  }
  if (!KINDS.has(metadata.kind)) {
    throw new Error('Pole kind w metadata.json musi mieć wartość lesson albo demo.');
  }
  for (const field of ['id', 'title', 'status', 'curriculum_requirement', 'main_question']) {
    if (typeof metadata[field] !== 'string' || !metadata[field].trim()) {
      throw new Error(`Pole ${field} w metadata.json musi być niepustym tekstem.`);
    }
  }
  if (!Number.isInteger(metadata.grade) || metadata.grade < 4 || metadata.grade > 8) {
    throw new Error('Pole grade w metadata.json musi być liczbą 4–8.');
  }
  if (!Number.isInteger(metadata.duration_minutes) || metadata.duration_minutes <= 0) {
    throw new Error('Pole duration_minutes w metadata.json musi być dodatnią liczbą całkowitą.');
  }
  if (metadata.lesson_type !== undefined && !['new-knowledge', 'practice'].includes(metadata.lesson_type)) {
    throw new Error('Pole lesson_type w metadata.json musi mieć wartość new-knowledge albo practice.');
  }
  for (const field of ['source_reviewed', 'teacher_reviewed', 'offline_checked', 'pdf_exported']) {
    if (typeof metadata[field] !== 'boolean') {
      throw new Error(`Pole ${field} w metadata.json musi być true albo false.`);
    }
  }
  return metadata;
}

export function unresolvedMarkers(text) {
  return [...new Set(String(text).match(MARKER) || [])];
}

export function assessLessonQuality({ metadata, requiredFilesPresent, requiredContent, artifacts }) {
  const markers = Object.entries(requiredContent || {})
    .flatMap(([file, content]) => unresolvedMarkers(content).map((marker) => `${file}: ${marker}`));
  const structure = {
    ok: Boolean(requiredFilesPresent),
    issues: requiredFilesPresent ? [] : ['Brakuje wymaganych plików pakietu.'],
  };
  const technicalIssues = [];
  if (!metadata.offline_checked) technicalIssues.push('Nie potwierdzono działania offline.');
  if (!metadata.pdf_exported || !artifacts?.presentationPdf) technicalIssues.push('Brakuje aktualnego PDF prezentacji.');
  if (!artifacts?.printPack) technicalIssues.push('Brakuje pełnego, aktualnego pakietu A4.');
  const technical = { ok: technicalIssues.length === 0, issues: technicalIssues };
  const approvalRequired = metadata.kind === 'lesson';
  const approvalIssues = [];
  if (approvalRequired && !metadata.teacher_reviewed) approvalIssues.push('Lekcja czeka na przegląd nauczyciela.');
  if (approvalRequired && !metadata.source_reviewed) approvalIssues.push('Nie potwierdzono przeglądu źródeł.');
  if (approvalRequired && markers.length) approvalIssues.push(...markers.map((marker) => `Nierozwiązany znacznik: ${marker}`));
  const teacherApproval = { required: approvalRequired, ok: approvalIssues.length === 0, issues: approvalIssues };
  const lessonContent = requiredContent?.['lesson.md'] || '';
  const studentSummary = requiredContent?.['student-summary.md'] || '';
  const teacherGuide = requiredContent?.['teacher-guide.md'] || '';
  const teachingIssues = [];
  if (metadata.kind === 'lesson') {
    if (!metadata.lesson_type) teachingIssues.push('Brakuje jawnie wskazanego typu lekcji.');
    if (!/##\s+Cele\s*→\s*zadanie\s*→\s*dowód/i.test(lessonContent)) {
      teachingIssues.push('Brakuje mapy: wymaganie → treść → zadanie → dowód.');
    }
    if (metadata.lesson_type === 'new-knowledge' && !/##\s+Pełne minimum wiedzy/i.test(lessonContent)) {
      teachingIssues.push('Lekcja nowej wiedzy nie ma pełnego minimum wiedzy.');
    }
    if (metadata.lesson_type === 'new-knowledge' && !studentSummary.trim()) {
      teachingIssues.push('Lekcja nowej wiedzy nie ma podsumowania ucznia.');
    }
    if (!/##\s+Trudne momenty i notatki nauczyciela/i.test(teacherGuide)) {
      teachingIssues.push('Brakuje sekcji trudnych momentów i notatek nauczyciela.');
    }
  }
  const teachingWarnings = { ok: teachingIssues.length === 0, issues: teachingIssues };
  return { structure, technical, teacherApproval, teachingWarnings, ready: structure.ok && technical.ok && teacherApproval.ok };
}
