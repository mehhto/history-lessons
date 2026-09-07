import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { auditSlideContract, parseSlideDirectives } from '../scripts/slide-contract.mjs';

const root = path.resolve(import.meta.dirname, '..');

async function lessonDirectories() {
  const classes = path.join(root, 'classes');
  const grades = await readdir(classes, { withFileTypes: true });
  const directories = [];
  for (const grade of grades.filter((entry) => entry.isDirectory())) {
    const lessons = await readdir(path.join(classes, grade.name), { withFileTypes: true });
    for (const lesson of lessons.filter((entry) => entry.isDirectory())) directories.push(path.join(classes, grade.name, lesson.name));
  }
  return directories;
}

test('every active lesson uses the shared bootstrap and declares an appearance', async () => {
  const lessons = await lessonDirectories();
  for (const lesson of lessons) {
    const [html, metadataText, slidesText] = await Promise.all([readFile(path.join(lesson, 'index.html'), 'utf8'), readFile(path.join(lesson, 'metadata.json'), 'utf8'), readFile(path.join(lesson, 'slides.md'), 'utf8')]);
    assert.match(html, /presentation\/boot\.mjs/, lesson);
    assert.doesNotMatch(html, /Reveal\.initialize\s*\(/, lesson);
    const metadata = JSON.parse(metadataText);
    assert.equal(typeof metadata.appearance?.style, 'string', lesson);
    assert.equal(typeof metadata.appearance?.palette, 'string', lesson);
    const contract = auditSlideContract(parseSlideDirectives(slidesText), { lessonType: metadata.lesson_type, kind: metadata.kind });
    assert.deepEqual(contract.errors, [], `${lesson}\n${contract.errors.join('\n')}`);
  }
});
