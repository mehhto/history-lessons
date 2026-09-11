import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const cssUrl = new URL('../template/components/lesson-components.css', import.meta.url);
const jsUrl = new URL('../template/components/lesson-components.js', import.meta.url);

test('source media exposes controlled fit, readable captions and accessible gallery markup', async () => {
  const lessonCssUrl = new URL('../template/lesson/lesson.css', import.meta.url);
  const [css, js, lessonCss] = await Promise.all([
    readFile(cssUrl, 'utf8'),
    readFile(jsUrl, 'utf8'),
    readFile(lessonCssUrl, 'utf8'),
  ]);
  assert.match(css, /img\[data-fit="contain"\].*object-fit:\s*contain/);
  assert.match(css, /img\[data-fit="cover"\].*object-fit:\s*cover/);
  assert.match(css, /figcaption[^}]*font-size:\s*18px/);
  assert.match(lessonCss, /\.reveal \.source-figure figcaption\s*{[^}]*font-size:\s*20px/);
  assert.match(css, /\.student-task[^}]*font-size:\s*24px/);
  assert.match(js, /querySelectorAll\('\[data-gallery-item\]'\)/);
});

test('task-board retains the roles used by already-authored reference lessons', async () => {
  const css = await readFile(cssUrl, 'utf8');
  for (const role of ['prompt', 'time', 'product', 'criterion']) assert.match(css, new RegExp(`data-task-role="${role}"`));
});
