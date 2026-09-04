import path from 'node:path';

export const REQUIRED_LESSON_ENTRIES = [
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
];

export function normalizeLessonSlug(title) {
  const normalized = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) {
    throw new Error('Tytuł lekcji musi zawierać co najmniej jedną literę lub cyfrę.');
  }

  return normalized;
}

export function lessonDirectory({ grade, slug }) {
  const numericGrade = Number(grade);
  if (!Number.isInteger(numericGrade) || numericGrade < 4 || numericGrade > 8) {
    throw new Error('Klasa musi być liczbą z zakresu 4–8.');
  }

  const safeSlug = normalizeLessonSlug(slug);
  return path.posix.join('classes', String(numericGrade), safeSlug);
}

export function validateLessonPackage(entries) {
  const missing = REQUIRED_LESSON_ENTRIES.filter((entry) => !entries.has(entry));
  return { ok: missing.length === 0, missing };
}
