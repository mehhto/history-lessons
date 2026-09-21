const MARKER = /\[(?:DECYZJA NAUCZYCIELA(?:\s*:[^\]]+)?|DO WERYFIKACJI|DO UZUPEŁNIENIA)\]/gi;
import { catalog } from '../template/presentation/catalog.mjs';
import { resolveAppearance } from '../template/presentation/appearance.mjs';
import { auditSlideContract, parseSlideDirectives } from './slide-contract.mjs';
const KINDS = new Set(['lesson', 'demo']);
const CURRICULUM_VERSIONS = new Set(['nowa-2026', 'stara-przejsciowa']);
const DECISION = /^\[DECYZJA NAUCZYCIELA(?:\s*:[^\]]+)?\]$/i;

export function expectedCurriculumVersion({ grade, schoolYear }) {
  const match = /^(\d{4})\/(\d{4})$/.exec(schoolYear);
  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new Error('Pole school_year musi mieć format RRRR/RRRR.');
  }
  const highestNewGrade = Math.min(8, Math.max(3, 4 + Number(match[1]) - 2026));
  return grade <= highestNewGrade ? 'nowa-2026' : 'stara-przejsciowa';
}

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
  if (metadata.kind === 'lesson') {
    const schoolYearPending = typeof metadata.school_year === 'string' && DECISION.test(metadata.school_year);
    const curriculumPending = typeof metadata.curriculum_version === 'string' && DECISION.test(metadata.curriculum_version);
    if (schoolYearPending || curriculumPending) {
      if (!schoolYearPending || !curriculumPending) {
        throw new Error('Pola school_year i curriculum_version muszą być wspólnie decyzją nauczyciela albo konkretnymi wartościami.');
      }
    } else {
      if (typeof metadata.school_year !== 'string') throw new Error('Pole school_year w metadata.json musi być tekstem.');
      const expected = expectedCurriculumVersion({ grade: metadata.grade, schoolYear: metadata.school_year });
      if (!CURRICULUM_VERSIONS.has(metadata.curriculum_version)) {
        throw new Error('Pole curriculum_version w metadata.json musi mieć wartość nowa-2026 albo stara-przejsciowa.');
      }
      if (metadata.curriculum_version !== expected) {
        throw new Error(`Dla klasy ${metadata.grade} w roku ${metadata.school_year} wymagany jest wariant ${expected}.`);
      }
    }
  }
  if (metadata.lesson_type !== undefined && !['new-knowledge', 'practice'].includes(metadata.lesson_type)) {
    throw new Error('Pole lesson_type w metadata.json musi mieć wartość new-knowledge albo practice.');
  }
  for (const field of ['source_reviewed', 'teacher_reviewed', 'offline_checked', 'pdf_exported']) {
    if (typeof metadata[field] !== 'boolean') {
      throw new Error(`Pole ${field} w metadata.json musi być true albo false.`);
    }
  }
  resolveAppearance(metadata.appearance, catalog);
  return metadata;
}

export function unresolvedMarkers(text) {
  return [...new Set(String(text).match(MARKER) || [])];
}

function section(markdown, heading) {
  const lines = String(markdown).split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp(`^##\\s+${heading}\\s*$`, 'i').test(line.trim()));
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line.trim()));
  return start === -1 ? [] : lines.slice(start + 1, end === -1 ? undefined : end);
}

const GOAL_ID = /^G[1-9]\d*$/;

export function inspectGoalContract({ metadata, lessonMarkdown, assessmentMarkdown, slides }) {
  if (metadata.goalContract === undefined) return null;
  const errors = [];
  const warnings = [];
  if (!metadata.goalContract || metadata.goalContract.version !== '1.0') {
    return { errors: ['Nieobsługiwana wersja goalContract; wymagane jest 1.0.'], warnings, goals: [] };
  }

  const goals = [];
  for (const line of section(lessonMarkdown, 'Cele w języku ucznia')) {
    if (!/^(?:\d+\.|[-*])\s+/.test(line.trim())) continue;
    const match = /^(?:\d+\.|[-*])\s+\*\*(G[1-9]\d*)\*\*\s+—\s+\S/.exec(line.trim());
    if (!match) {
      errors.push(`Cel „${line.trim()}” jest bez poprawnego ID G… lub opisu.`);
      continue;
    }
    if (goals.includes(match[1])) errors.push(`Deklaracja celu ma duplikat ${match[1]}.`);
    else goals.push(match[1]);
  }
  if (goals.length === 0 && errors.length === 0) errors.push('Brakuje deklaracji celów G… w sekcji „Cele w języku ucznia”.');
  const declared = new Set(goals);
  const requireDeclared = (goal, place) => {
    if (!declared.has(goal)) errors.push(`Cel ${goal} w ${place} nie jest zadeklarowany.`);
  };

  const matrixRows = section(lessonMarkdown, 'Cele\\s*→\\s*zadanie\\s*→\\s*dowód')
    .filter((line) => /^\|/.test(line.trim()) && !/^\|?\s*(?:ID|---)/i.test(line.trim()))
    .map((line) => line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim()));
  const matrixGoals = new Set();
  for (const row of matrixRows) {
    const goal = row[0];
    if (!goal) continue;
    if (!GOAL_ID.test(goal)) {
      errors.push(`ID „${goal}” w mapie cele → zadanie → dowód ma niepoprawny format.`);
      continue;
    }
    if (matrixGoals.has(goal)) errors.push(`Mapa cele → zadanie → dowód ma duplikat ${goal}.`);
    matrixGoals.add(goal);
    requireDeclared(goal, 'mapie cele → zadanie → dowód');
    if (!row[3]) warnings.push(`Cel ${goal} w mapie nie ma zadania.`);
    if (!row[4]) warnings.push(`Cel ${goal} w mapie nie ma dowodu.`);
  }

  const assessmentGoals = new Set();
  for (const line of section(assessmentMarkdown, 'Powiązanie z celami')) {
    const match = /^-\s+Sprawdzane cele:\s*(.*)$/i.exec(line.trim());
    if (!match || !match[1]) continue;
    for (const goal of match[1].split(',').map((value) => value.trim())) {
      if (!GOAL_ID.test(goal)) {
        errors.push(`ID „${goal}” w assessment ma niepoprawny format.`);
      } else if (assessmentGoals.has(goal)) {
        errors.push(`Assessment ma duplikat ${goal}.`);
      } else {
        assessmentGoals.add(goal);
        requireDeclared(goal, 'assessment');
      }
    }
  }
  for (const slide of slides || []) {
    for (const goal of slide.goals || []) {
      if (!GOAL_ID.test(goal)) errors.push(`data-goals slajdu „${slide.id || slide.index + 1}” ma niepoprawny format „${goal}”.`);
      else requireDeclared(goal, `slajdzie „${slide.id || slide.index + 1}”`);
    }
  }
  for (const goal of goals) {
    if (!matrixGoals.has(goal)) warnings.push(`Cel ${goal} nie ma wiersza w mapie cele → zadanie → dowód.`);
    if (!assessmentGoals.has(goal)) warnings.push(`Cel ${goal} nie jest wskazany w assessment.`);
  }
  return { errors: [...new Set(errors)], warnings: [...new Set(warnings)], goals };
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
  const slides = parseSlideDirectives(requiredContent?.['slides.md'] || '');
  const slideContract = auditSlideContract(slides, {
    lessonType: metadata.lesson_type,
    kind: metadata.kind,
  });
  const goalContract = inspectGoalContract({
    metadata,
    lessonMarkdown: lessonContent,
    assessmentMarkdown: requiredContent?.['assessment.md'] || '',
    slides,
  });
  return {
    structure,
    technical,
    teacherApproval,
    teachingWarnings,
    slideContract,
    goalContract,
    ready: structure.ok && technical.ok && teacherApproval.ok && slideContract.errors.length === 0 && !(goalContract?.errors.length),
  };
}
