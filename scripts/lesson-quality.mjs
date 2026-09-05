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
  return { structure, technical, teacherApproval, ready: structure.ok && technical.ok && teacherApproval.ok };
}
