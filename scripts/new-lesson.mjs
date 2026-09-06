import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { lessonDirectory, normalizeLessonSlug } from './lesson-tools.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(message) {
  if (message) console.error(`Błąd: ${message}\n`);
  console.error('Użycie: npm run new -- --class 6 --title "Wielkie odkrycia geograficzne" [--type new-knowledge|practice]');
  process.exitCode = 1;
}

const grade = argument('--class');
const title = argument('--title');
const lessonType = argument('--type') || 'new-knowledge';
if (!grade || !title) {
  usage('Wymagane są parametry --class oraz --title.');
} else if (!['new-knowledge', 'practice'].includes(lessonType)) {
  usage('Parametr --type musi mieć wartość new-knowledge albo practice.');
} else {
  try {
    const slug = normalizeLessonSlug(title);
    const relativeTarget = lessonDirectory({ grade, slug });
    const target = path.resolve(process.cwd(), relativeTarget);
    const source = path.resolve(process.cwd(), 'template', 'lesson');

    await access(target).then(
      () => { throw new Error(`Katalog już istnieje: ${relativeTarget}`); },
      () => undefined,
    );
    await mkdir(path.dirname(target), { recursive: true });
    await cp(source, target, { recursive: true });

    const metadataPath = path.join(target, 'metadata.json');
    const lessonPath = path.join(target, 'lesson.md');
    const slidesPath = path.join(target, 'slides.md');
    const teacherGuidePath = path.join(target, 'teacher-guide.md');
    const studentSummaryPath = path.join(target, 'student-summary.md');
    const worksheetPath = path.join(target, 'worksheet.md');
    if (lessonType === 'practice') await rm(studentSummaryPath);
    const replacements = [
      [lessonPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
      [slidesPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
      [teacherGuidePath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
      ...(lessonType === 'new-knowledge' ? [[studentSummaryPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]]] : []),
      [worksheetPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
    ];

    for (const [file, tokens] of replacements) {
      let content = await readFile(file, 'utf8');
      for (const [token, value] of tokens) content = content.replaceAll(token, value);
      await writeFile(file, content, 'utf8');
    }

    const metadata = JSON.parse(await readFile(metadataPath, 'utf8'));
    metadata.id = slug;
    metadata.title = title;
    metadata.grade = Number(grade);
    metadata.lesson_type = lessonType;
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

    console.log(`Utworzono: ${relativeTarget}`);
    console.log('Następnie: ustal rok i wariant podstawy z curriculum/rollout-2026.md, uzupełnij lesson.md i sources.md, dodaj lokalne pliki do assets/, potem npm run check.');
  } catch (error) {
    usage(error.message);
  }
}
