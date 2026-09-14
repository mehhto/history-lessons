import path from 'node:path';

export const REQUIRED_LESSON_ENTRIES = [
  'lesson.md',
  'slides.md',
  'index.html',
  'lesson.css',
  'worksheet.md',
  'sources.md',
  'assessment.md',
  'teacher-guide.md',
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

export function nextLessonSequence(entries) {
  const numbers = entries
    .map((entry) => /^(\d{2})-/.exec(entry)?.[1])
    .filter(Boolean)
    .map(Number)
    .filter((number) => number > 0);
  const next = Math.max(0, ...numbers) + 1;
  if (next > 99) throw new Error('Klasa może zawierać najwyżej 99 numerowanych lekcji.');
  return String(next).padStart(2, '0');
}

export function numberedLessonSlug({ sequence, title, slug }) {
  if (!/^\d{2}$/.test(sequence) || sequence === '00') {
    throw new Error('Numer lekcji musi mieć postać 01–99.');
  }
  const base = normalizeLessonSlug(slug || title).replace(/^\d{2}-/, '');
  if (base.length > 48) {
    throw new Error('Nazwa katalogu jest zbyt długa. Podaj krótszą nazwę przez --slug.');
  }
  return `${sequence}-${base}`;
}

export function lessonDirectory({ grade, slug }) {
  const numericGrade = Number(grade);
  if (!Number.isInteger(numericGrade) || numericGrade < 4 || numericGrade > 8) {
    throw new Error('Klasa musi być liczbą z zakresu 4–8.');
  }

  const safeSlug = normalizeLessonSlug(slug);
  return path.posix.join('classes', String(numericGrade), safeSlug);
}

export function validateLessonIdentity({ directoryName, metadata }) {
  const issues = [];
  if (!/^(?!00)\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(directoryName)) {
    issues.push('Katalog lekcji musi mieć nazwę NN-krotki-slug.');
  }
  if (metadata.id !== directoryName) {
    issues.push('metadata.id musi być identyczne z nazwą katalogu.');
  }
  return issues;
}

export function validateLessonPackage(entries) {
  const missing = REQUIRED_LESSON_ENTRIES.filter((entry) => !entries.has(entry));
  return { ok: missing.length === 0, missing };
}
