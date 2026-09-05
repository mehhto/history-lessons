import test from 'node:test';
import assert from 'node:assert/strict';
import { renderIssues } from '../scripts/render-check.mjs';

test('reports console errors and visible overflow without claiming visual approval', () => {
  assert.deepEqual(renderIssues({ consoleErrors: ['missing image'], overflow: ['#slide'] }), [
    'Błąd konsoli: missing image',
    'Przepełnienie: #slide',
  ]);
  assert.deepEqual(renderIssues({ consoleErrors: [], overflow: [] }), []);
});
