import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { isAllowedPreviewFile, isLessonPackageDirectory } from '../scripts/preview-scope.mjs';

const root = '/repo';
const lessonDirectory = path.join(root, 'classes/6/wyprawy');
const revealDirectory = path.join(root, 'template/reveal');
const componentsDirectory = path.join(root, 'template/components');
const themePath = path.join(root, 'template/theme.css');

const scope = { lessonDirectory, revealDirectory, componentsDirectory, themePath };

test('preview rejects classes and class directories as lesson scopes', () => {
  assert.equal(isLessonPackageDirectory(lessonDirectory, path.join(root, 'classes')), true);
  assert.equal(isLessonPackageDirectory(path.join(root, 'classes'), path.join(root, 'classes')), false);
  assert.equal(isLessonPackageDirectory(path.join(root, 'classes/6'), path.join(root, 'classes')), false);
  assert.equal(isLessonPackageDirectory(path.join(root, 'classes/6/wyprawy/assets'), path.join(root, 'classes')), false);
});

test('preview serves only the selected lesson and shared presentation assets', () => {
  assert.equal(isAllowedPreviewFile(path.join(lessonDirectory, 'assets/mapa.jpg'), scope), true);
  assert.equal(isAllowedPreviewFile(path.join(revealDirectory, 'reveal.js'), scope), true);
  assert.equal(isAllowedPreviewFile(path.join(componentsDirectory, 'lesson-components.js'), scope), true);
  assert.equal(isAllowedPreviewFile(themePath, scope), true);
});

test('preview rejects repository internals and other lessons', () => {
  assert.equal(isAllowedPreviewFile(path.join(root, '.git/HEAD'), scope), false);
  assert.equal(isAllowedPreviewFile(path.join(root, 'scripts/export-pdf.mjs'), scope), false);
  assert.equal(isAllowedPreviewFile(path.join(root, 'classes/6/inna-lekcja/index.html'), scope), false);
});
