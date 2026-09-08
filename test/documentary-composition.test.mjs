import test from 'node:test';
import assert from 'node:assert/strict';
import { compositionIssues } from '../scripts/check-slide-composition.mjs';

test('composition checker warns about unintentional short top-aligned slides', () => {
  assert.match(compositionIssues({ purpose: 'explanation', layout: '', textLength: 35, html: '<p>Krótko.</p>' }).join('\n'), /krótki slajd/);
});

test('composition checker requires evidence media and complete task-board roles', () => {
  assert.match(compositionIssues({ purpose: 'evidence', layout: 'map-focus', textLength: 20, html: '<p>bez źródła</p>' }).join('\n'), /źródła/);
  assert.match(compositionIssues({ purpose: 'practice', layout: 'task-board', textLength: 20, html: '<div class="student-task"></div>' }).join('\n'), /kryterium/);
  assert.deepEqual(compositionIssues({ purpose: 'practice', layout: 'task-board', textLength: 80, html: '<div class="student-task"><span data-task-role="prompt"></span><span data-task-role="time"></span><span data-task-role="product"></span><span data-task-role="criterion"></span></div>' }), []);
});
