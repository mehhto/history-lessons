import { cp, mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { lessonDirectory, normalizeLessonSlug } from './lesson-tools.mjs';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function usage(message) {
  if (message) console.error(`Błąd: ${message}\n`);
  console.error('Użycie: npm run new -- --class 6 --title "Wielkie odkrycia geograficzne"');
  process.exitCode = 1;
}

const grade = argument('--class');
const title = argument('--title');
if (!grade || !title) {
  usage('Wymagane są parametry --class oraz --title.');
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
    const replacements = [
      [lessonPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
      [slidesPath, [['__TITLE__', title], ['__GRADE__', String(grade)]]],
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
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');

    console.log(`Utworzono: ${relativeTarget}`);
    console.log('Następnie: uzupełnij lesson.md i sources.md, dodaj lokalne pliki do assets/, potem npm run check.');
  } catch (error) {
    usage(error.message);
  }
}
